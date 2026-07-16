-- ============================================================================
-- 20260716030000_add_logo_url_to_organization_applications.sql
--
-- TARGET: Supabase PRODUCTION project (the one linked to the GitHub "dev" branch).
--
-- DESCRIPTION:
--   The public organization application form (POST /api/organizations/apply)
--   requires inserting the "logo_url" column, which is currently missing in
--   the production database's "organization_applications" table.
--
--   This migration safely appends the missing "logo_url" column if it does not
--   already exist, protecting any existing applicant entries.
-- ============================================================================

alter table public.organization_applications
  add column if not exists logo_url text;
