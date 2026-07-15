-- ============================================================================
-- dev_restore_previous_schema.sql
--
-- TARGET: Supabase PRODUCTION project (the one linked to the GitHub "dev"
-- branch).
--
-- STATUS AS OF 2026-07-16 — DEFAULT BEHAVIOR IS NOW NON-DESTRUCTIVE.
-- Section 0's PRE-FLIGHT was run against Production and came back with:
--     companies_rows = 1
--     artist_companies_rows = 1
-- Production already has real rows under the new schema. Given that, and
-- that the current "dev" app code doesn't reference these new tables at
-- all (so their presence is harmless to the running app), the decision is
-- to LEAVE companies / artist_companies / organization_applications exactly
-- as they are on Production. Nothing in this file runs a DROP TABLE, DROP
-- COLUMN, or RENAME TABLE by default any more.
--
-- Section 0 (below) is pure inspection — safe to run anytime, changes
-- nothing. Everything that used to mutate the schema now lives under
-- section "OPTIONAL — NOT FOR CURRENT USE", commented out, for reference
-- only in case a real rollback is ever needed later. Do not uncomment or
-- run that section without re-confirming the row counts first.
-- ============================================================================


-- ============================================================================
-- 0. PRE-FLIGHT / INSPECTION — read-only, changes nothing, safe to run anytime.
-- ============================================================================

-- 0a. Which of the new tables exist on this database.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('companies', 'artist_companies', 'organization_applications');

-- 0b. companies — full column list (name, type, nullability, default).
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'companies'
order by ordinal_position;

-- 0c. companies — the actual row(s). Production has exactly 1.
select * from public.companies;

-- 0d. artist_companies — full column list.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'artist_companies'
order by ordinal_position;

-- 0e. artist_companies — the actual row(s). Production has exactly 1.
select * from public.artist_companies;

-- 0f. organization_applications — does it have the new columns, and does it
-- still have the old ones? Check this BEFORE running 0g, since 0g will error
-- if you reference a column name that isn't actually present.
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'organization_applications'
  and column_name in ('company_id', 'portfolio_text', 'logo_url', 'website', 'description')
order by column_name;

-- 0g. organization_applications — non-null row counts for the new columns.
-- Only reference columns that 0f actually reported as present — this query
-- will error ("column does not exist") if you leave in a column name that
-- isn't there.
select
  count(*) as total_rows,
  count(*) filter (where company_id is not null) as company_id_non_null,
  count(*) filter (where portfolio_text is not null) as portfolio_text_non_null,
  count(*) filter (where logo_url is not null) as logo_url_non_null
from public.organization_applications;

-- 0h. artists.view_count — does the column exist?
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'artists' and column_name = 'view_count';

-- 0i. artists.view_count — summary, if 0h confirmed the column exists.
select
  count(*) as artists_total,
  count(*) filter (where view_count > 0) as artists_with_views,
  max(view_count) as max_view_count
from public.artists;

-- 0j. Row Level Security — is it enabled on each of the new tables?
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relname in ('companies', 'artist_companies', 'organization_applications');

-- 0k. RLS policies defined on each of the new tables.
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('companies', 'artist_companies', 'organization_applications')
order by tablename, policyname;

-- 0l. Triggers on the new tables (and artists, for the view_count trigger/function).
select event_object_table as table_name, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('companies', 'artist_companies', 'organization_applications', 'artists')
order by table_name, trigger_name;

-- 0m. Functions this feature created (updated_at triggers, view-count RPC).
select proname as function_name, pg_get_function_identity_arguments(oid) as arguments
from pg_proc
where proname in (
  'set_updated_at',
  'set_organization_applications_updated_at',
  'increment_artist_view_count'
);


-- ============================================================================
-- CURRENT DEFAULT ACTION: none. Nothing below this point runs against the
-- database. companies, artist_companies, organization_applications' new
-- columns, and artists.view_count are all left exactly as-is on Production.
-- ============================================================================


-- ============================================================================
-- OPTIONAL — NOT FOR CURRENT USE
--
-- Kept for reference only, in case a real rollback is decided on later (e.g.
-- if these tables are ever confirmed to be genuinely unwanted on Production
-- rather than just currently-unused-by-the-app). Every statement below is
-- commented out. Do NOT uncomment and run without first re-running section 0
-- and re-confirming the row counts / column list still match what you expect
-- — someone may have added more data by then.
-- ============================================================================

-- ── OPTIONAL 1. Rename (not drop) companies / artist_companies ─────────────
-- Renames the tables out of the way rather than dropping them, so the app
-- (which doesn't query these names) sees nothing while every row is still
-- recoverable on disk under the *_deprecated_<date> name.
--
-- begin;
--
-- do $$
-- begin
--   if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'artist_companies') then
--     execute 'alter table public.artist_companies rename to artist_companies_deprecated_20260716';
--   end if;
--   if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'companies') then
--     execute 'alter table public.companies rename to companies_deprecated_20260716';
--   end if;
-- end $$;
--
-- commit;

-- ── OPTIONAL 2. organization_applications — roll back only the additive
-- columns from the companies-architecture change. Never drop or rename this
-- table itself — it holds real, live-submitted applicant data with no other
-- copy, independent of the companies-table decision above.
--
-- begin;
--
-- alter table public.organization_applications
--   drop constraint if exists organization_applications_company_id_fkey;
-- alter table public.organization_applications
--   drop column if exists company_id;
--
-- -- Back up portfolio_text / logo_url before dropping — these can carry real
-- -- applicant-entered data.
-- alter table public.organization_applications
--   add column if not exists deprecated_new_fields_backup_20260716 jsonb;
-- update public.organization_applications
-- set deprecated_new_fields_backup_20260716 =
--   coalesce(deprecated_new_fields_backup_20260716, '{}'::jsonb)
--   || jsonb_strip_nulls(jsonb_build_object('portfolio_text', portfolio_text, 'logo_url', logo_url))
-- where portfolio_text is not null or logo_url is not null;
--
-- alter table public.organization_applications drop column if exists portfolio_text;
-- alter table public.organization_applications drop column if exists logo_url;
--
-- alter table public.organization_applications add column if not exists website text;
-- alter table public.organization_applications add column if not exists description text;
--
-- -- Status constraint: restores a constraint that accepts BOTH the old
-- -- (pending/contacted/completed/rejected) and new (approved) vocabularies,
-- -- since the contacted/completed -> approved conversion isn't reversible.
-- alter table public.organization_applications
--   drop constraint if exists organization_applications_status_check;
-- alter table public.organization_applications
--   add constraint organization_applications_status_check
--   check (status in ('pending', 'contacted', 'completed', 'rejected', 'approved'));
--
-- commit;

-- ── OPTIONAL 3. artists.view_count — KEEP.
-- Decision: do not remove. Unrelated to the companies rollback question,
-- independently useful, and low-risk to leave in place. Nothing to run here.

-- ── OPTIONAL VERIFY — only meaningful if OPTIONAL 1/2 above were actually run.
--
-- select table_name from information_schema.tables
-- where table_schema = 'public' and table_name in ('companies', 'artist_companies');
--
-- select
--   (select count(*) from public.companies_deprecated_20260716) as companies_backup_rows,
--   (select count(*) from public.artist_companies_deprecated_20260716) as artist_companies_backup_rows
-- where exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'companies_deprecated_20260716');
--
-- select column_name from information_schema.columns
-- where table_schema = 'public' and table_name = 'organization_applications' order by column_name;
--
-- select id, org_name, deprecated_new_fields_backup_20260716
-- from public.organization_applications
-- where deprecated_new_fields_backup_20260716 is not null;
