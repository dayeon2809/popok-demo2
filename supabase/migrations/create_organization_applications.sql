-- ============================================================================
-- create_organization_applications.sql
--
-- "단체 포트폴리오 제작 신청" — organizations no longer self-register through
-- /onboarding. Instead they submit a public (no-login) application; the
-- POPOK team reviews it in /admin/organizations and builds the portfolio
-- manually. This table is intentionally independent of profiles/artists —
-- no owner_id/FK — converting an approved application into a real artists
-- row is a manual/future step, not part of this migration.
--
-- Column/type conventions mirror the existing "artists" / "performances"
-- tables (uuid pk via gen_random_uuid(), timestamptz created_at/updated_at
-- default now(), a single text "status" column).
--
-- Review this file in the Supabase SQL Editor before running. Nothing here
-- runs automatically.
-- ============================================================================

create table if not exists public.organization_applications (
  id uuid primary key default gen_random_uuid(),

  org_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  instagram text not null,

  website text,
  description text,

  -- Storage path in the private "org-applications" bucket (UUID-based,
  -- never the user's original filename). Null when no PDF was attached.
  resume_file_path text,
  -- Original filename, kept only for display in the admin UI.
  resume_file_name text,

  -- 'pending' | 'contacted' | 'completed' | 'rejected'
  status text not null default 'pending'
    check (status in ('pending', 'contacted', 'completed', 'rejected')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_applications_status_created_at_idx
  on public.organization_applications (status, created_at desc);

-- Keep updated_at current on every row update.
create or replace function public.set_organization_applications_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_organization_applications_updated_at on public.organization_applications;
create trigger trg_organization_applications_updated_at
  before update on public.organization_applications
  for each row
  execute function public.set_organization_applications_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────
-- The public application form and the admin review UI both go through
-- service-role server routes (app/api/organizations/apply, app/api/admin/organizations/*),
-- which bypass RLS entirely. No anon/authenticated policies are defined here
-- on purpose — this table should never be reachable directly from the browser.
alter table public.organization_applications enable row level security;
