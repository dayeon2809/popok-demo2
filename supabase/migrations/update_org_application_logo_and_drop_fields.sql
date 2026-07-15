-- ============================================================================
-- update_org_application_logo_and_drop_fields.sql
--
-- The public application form (/organizations/apply) no longer collects
-- "홈페이지" (website) or "간단한 단체 소개" (description) — applicants now
-- describe the organization inside portfolio_text instead, and a logo image
-- replaces those two fields. This migration:
--
--   1. Adds organization_applications.logo_url (public URL of the uploaded
--      logo image — same public "artist-media" bucket used for artist
--      profile images elsewhere in this project, not a private path/signed
--      URL like resume_file_path).
--   2. Drops organization_applications.website and .description.
--
-- ============================================================================
-- WARNING — THIS IS A DESTRUCTIVE, IRREVERSIBLE STEP FOR STEP 2.
-- organization_applications is a live table with real submitted rows.
-- Any website/description text already collected from real applicants will
-- be PERMANENTLY DELETED the moment the "drop column" statements below run.
-- If you want to keep that historical data, export it first, e.g.:
--
--   select id, org_name, website, description from public.organization_applications;
--
-- Only run the DROP COLUMN statements once you've confirmed you don't need
-- that data (or have exported it). The ADD COLUMN statement for logo_url is
-- safe/additive on its own if you'd rather run these in two separate steps.
-- ============================================================================
--
-- Review this file in the Supabase SQL Editor before running. Nothing here
-- runs automatically.
-- ============================================================================

-- 1. Additive — safe on its own.
alter table public.organization_applications
  add column if not exists logo_url text;

-- 2. Destructive — see warning above.
alter table public.organization_applications
  drop column if exists website;

alter table public.organization_applications
  drop column if exists description;
