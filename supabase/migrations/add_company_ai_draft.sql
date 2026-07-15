-- ============================================================================
-- add_company_ai_draft.sql
--
-- Adds columns for the admin-only "AI로 신청 자료 구조화" draft-assist tool
-- (app/api/admin/companies/[id]/ai-structure). The AI's output is stored
-- entirely in ai_draft and never touches the real public fields on
-- companies directly — only /api/admin/companies/[id]/apply-ai-draft, acting
-- on an admin's explicit field/array selection, copies anything out of it.
--
-- companies already exists live with real rows. This migration is purely
-- additive (alter table add column if not exists) — no table is recreated,
-- no row is touched except adding new columns with safe defaults.
--
-- Review this file in the Supabase SQL Editor before running. Nothing here
-- runs automatically. Requires create_companies_and_artist_companies.sql to
-- have been run first.
-- ============================================================================

alter table public.companies add column if not exists ai_draft jsonb;
alter table public.companies add column if not exists ai_draft_status text not null default 'not_started';
alter table public.companies add column if not exists ai_draft_generated_at timestamptz;
alter table public.companies add column if not exists ai_draft_error text;

alter table public.companies drop constraint if exists companies_ai_draft_status_check;
alter table public.companies add constraint companies_ai_draft_status_check
  check (ai_draft_status in ('not_started', 'processing', 'ready', 'failed', 'applied'));
