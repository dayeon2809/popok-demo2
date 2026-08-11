-- ============================================================================
-- create_company_manager_requests.sql
--
-- Table for tracking company representative manager claim requests submitted
-- by authenticated users, plus RLS policy updates for public.companies.
-- ============================================================================

create table if not exists public.company_manager_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  applicant_name text not null,
  applicant_email text not null,
  applicant_phone text,
  role_title text,
  proof_text text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists company_manager_requests_company_idx on public.company_manager_requests (company_id);
create index if not exists company_manager_requests_user_idx on public.company_manager_requests (user_id);
create index if not exists company_manager_requests_status_idx on public.company_manager_requests (status);

-- Updated_at trigger
drop trigger if exists trg_company_manager_requests_updated_at on public.company_manager_requests;
create trigger trg_company_manager_requests_updated_at
  before update on public.company_manager_requests
  for each row
  execute function public.set_updated_at();

-- RLS
alter table public.company_manager_requests enable row level security;

drop policy if exists "Users can view their own requests" on public.company_manager_requests;
create policy "Users can view their own requests"
  on public.company_manager_requests
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can insert claim requests" on public.company_manager_requests;
create policy "Users can insert claim requests"
  on public.company_manager_requests
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Ensure companies RLS allows owner to select and update their own company row
drop policy if exists "Owners can view their companies" on public.companies;
create policy "Owners can view their companies"
  on public.companies
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Owners can update their companies" on public.companies;
create policy "Owners can update their companies"
  on public.companies
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
