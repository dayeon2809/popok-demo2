-- Manual rollback only. Review dependencies and take a backup before running.
begin;
drop table if exists public.opportunity_duplicate_candidates;
drop table if exists public.opportunity_ingestion_runs;
drop table if exists public.opportunities;
drop function if exists public.set_opportunity_derived_fields();
commit;
-- pgcrypto is intentionally retained because other application objects may use it.
