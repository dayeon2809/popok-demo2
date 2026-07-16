-- ============================================================================
-- production_introspection_queries.sql
--
-- READ-ONLY. Every statement below is a SELECT against information_schema /
-- pg_catalog system views — no CREATE / ALTER / DROP / INSERT / UPDATE /
-- DELETE anywhere in this file. Nothing here reads or writes real table
-- rows or auth.users' actual user data — only object/schema DEFINITIONS.
--
-- PURPOSE: final, one-shot verification of the 6 tables
-- supabase/manual-migrations/baseline_preview_schema.sql needs to reproduce
-- on Preview: profiles, submissions, artists, organization_applications,
-- performances, performance_artists. Run this against PRODUCTION.
--
-- Each block below is its own SELECT and includes an `object_type` column so
-- results stay identifiable if your SQL client only shows one result grid at
-- a time — run the blocks one at a time (separated by the numbered headers)
-- if your editor doesn't show all statements' results at once.
-- ============================================================================


-- ============================================================================
-- 1. COLUMNS — name, type, nullable, default, identity
-- ============================================================================
select
  'columns' as object_type,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default,
  is_identity,
  identity_generation
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'profiles', 'submissions', 'artists',
    'organization_applications', 'performances', 'performance_artists'
  )
order by table_name, ordinal_position;


-- ============================================================================
-- 2+3+4. CONSTRAINTS — PK, FK (+ ON UPDATE/ON DELETE), UNIQUE, CHECK
-- ============================================================================
select
  'constraints' as object_type,
  conrelid::regclass::text as table_name,
  conname as constraint_name,
  case contype
    when 'p' then 'PRIMARY KEY'
    when 'f' then 'FOREIGN KEY'
    when 'u' then 'UNIQUE'
    when 'c' then 'CHECK'
    else contype::text
  end as constraint_type,
  pg_get_constraintdef(oid) as definition,
  case confupdtype
    when 'a' then 'NO ACTION' when 'r' then 'RESTRICT' when 'c' then 'CASCADE'
    when 'n' then 'SET NULL' when 'd' then 'SET DEFAULT' else null
  end as on_update,
  case confdeltype
    when 'a' then 'NO ACTION' when 'r' then 'RESTRICT' when 'c' then 'CASCADE'
    when 'n' then 'SET NULL' when 'd' then 'SET DEFAULT' else null
  end as on_delete
from pg_constraint
where connamespace = 'public'::regnamespace
  and conrelid::regclass::text in (
    'profiles', 'submissions', 'artists',
    'organization_applications', 'performances', 'performance_artists'
  )
order by table_name, constraint_type, constraint_name;


-- ============================================================================
-- 5. INDEXES
-- ============================================================================
select
  'indexes' as object_type,
  tablename as table_name,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'profiles', 'submissions', 'artists',
    'organization_applications', 'performances', 'performance_artists'
  )
order by tablename, indexname;


-- ============================================================================
-- 6. RLS — enabled + FORCE row security
-- ============================================================================
select
  'rls_status' as object_type,
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'profiles', 'submissions', 'artists',
    'organization_applications', 'performances', 'performance_artists'
  )
order by relname;


-- ============================================================================
-- 7. POLICIES
-- ============================================================================
select
  'policies' as object_type,
  tablename as table_name,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles', 'submissions', 'artists',
    'organization_applications', 'performances', 'performance_artists'
  )
order by tablename, policyname;


-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================
select
  'triggers' as object_type,
  event_object_table as table_name,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in (
    'profiles', 'submissions', 'artists',
    'organization_applications', 'performances', 'performance_artists'
  )
order by table_name, trigger_name;


-- ============================================================================
-- 9. TRIGGER FUNCTION DEFINITIONS — full body of every function any trigger
--    on these 6 tables actually calls.
-- ============================================================================
select
  'trigger_function_defs' as object_type,
  c.relname as table_name,
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_proc p on p.oid = t.tgfoid
where c.relnamespace = 'public'::regnamespace
  and c.relname in (
    'profiles', 'submissions', 'artists',
    'organization_applications', 'performances', 'performance_artists'
  )
  and not t.tgisinternal
order by table_name, trigger_name;


-- ============================================================================
-- 10. ALL public-schema FUNCTION DEFINITIONS — broader net than just #9, in
--     case a relevant function (e.g. a shared updated_at helper, the
--     view-count RPC, anything companies/AI-related that might overlap) is
--     defined but not directly wired to a trigger on these 6 tables.
-- ============================================================================
select
  'public_function_defs' as object_type,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
from pg_proc p
where p.pronamespace = 'public'::regnamespace
order by p.proname;


-- ============================================================================
-- EXTRA. auth.users -> profiles auto-creation trigger + function.
-- Definition only — no user rows are read or returned.
-- ============================================================================
select
  'auth_trigger' as object_type,
  c.relname as table_name,
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where n.nspname = 'auth' and c.relname = 'users' and not t.tgisinternal;
