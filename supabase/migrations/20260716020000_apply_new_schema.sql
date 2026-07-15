-- ============================================================================
-- 20260716020000_apply_new_schema.sql
--
-- TARGET: Supabase PREVIEW project (the one linked to the GitHub "main"
-- branch). Do NOT run this against the Production project linked to "dev"
-- — that one should receive manual-migrations/dev_restore_previous_schema.sql
-- instead.
--
-- This consolidates, in dependency order, every schema change the current
-- codebase's "artists and companies architecture" feature depends on:
--   1. create_companies_and_artist_companies.sql
--   2. create_organization_applications.sql
--   3. add_company_id_to_organization_applications.sql
--   4. add_org_application_portfolio_text.sql
--   5. update_org_application_logo_and_drop_fields.sql   (destructive part backed up, see step 5)
--   6. add_company_ai_draft.sql
--   7. add_company_source_materials.sql
--   8. add_artist_view_count.sql
--
-- Written to be idempotent / safely re-runnable: every table uses
-- `create table if not exists` + `alter table ... add column if not exists`
-- per column, constraints/triggers are dropped-then-recreated rather than
-- assumed absent, and RLS policies use `drop policy if exists` before
-- `create policy`. Running this twice, or against a database that already
-- has some of this (e.g. a Preview branch cloned from a production snapshot
-- that already has organization_applications data), is safe.
--
-- NOT COVERED BY SQL — do separately after this file:
--   - Storage buckets "org-applications" and "company-source-files" (private,
--     pdf/docx/txt, 20MB limit) are created via the Storage API, not SQL.
--     Run: npx tsx scripts/createOrgBucket.ts
--          npx tsx scripts/createCompanySourceBucket.ts
--     against this project's SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.
--   - logo_url is expected to point into the existing public "artist-media"
--     bucket (already used for artist profile images) — no new bucket needed
--     for that one.
-- ============================================================================


-- ============================================================================
-- 0. PRE-FLIGHT CHECK — run first, read the output. If this Preview database
--    was branched from a production snapshot, organization_applications may
--    already exist with real rows — the backup step in section 5 matters if so.
-- ============================================================================

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('companies', 'artist_companies', 'organization_applications');

select count(*) as organization_applications_rows
from information_schema.tables t
join lateral (
  select count(*) from public.organization_applications
) c(count) on true
where t.table_schema = 'public' and t.table_name = 'organization_applications';


begin;

-- ============================================================================
-- 1. public.companies
-- ============================================================================

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

-- No admin-role policy: admin read/write goes through the service-role
-- client (getSupabaseServer()), which bypasses RLS entirely.


-- ============================================================================
-- 2. public.artist_companies
-- ============================================================================

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

drop index if exists artist_companies_unique_relation_idx;
create unique index if not exists artist_companies_unique_relation_idx
  on public.artist_companies (artist_id, company_id, coalesce(lower(trim(role)), ''));

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

drop policy if exists "Public can read published artist-company links" on public.artist_companies;
create policy "Public can read published artist-company links"
  on public.artist_companies
  for select
  to anon, authenticated
  using (
    exists (select 1 from public.artists a where a.id = artist_id and a.status = 'published')
    and exists (select 1 from public.companies c where c.id = company_id and c.status = 'published')
  );

-- No insert/update/delete policy on purpose — service-role-only writes.


-- ============================================================================
-- 3. public.organization_applications
-- ============================================================================

create table if not exists public.organization_applications (
  id uuid primary key default gen_random_uuid(),

  org_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  instagram text not null,

  website text,
  description text,

  resume_file_path text,
  resume_file_name text,

  status text not null default 'pending'
    check (status in ('pending', 'contacted', 'completed', 'rejected')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_applications_status_created_at_idx
  on public.organization_applications (status, created_at desc);

create or replace function public.set_organization_applications_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_organization_applications_updated_at on public.organization_applications;
create trigger trg_organization_applications_updated_at
  before update on public.organization_applications
  for each row
  execute function public.set_organization_applications_updated_at();

alter table public.organization_applications enable row level security;
-- No anon/authenticated policies on purpose — this table is only ever
-- reached through service-role server routes.


-- ============================================================================
-- 4. add_company_id_to_organization_applications.sql
-- ============================================================================

alter table public.organization_applications
  add column if not exists company_id uuid;

alter table public.organization_applications
  drop constraint if exists organization_applications_company_id_fkey;
alter table public.organization_applications
  add constraint organization_applications_company_id_fkey
  foreign key (company_id) references public.companies (id) on delete set null;

create index if not exists organization_applications_company_id_idx
  on public.organization_applications (company_id);

update public.organization_applications
  set status = 'approved'
  where status in ('contacted', 'completed');

alter table public.organization_applications
  drop constraint if exists organization_applications_status_check;
alter table public.organization_applications
  add constraint organization_applications_status_check
  check (status in ('pending', 'approved', 'rejected'));


-- ============================================================================
-- 5. Application form field changes: add portfolio_text + logo_url,
--    drop website + description.
--
--    WARNING — DESTRUCTIVE STEP. organization_applications may already carry
--    real submitted rows (e.g. if this Preview DB was branched from a
--    production snapshot). Any website/description text already collected
--    is backed up into deprecated_website_description_backup below BEFORE
--    the columns are dropped — nothing is silently discarded.
-- ============================================================================

alter table public.organization_applications
  add column if not exists portfolio_text text;

alter table public.organization_applications
  add column if not exists logo_url text;

-- Backup first.
alter table public.organization_applications
  add column if not exists deprecated_website_description_backup jsonb;

update public.organization_applications
set deprecated_website_description_backup =
  coalesce(deprecated_website_description_backup, '{}'::jsonb)
  || jsonb_strip_nulls(jsonb_build_object('website', website, 'description', description))
where (website is not null or description is not null)
  and deprecated_website_description_backup is null;

-- Then drop.
alter table public.organization_applications drop column if exists website;
alter table public.organization_applications drop column if exists description;


-- ============================================================================
-- 6. add_company_ai_draft.sql
-- ============================================================================

alter table public.companies add column if not exists ai_draft jsonb;
alter table public.companies add column if not exists ai_draft_status text not null default 'not_started';
alter table public.companies add column if not exists ai_draft_generated_at timestamptz;
alter table public.companies add column if not exists ai_draft_error text;

alter table public.companies drop constraint if exists companies_ai_draft_status_check;
alter table public.companies add constraint companies_ai_draft_status_check
  check (ai_draft_status in ('not_started', 'processing', 'ready', 'failed', 'applied'));


-- ============================================================================
-- 7. add_company_source_materials.sql
-- ============================================================================

alter table public.companies add column if not exists source_file_path text;
alter table public.companies add column if not exists source_file_name text;
alter table public.companies add column if not exists source_file_size bigint;
alter table public.companies add column if not exists source_file_uploaded_at timestamptz;
alter table public.companies add column if not exists source_text text;
alter table public.companies add column if not exists source_material_updated_at timestamptz;
alter table public.companies add column if not exists ai_draft_source_summary jsonb;


-- ============================================================================
-- 8. add_artist_view_count.sql
-- ============================================================================

alter table public.artists
  add column if not exists view_count bigint not null default 0;

create index if not exists artists_view_count_idx
  on public.artists (view_count desc);

create or replace function public.increment_artist_view_count(identifier text)
returns bigint
language plpgsql
as $$
declare
  new_count bigint;
begin
  update public.artists
  set view_count = view_count + 1
  where status = 'published'
    and (id::text = identifier or slug = identifier)
  returning view_count into new_count;

  return new_count;
end;
$$;

commit;


-- ============================================================================
-- 9. VERIFY — run after the above.
-- ============================================================================

-- Expect: companies, artist_companies, organization_applications all present.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('companies', 'artist_companies', 'organization_applications')
order by table_name;

-- Expect: full column list on companies includes ai_draft*/source_*/current_activity/works/etc.
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'companies' order by column_name;

-- Expect: organization_applications has company_id/portfolio_text/logo_url, no website/description.
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'organization_applications' order by column_name;

-- Expect: artists has view_count.
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'artists' and column_name = 'view_count';

-- Row count sanity check — should match section 0's baseline (no rows lost).
select count(*) as organization_applications_total from public.organization_applications;

-- Any row with backed-up old field data — review before you consider the
-- migration fully "clean".
select id, org_name, deprecated_website_description_backup
from public.organization_applications
where deprecated_website_description_backup is not null;
