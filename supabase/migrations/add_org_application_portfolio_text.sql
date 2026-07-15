-- ============================================================================
-- add_org_application_portfolio_text.sql
--
-- Adds a free-text "이력서 및 주요 활동 직접 입력" field to the public
-- organization application form (/organizations/apply), for applicants who
-- can't or don't want to upload a PDF resume. `description` keeps its
-- existing role (단체 소개 및 신청 사유); `portfolio_text` is a separate
-- field for works/awards/activity history entered directly as text.
--
-- organization_applications already exists live with real submitted data.
-- This migration is purely additive (alter table add column if not exists)
-- — no table is recreated, no row is touched except adding the new column.
--
-- Review this file in the Supabase SQL Editor before running. Nothing here
-- runs automatically.
-- ============================================================================

alter table public.organization_applications
  add column if not exists portfolio_text text;
