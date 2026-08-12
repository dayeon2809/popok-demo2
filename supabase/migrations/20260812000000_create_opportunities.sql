-- Proposal only. Do not apply to production without review and approval.
create extension if not exists pgcrypto;

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('manual','artmore','gokams_notice','gokams_event','artnuri')),
  external_id text,
  source_url text not null,
  canonical_source_url text not null,
  original_publisher_url text,
  ingestion_type text not null check (ingestion_type in ('manual','scraped')),
  title text not null,
  normalized_title text not null,
  organization text not null,
  normalized_organization text not null,
  opportunity_type text not null check (opportunity_type in ('grant','open_call','audition','job','education','residency','space','event','other')),
  target_audience text[] not null default '{}',
  art_genres text[] not null default '{}',
  region text,
  summary text,
  description text,
  application_method text,
  application_url text,
  contact text,
  thumbnail_url text,
  published_at timestamptz,
  application_start_at timestamptz,
  deadline timestamptz,
  lifecycle_status text not null default 'undated' check (lifecycle_status in ('open','upcoming','closed','undated')),
  review_status text not null default 'needs_review' check (review_status in ('needs_review','approved','rejected')),
  publication_status text not null default 'draft' check (publication_status in ('draft','published','hidden')),
  is_featured boolean not null default false,
  is_verified boolean not null default false,
  last_scraped_at timestamptz,
  raw_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunities_source_external_id_unique unique (source, external_id),
  constraint opportunities_source_url_unique unique (source, canonical_source_url)
);

create index if not exists opportunities_public_list_idx on public.opportunities (publication_status, is_verified, is_featured desc, deadline, published_at desc);
create index if not exists opportunities_filter_idx on public.opportunities using gin (art_genres);

create or replace function public.set_opportunity_derived_fields()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  new.lifecycle_status := case
    when new.deadline is null then 'undated'
    when new.deadline < now() then 'closed'
    when new.application_start_at is not null and new.application_start_at > now() then 'upcoming'
    else 'open'
  end;
  return new;
end;
$$;

drop trigger if exists opportunities_set_derived_fields on public.opportunities;
create trigger opportunities_set_derived_fields before insert or update on public.opportunities for each row execute function public.set_opportunity_derived_fields();

create table if not exists public.opportunity_duplicate_candidates (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  candidate_opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  reason text not null,
  confidence numeric(5,4) not null check (confidence between 0 and 1),
  review_status text not null default 'pending' check (review_status in ('pending','confirmed','dismissed')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (opportunity_id, candidate_opportunity_id)
);

create table if not exists public.opportunity_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  mode text not null check (mode in ('dry_run','apply')),
  status text not null check (status in ('running','completed','failed')),
  pages_checked integer not null default 0,
  items_found integer not null default 0,
  items_parsed integer not null default 0,
  items_failed integer not null default 0,
  summary jsonb not null default '{}',
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.opportunities enable row level security;
alter table public.opportunity_duplicate_candidates enable row level security;
alter table public.opportunity_ingestion_runs enable row level security;

drop policy if exists "public can read verified opportunities" on public.opportunities;
create policy "public can read verified opportunities" on public.opportunities for select to anon, authenticated using (publication_status = 'published' and is_verified = true and review_status = 'approved');
-- Writes intentionally have no anon/authenticated policies. Server admin APIs use the service role after checkAdminAuth().
