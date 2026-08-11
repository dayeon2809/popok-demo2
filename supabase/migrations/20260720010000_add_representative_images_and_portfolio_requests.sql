-- ============================================================================
-- 20260720010000_add_representative_images_and_portfolio_requests.sql
--
-- 1) companies.representative_images — up to 3 "brand mood" images shown in a
--    gallery near the top of the company detail page. Deliberately separate
--    from `works` (per-work images) — nothing here is derived from works.
-- 2) company_portfolio_requests — an artist sending their portfolio to a
--    company's current representative ("포퐄 보내기").
--
-- Run this in the Supabase SQL Editor against the connected project — nothing
-- in this repo applies migrations automatically (confirmed no DATABASE_URL /
-- direct Postgres connection is available to this environment; the live
-- schema was inspected via the PostgREST OpenAPI endpoint + service-role
-- client only, which cannot execute DDL).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) representative_images
-- ----------------------------------------------------------------------------

alter table public.companies
  add column if not exists representative_images jsonb not null default '[]'::jsonb;

-- Defensive: only ever a JSON array (mirrors the existing works/history/etc. checks).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'companies_representative_images_is_array'
  ) then
    alter table public.companies
      add constraint companies_representative_images_is_array
      check (jsonb_typeof(representative_images) = 'array');
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2) company_portfolio_requests
-- ----------------------------------------------------------------------------

create table if not exists public.company_portfolio_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  company_id uuid not null references public.companies (id) on delete cascade,
  artist_id uuid not null references public.artists (id) on delete cascade,

  -- Snapshot of who the current primary+current representative was at send
  -- time — historical record only. Access control for "received requests"
  -- is NEVER based on this column (see RLS below); it always re-resolves the
  -- CURRENT representative via artist_companies, so a rep change after the
  -- fact doesn't hide old requests from the new rep. Nullable: a company can
  -- have no representative yet and still receive requests (queued by
  -- company_id until someone claims the rep role).
  recipient_artist_id uuid references public.artists (id) on delete set null,

  message text,
  status text not null default 'pending'
    check (status in ('pending', 'viewed', 'accepted', 'declined', 'withdrawn'))
);

create index if not exists company_portfolio_requests_company_idx
  on public.company_portfolio_requests (company_id);
create index if not exists company_portfolio_requests_artist_idx
  on public.company_portfolio_requests (artist_id);
create index if not exists company_portfolio_requests_recipient_idx
  on public.company_portfolio_requests (recipient_artist_id);
create index if not exists company_portfolio_requests_status_idx
  on public.company_portfolio_requests (status);

-- One live (pending/viewed) request per (artist, company) — the actual
-- duplicate-prevention guard the API also checks explicitly before insert;
-- this is the DB-level backstop for the same race a partial unique index
-- protects against elsewhere in this schema (see artist_companies_primary_current_idx).
create unique index if not exists company_portfolio_requests_live_unique_idx
  on public.company_portfolio_requests (artist_id, company_id)
  where status in ('pending', 'viewed');

drop trigger if exists trg_company_portfolio_requests_updated_at on public.company_portfolio_requests;
create trigger trg_company_portfolio_requests_updated_at
  before update on public.company_portfolio_requests
  for each row
  execute function public.set_updated_at();

alter table public.company_portfolio_requests enable row level security;

-- Insert: any authenticated user may insert, but only using an artist_id they
-- actually own — this is the "artist_id 위조 금지" requirement. (Self-company /
-- already-a-member checks are business rules enforced in the API route, not
-- something a generic RLS check can see without extra joins the app already
-- has cheaply available.)
drop policy if exists "Senders can create requests with their own artist_id" on public.company_portfolio_requests;
create policy "Senders can create requests with their own artist_id"
  on public.company_portfolio_requests
  for insert
  to authenticated
  with check (
    artist_id in (select id from public.artists where owner_id = auth.uid())
  );

-- Select: the sender sees their own requests...
drop policy if exists "Senders can view their own requests" on public.company_portfolio_requests;
create policy "Senders can view their own requests"
  on public.company_portfolio_requests
  for select
  to authenticated
  using (
    artist_id in (select id from public.artists where owner_id = auth.uid())
  );

-- ...and whoever is CURRENTLY the primary+current representative of the
-- target company sees requests sent to that company — re-resolved live via
-- artist_companies on every query, so a representative change is reflected
-- immediately (old rep loses access, new rep gains it) without touching
-- existing request rows.
drop policy if exists "Current company reps can view requests to their company" on public.company_portfolio_requests;
create policy "Current company reps can view requests to their company"
  on public.company_portfolio_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.artist_companies ac
      join public.artists a on a.id = ac.artist_id
      where ac.company_id = company_portfolio_requests.company_id
        and ac.is_current = true
        and ac.is_primary = true
        and a.owner_id = auth.uid()
    )
  );

-- Update: sender may only withdraw their own request.
drop policy if exists "Senders can withdraw their own requests" on public.company_portfolio_requests;
create policy "Senders can withdraw their own requests"
  on public.company_portfolio_requests
  for update
  to authenticated
  using (
    artist_id in (select id from public.artists where owner_id = auth.uid())
  )
  with check (
    status = 'withdrawn'
    and artist_id in (select id from public.artists where owner_id = auth.uid())
  );

-- Update: current company rep may mark viewed, or accept/decline.
drop policy if exists "Current company reps can update request status" on public.company_portfolio_requests;
create policy "Current company reps can update request status"
  on public.company_portfolio_requests
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.artist_companies ac
      join public.artists a on a.id = ac.artist_id
      where ac.company_id = company_portfolio_requests.company_id
        and ac.is_current = true
        and ac.is_primary = true
        and a.owner_id = auth.uid()
    )
  )
  with check (
    status in ('viewed', 'accepted', 'declined')
  );

-- NOTE: every API route in this repo actually performs writes through the
-- service-role client (lib/supabaseServer.ts getSupabaseServer(), which
-- bypasses RLS entirely) and does its own explicit ownership/business-rule
-- checks in code — matching every other route in this codebase (see
-- app/api/companies/[id]/update, app/api/companies/claim-request). The
-- policies above are the same defense-in-depth layer the rest of this schema
-- already has (companies, artists, artist_companies all do this too), not
-- the primary enforcement mechanism.
