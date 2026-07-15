-- ============================================================================
-- create_companies_and_artist_companies.sql
--
-- Introduces a dedicated public.companies table for organization profiles,
-- plus a many-to-many public.artist_companies join table linking individual
-- artists to companies. This replaces the earlier idea of using
-- artists.artist_type = 'organization' for public company discovery —
-- artist_type is left in place (not dropped) but is no longer used for
-- public company browsing going forward.
--
-- Column roles, so they don't get conflated:
--   artist_companies   -> official POPOK-to-POPOK connection between an
--                         artist row and a companies row
--   artists.company    -> free-text fallback name for a company not yet
--                         registered on POPOK (never auto-matched by name)
--   artists.affiliations -> past affiliations / project history (unrelated
--                         to the current-company concept here)
--
-- Written to be safely re-runnable: `create table if not exists` plus a
-- follow-up `alter table ... add column if not exists` for every column (in
-- case a partial run already created the table), constraints/triggers are
-- dropped-then-recreated rather than assumed absent, and RLS policies use
-- `drop policy if exists` before `create policy`.
--
-- Review this file in the Supabase SQL Editor before running. Nothing here
-- runs automatically.
-- ============================================================================

-- ── 1. public.companies ──────────────────────────────────────────────────

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid()
);

alter table public.companies add column if not exists created_at timestamptz not null default now();
alter table public.companies add column if not exists updated_at timestamptz not null default now();

alter table public.companies add column if not exists status text not null default 'draft';
alter table public.companies add column if not exists verified boolean not null default false;

alter table public.companies add column if not exists name text;
alter table public.companies add column if not exists name_en text;
alter table public.companies add column if not exists slug text;

alter table public.companies add column if not exists genre text;
alter table public.companies add column if not exists category text;
alter table public.companies add column if not exists city_or_region text;

alter table public.companies add column if not exists bio_short text;
alter table public.companies add column if not exists bio text;

alter table public.companies add column if not exists profile_image_url text;
alter table public.companies add column if not exists profile_image_urls jsonb not null default '[]'::jsonb;
alter table public.companies add column if not exists motion_video_url text;

alter table public.companies add column if not exists email text;
alter table public.companies add column if not exists instagram text;
alter table public.companies add column if not exists website text;
alter table public.companies add column if not exists portfolio_url text;

alter table public.companies add column if not exists current_activity jsonb not null default '[]'::jsonb;
alter table public.companies add column if not exists works jsonb not null default '[]'::jsonb;
alter table public.companies add column if not exists awards jsonb not null default '[]'::jsonb;
alter table public.companies add column if not exists review_links jsonb not null default '[]'::jsonb;
alter table public.companies add column if not exists links jsonb not null default '[]'::jsonb;

alter table public.companies add column if not exists owner_id uuid;

-- name is required going forward; only enforce not-null once any
-- pre-existing rows (from a partial prior run) have been backfilled.
do $$
begin
  if not exists (select 1 from public.companies where name is null) then
    alter table public.companies alter column name set not null;
  end if;
end $$;

alter table public.companies drop constraint if exists companies_status_check;
alter table public.companies add constraint companies_status_check
  check (status in ('draft', 'published', 'archived'));

alter table public.companies drop constraint if exists companies_owner_id_fkey;
alter table public.companies add constraint companies_owner_id_fkey
  foreign key (owner_id) references auth.users (id) on delete set null;

drop index if exists companies_slug_key;
create unique index if not exists companies_slug_key
  on public.companies (slug)
  where slug is not null;

create index if not exists companies_status_idx on public.companies (status);
create index if not exists companies_name_idx on public.companies (name);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_companies_updated_at on public.companies;
create trigger trg_companies_updated_at
  before update on public.companies
  for each row
  execute function public.set_updated_at();

alter table public.companies enable row level security;

drop policy if exists "Public can view published companies" on public.companies;
create policy "Public can view published companies"
  on public.companies
  for select
  to anon, authenticated
  using (status = 'published');

-- Lets a company's owner see their own row even while it's still 'draft' —
-- needed once a self-service company dashboard/edit flow exists; not built
-- in this change, but the policy shouldn't have to be added later.
drop policy if exists "Owners can view their companies" on public.companies;
create policy "Owners can view their companies"
  on public.companies
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Owners can update their companies" on public.companies;
create policy "Owners can update their companies"
  on public.companies
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- No admin-role policy: like every other table in this project, admin
-- read/write goes through the service-role client (getSupabaseServer()),
-- which bypasses RLS entirely (see create_performances.sql / create_performance_artists.sql).

-- ── 2. public.artist_companies ───────────────────────────────────────────

create table if not exists public.artist_companies (
  id uuid primary key default gen_random_uuid()
);

alter table public.artist_companies add column if not exists created_at timestamptz not null default now();
alter table public.artist_companies add column if not exists updated_at timestamptz not null default now();

alter table public.artist_companies add column if not exists artist_id uuid;
alter table public.artist_companies add column if not exists company_id uuid;

alter table public.artist_companies add column if not exists role text;
alter table public.artist_companies add column if not exists start_year integer;
alter table public.artist_companies add column if not exists end_year integer;

alter table public.artist_companies add column if not exists is_current boolean not null default true;
alter table public.artist_companies add column if not exists is_primary boolean not null default false;

do $$
begin
  if not exists (select 1 from public.artist_companies where artist_id is null) then
    alter table public.artist_companies alter column artist_id set not null;
  end if;
  if not exists (select 1 from public.artist_companies where company_id is null) then
    alter table public.artist_companies alter column company_id set not null;
  end if;
end $$;

alter table public.artist_companies drop constraint if exists artist_companies_artist_id_fkey;
alter table public.artist_companies add constraint artist_companies_artist_id_fkey
  foreign key (artist_id) references public.artists (id) on delete cascade;

alter table public.artist_companies drop constraint if exists artist_companies_company_id_fkey;
alter table public.artist_companies add constraint artist_companies_company_id_fkey
  foreign key (company_id) references public.companies (id) on delete cascade;

create index if not exists artist_companies_artist_idx on public.artist_companies (artist_id);
create index if not exists artist_companies_company_idx on public.artist_companies (company_id);

-- Postgres can't express a unique constraint over an expression via the
-- plain `unique(...)` table constraint syntax, so this has to be a unique
-- index. Normalizes role's case/whitespace so "Dancer" and " dancer " don't
-- both slip in as "different" relations for the same artist+company.
drop index if exists artist_companies_unique_relation_idx;
create unique index if not exists artist_companies_unique_relation_idx
  on public.artist_companies (artist_id, company_id, coalesce(lower(trim(role)), ''));

-- Only one "current, primary" affiliation per artist at a time.
drop index if exists artist_companies_primary_current_idx;
create unique index if not exists artist_companies_primary_current_idx
  on public.artist_companies (artist_id)
  where is_primary = true and is_current = true;

drop trigger if exists trg_artist_companies_updated_at on public.artist_companies;
create trigger trg_artist_companies_updated_at
  before update on public.artist_companies
  for each row
  execute function public.set_updated_at();

alter table public.artist_companies enable row level security;

-- Public read only when both sides of the relation are published — app code
-- (lib/companies.ts) filters by company status again anyway, but the policy
-- itself shouldn't leak a draft company's existence via this join table.
drop policy if exists "Public can read published artist-company links" on public.artist_companies;
create policy "Public can read published artist-company links"
  on public.artist_companies
  for select
  to anon, authenticated
  using (
    exists (select 1 from public.artists a where a.id = artist_id and a.status = 'published')
    and exists (select 1 from public.companies c where c.id = company_id and c.status = 'published')
  );

-- No insert/update/delete policy is defined on purpose: with RLS enabled and
-- no write policy, only the service-role client can write here, which is
-- exactly "admin-only for now" without needing a bespoke admin-role check.
