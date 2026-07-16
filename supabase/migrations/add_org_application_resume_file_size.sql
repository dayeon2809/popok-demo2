-- ============================================================================
-- add_org_application_resume_file_size.sql
--
-- The public application form (/organizations/apply) now uploads the resume
-- through /api/upload first and only sends the resulting storage metadata
-- (path/name/size) to /api/organizations/apply — the file binary is never
-- included in that request body anymore, which avoids Next.js's ~10MB
-- FormData parsing limit ("Request body exceeded 10MB" / "Failed to parse
-- body as FormData") that a 20MB resume could previously trigger.
--
-- resume_file_path/resume_file_name already exist; this migration adds the
-- matching resume_file_size (bytes, from the uploaded File.size) so the
-- metadata trio can be stored together, mirroring companies.source_file_size.
--
-- Purely additive (alter table add column if not exists) — no table is
-- recreated, no existing row is touched.
--
-- Review this file in the Supabase SQL Editor before running. Nothing here
-- runs automatically.
-- ============================================================================

alter table public.organization_applications
  add column if not exists resume_file_size bigint;
