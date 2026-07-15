-- ============================================================================
-- dev_restore_previous_schema.sql
--
-- TARGET: Supabase PRODUCTION project (the one linked to the GitHub "dev"
-- branch). Do NOT run this against the Preview project linked to "main" —
-- that one should receive [timestamp]_apply_new_schema.sql instead.
--
-- WHY THIS FILE EXISTS
-- Commit 510f015 ("feat: artists and companies architecture", 2026-07-16)
-- landed directly on "dev" together with its schema migrations
-- (create_companies_and_artist_companies.sql, create_organization_applications.sql,
-- add_company_id_to_organization_applications.sql, add_artist_view_count.sql),
-- plus further uncommitted work on top (add_company_ai_draft.sql,
-- add_company_source_materials.sql, add_org_application_portfolio_text.sql,
-- update_org_application_logo_and_drop_fields.sql). That work is meant for
-- "main" (Preview) while it's still being built out. This script undoes the
-- schema side of it on production, in case any of those migration files were
-- already manually run there via the SQL Editor.
--
-- This script is defensive by design: every step checks information_schema
-- before acting, so running it against a database where none of the new
-- schema was ever applied is a safe no-op, and running it twice in a row is
-- also safe.
--
-- NEVER RUN BLINDLY. Read section 0's output first. Sections 2 and 4 contain
-- irreversible data-shape decisions called out with WARNING banners — read
-- those before running.
-- ============================================================================


-- ============================================================================
-- 0. PRE-FLIGHT CHECK — run this block FIRST, on its own, and read the
--    output before running anything below. It tells you which of the new
--    structures actually exist on THIS database right now.
-- ============================================================================

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('companies', 'artist_companies', 'organization_applications');

select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'artists' and column_name = 'view_count';

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'organization_applications'
  and column_name in ('company_id', 'portfolio_text', 'logo_url', 'website', 'description');

-- Row counts — if these are > 0, the "new" structure has real data on this
-- database and the backup/rename steps below matter; if the tables don't
-- exist at all, skip straight to committing an empty transaction (nothing
-- to restore).
select
  (select count(*) from public.companies) as companies_rows,
  (select count(*) from public.artist_companies) as artist_companies_rows
where exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'companies');


-- ============================================================================
-- 1. Backup and remove the companies / artist_companies tables
--
--    These two tables did not exist before 510f015 at all — there is no
--    "previous version" of them to revert to, only "did not exist". Rather
--    than DROP TABLE (which destroys any admin-entered draft/published
--    company data instantly and irreversibly), this renames them out of the
--    public.companies / public.artist_companies names so the app's queries
--    against those names simply find nothing (matching the pre-510f015
--    behavior), while every row is still sitting on disk, recoverable, under
--    the *_deprecated_20260716 name.
--
--    Once you've confirmed (via section 0 above, or after running this) that
--    you don't need that data, you can DROP TABLE the *_deprecated_20260716
--    tables yourself — that step is deliberately NOT automated here.
-- ============================================================================

begin;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'artist_companies') then
    execute 'alter table public.artist_companies rename to artist_companies_deprecated_20260716';
    raise notice 'Renamed public.artist_companies -> public.artist_companies_deprecated_20260716';
  else
    raise notice 'public.artist_companies does not exist — nothing to rename';
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'companies') then
    execute 'alter table public.companies rename to companies_deprecated_20260716';
    raise notice 'Renamed public.companies -> public.companies_deprecated_20260716';
  else
    raise notice 'public.companies does not exist — nothing to rename';
  end if;
end $$;

commit;


-- ============================================================================
-- 2. organization_applications — roll back ONLY the additive columns from
--    today's change. Do NOT touch the table itself or its rows.
--
--    WARNING: unlike companies/artist_companies, this table already existed
--    with real, live-submitted applicant data before 510f015. It must never
--    be dropped or renamed away — the public application form
--    (app/api/organizations/apply) writes to it and has real user data with
--    no other copy.
-- ============================================================================

begin;

-- 2a. company_id: purely additive in the new schema (nullable FK), safe to
-- drop outright — no applicant-entered data lives in this column, only a
-- link created by the (not-yet-built) approval flow.
alter table public.organization_applications
  drop constraint if exists organization_applications_company_id_fkey;

alter table public.organization_applications
  drop column if exists company_id;

-- 2b. portfolio_text / logo_url: these DO carry real applicant-entered data
-- if any application was submitted through the new form. Back the values up
-- into a JSON column before dropping — never delete applicant data outright.
alter table public.organization_applications
  add column if not exists deprecated_new_fields_backup_20260716 jsonb;

update public.organization_applications
set deprecated_new_fields_backup_20260716 =
  coalesce(deprecated_new_fields_backup_20260716, '{}'::jsonb)
  || jsonb_strip_nulls(jsonb_build_object(
       'portfolio_text', portfolio_text,
       'logo_url', logo_url
     ))
where portfolio_text is not null or logo_url is not null;

alter table public.organization_applications drop column if exists portfolio_text;
alter table public.organization_applications drop column if exists logo_url;

-- 2c. Restore the two fields the OLD public application form collected
-- (website, description), in case update_org_application_logo_and_drop_fields.sql
-- already ran here and dropped them. They come back empty (NULL) for any
-- row submitted after that drop — there is no way to recover text that was
-- already deleted by a prior DROP COLUMN; only rows backed up under
-- deprecated_new_fields_backup_20260716 by this script's own prior runs (or
-- a manual export beforehand) can restore anything.
alter table public.organization_applications add column if not exists website text;
alter table public.organization_applications add column if not exists description text;

-- 2d. Status constraint: the OLD schema's constraint only allowed
-- pending/contacted/completed/rejected. The NEW schema's migration
-- (add_company_id_to_organization_applications.sql) converted any
-- 'contacted'/'completed' row to 'approved' and narrowed the constraint to
-- pending/approved/rejected — that conversion is NOT reversible (there is no
-- way to tell, after the fact, whether a given 'approved' row used to be
-- 'contacted' or 'completed'). Rather than guess, this restores a constraint
-- that accepts BOTH vocabularies so no existing row is left violating it.
-- Manually review any 'approved' rows and decide their old-model status by
-- hand if that distinction actually matters to you.
alter table public.organization_applications
  drop constraint if exists organization_applications_status_check;
alter table public.organization_applications
  add constraint organization_applications_status_check
  check (status in ('pending', 'contacted', 'completed', 'rejected', 'approved'));

commit;


-- ============================================================================
-- 3. artists.view_count — OPTIONAL section.
--
--    Unlike everything above, this is unrelated to the companies feature
--    (it's a page-view counter for /artists/[slug]) and was only bundled
--    into the same commit incidentally. If you want to KEEP view counting in
--    production regardless of the companies rollback, skip this section
--    entirely (comment it out / delete it) and stop after section 2.
-- ============================================================================

begin;

drop function if exists public.increment_artist_view_count(text);
drop index if exists public.artists_view_count_idx;
alter table public.artists drop column if exists view_count;

commit;


-- ============================================================================
-- 4. VERIFY — run after the above and compare against section 0's output.
-- ============================================================================

-- Expect: no rows (companies/artist_companies no longer present under
-- their live names).
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('companies', 'artist_companies');

-- Expect: the renamed backup tables exist, with the same row counts you saw
-- in section 0.
select
  (select count(*) from public.companies_deprecated_20260716) as companies_backup_rows,
  (select count(*) from public.artist_companies_deprecated_20260716) as artist_companies_backup_rows
where exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'companies_deprecated_20260716');

-- Expect: website/description present, company_id/portfolio_text/logo_url gone.
select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'organization_applications'
order by column_name;

-- Expect: no rows lost — same total as section 0's baseline count.
select count(*) as organization_applications_total from public.organization_applications;

-- Any row here has applicant-entered text/logo data preserved from before
-- the rollback — review before deciding whether to discard it later.
select id, org_name, deprecated_new_fields_backup_20260716
from public.organization_applications
where deprecated_new_fields_backup_20260716 is not null;
