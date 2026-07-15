-- ============================================================================
-- add_company_source_materials.sql
--
-- Adds admin-managed "AI 분석용 자료" storage to companies, kept fully
-- separate from the applicant's original submission:
--
--   organization_applications.resume_file_*   -> user's original upload
--   organization_applications.portfolio_text  -> user's own typed history
--   companies.source_file_*                   -> admin-added/replaced resume
--   companies.source_text                     -> admin's supplementary notes
--
-- An admin uploading a newer resume or typing supplementary notes must never
-- overwrite or delete the applicant's original submission — this migration
-- only adds new columns on companies, nothing on organization_applications
-- is touched.
--
-- ai_draft_source_summary records what was actually fed into the AI on the
-- last successful run (application description/portfolio_text/resume,
-- admin source_text/source_file — see lib/companyAiDraft.ts), so the admin
-- UI can show "마지막 분석에 사용한 자료 정보" even after the underlying
-- material changes.
--
-- companies already exists live with real rows. This migration is purely
-- additive (alter table add column if not exists) — no table is recreated,
-- no row is touched except adding new columns with safe defaults.
--
-- Review this file in the Supabase SQL Editor before running. Nothing here
-- runs automatically. Requires create_companies_and_artist_companies.sql to
-- have been run first.
-- ============================================================================

alter table public.companies add column if not exists source_file_path text;
alter table public.companies add column if not exists source_file_name text;
alter table public.companies add column if not exists source_file_size bigint;
-- Set only by the source-file upload route (never by the source_text save),
-- so it stays an accurate "when was this specific file uploaded" — unlike
-- source_material_updated_at below, which both a file change AND a
-- source_text-only edit bump.
alter table public.companies add column if not exists source_file_uploaded_at timestamptz;
alter table public.companies add column if not exists source_text text;
alter table public.companies add column if not exists source_material_updated_at timestamptz;
alter table public.companies add column if not exists ai_draft_source_summary jsonb;
