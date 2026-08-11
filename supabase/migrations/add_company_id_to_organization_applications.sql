-- ============================================================================
-- add_company_id_to_organization_applications.sql
--
-- Links an approved organization_applications row to the companies row
-- created for it, so the same application can never spawn a second company
-- (see lib/companies.ts's approveOrganizationApplication — the actual
-- duplicate-prevention guard is a conditional UPDATE keyed on this column
-- being NULL, not this migration).
--
-- organization_applications already exists live with real submitted data.
-- This migration is purely additive: it only adds a column/index and
-- narrows the status CHECK constraint after first converting any existing
-- 'contacted'/'completed' rows to 'approved' — no table is recreated, no
-- row is deleted.
--
-- Review this file in the Supabase SQL Editor before running. Nothing here
-- runs automatically. Requires create_companies_and_artist_companies.sql to
-- have been run first (company_id references companies.id).
-- ============================================================================

alter table public.organization_applications
  add column if not exists company_id uuid;

alter table public.organization_applications
  drop constraint if exists organization_applications_company_id_fkey;
alter table public.organization_applications
  add constraint organization_applications_company_id_fkey
  foreign key (company_id) references public.companies (id) on delete set null;

create index if not exists organization_applications_company_id_idx
  on public.organization_applications (company_id);

-- Preserve the meaning of existing data before narrowing the status enum:
-- an application that was already 'contacted' or 'completed' was, in the
-- old flow, being actively worked — treat that as 'approved' under the new
-- pending/approved/rejected model rather than losing the distinction.
update public.organization_applications
  set status = 'approved'
  where status in ('contacted', 'completed');

alter table public.organization_applications
  drop constraint if exists organization_applications_status_check;
alter table public.organization_applications
  add constraint organization_applications_status_check
  check (status in ('pending', 'approved', 'rejected'));
