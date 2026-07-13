-- ============================================================================
-- create_performances.sql
--
-- Confirmed via live schema inspection (2026-07-14, service-role REST OpenAPI
-- introspection): there is currently NO "performances" table in this Supabase
-- project. Live tables are: profiles, popok_upload_requests, artist_submissions,
-- artists, submissions. This migration creates the table from scratch.
--
-- Column/type conventions mirror the existing "artists" table (uuid pk via
-- gen_random_uuid(), timestamptz created_at/updated_at default now(), a single
-- text "status" column rather than a separate boolean, "genre"/"category" as
-- parallel text columns).
--
-- Review this file in the Supabase SQL Editor before running. Nothing here
-- runs automatically.
-- ============================================================================

create table if not exists public.performances (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  slug text,

  description text,

  poster_url text,
  source_url text,
  ticket_url text,

  venue text,
  start_date date,
  end_date date,

  organizer text,
  genre text,
  category text,

  -- 'draft' | 'published' | 'archived' — same convention as artists.status.
  -- No separate boolean "published" column: app code derives it from status
  -- to avoid the two ever drifting out of sync.
  status text not null default 'draft',

  -- Manual editorial pick for homepage/curated placement (getFeaturedPerformances()).
  -- Independent of status — a performance can be published but not featured.
  featured boolean not null default false,

  -- Dedupe key for the performance crawler/sync scripts (scripts/migrateSlugsToSupabase.ts
  -- already queries performances by this column name).
  external_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists performances_slug_key
  on public.performances (slug)
  where slug is not null;

create unique index if not exists performances_external_id_key
  on public.performances (external_id)
  where external_id is not null;

create index if not exists performances_status_start_date_idx
  on public.performances (status, start_date);

create index if not exists performances_featured_idx
  on public.performances (featured)
  where featured = true;

-- Keep updated_at current on every row update.
create or replace function public.set_performances_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_performances_updated_at on public.performances;
create trigger trg_performances_updated_at
  before update on public.performances
  for each row
  execute function public.set_performances_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────
-- Service-role queries (lib/performances.ts, admin routes) bypass RLS entirely,
-- so these policies only govern anon/public access if it's ever used directly.
alter table public.performances enable row level security;

drop policy if exists "Public can read published performances" on public.performances;
create policy "Public can read published performances"
  on public.performances
  for select
  to anon, authenticated
  using (status = 'published');
