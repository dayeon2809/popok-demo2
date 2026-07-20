-- ============================================================================
-- 20260720030000_add_artist_portfolio_requests.sql
--
-- Artist-to-artist "포퐄 보내기" — a separate table from
-- company_portfolio_requests (20260720010000_...sql) rather than a polymorphic
-- one. Reasons (see completion report for full rationale):
--   1. FK integrity: sender/recipient are both `artists.id`, whereas the
--      company table's target is `companies.id` — a single table would need
--      either two nullable FK pairs or a loose polymorphic id with no FK at
--      all, both worse than two small typed tables.
--   2. Recipient resolution is fundamentally different: company recipients
--      are resolved indirectly through artist_companies (current primary
--      rep, can change over time); artist recipients are the FK target
--      directly. Folding both into one table would force one of the two
--      shapes to fake the other.
--   3. RLS is simpler and more auditable as two small, single-purpose
--      policy sets than one table with conditional logic keyed on a `type`
--      column inside every policy.
-- The API layer (app/api/portfolio-requests/{received,sent}, and
-- PATCH /api/portfolio-requests/[id]) is what unifies them for the client —
-- see those routes for the `type: "company" | "artist"` merge.
-- ============================================================================

create table if not exists public.artist_portfolio_requests (
  id uuid primary key default gen_random_uuid(),

  sender_artist_id uuid not null
    references public.artists (id) on delete cascade,

  recipient_artist_id uuid not null
    references public.artists (id) on delete cascade,

  message text,

  status text not null default 'pending',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint artist_portfolio_requests_not_self
    check (sender_artist_id <> recipient_artist_id),

  constraint artist_portfolio_requests_status_check
    check (
      status in (
        'pending',
        'viewed',
        'accepted',
        'declined',
        'withdrawn'
      )
    )
);

create index if not exists artist_portfolio_requests_sender_idx
  on public.artist_portfolio_requests (sender_artist_id);
create index if not exists artist_portfolio_requests_recipient_idx
  on public.artist_portfolio_requests (recipient_artist_id);
create index if not exists artist_portfolio_requests_status_idx
  on public.artist_portfolio_requests (status);

-- One live (pending/viewed) request per (sender, recipient) pair — same
-- pattern as company_portfolio_requests_live_unique_idx.
create unique index if not exists artist_portfolio_requests_active_unique
  on public.artist_portfolio_requests (sender_artist_id, recipient_artist_id)
  where status in ('pending', 'viewed');

drop trigger if exists trg_artist_portfolio_requests_updated_at on public.artist_portfolio_requests;
create trigger trg_artist_portfolio_requests_updated_at
  before update on public.artist_portfolio_requests
  for each row
  execute function public.set_updated_at();

alter table public.artist_portfolio_requests enable row level security;

drop policy if exists "Senders can create requests with their own artist_id" on public.artist_portfolio_requests;
create policy "Senders can create requests with their own artist_id"
  on public.artist_portfolio_requests
  for insert
  to authenticated
  with check (
    sender_artist_id in (select id from public.artists where owner_id = auth.uid())
  );

drop policy if exists "Senders can view their own requests" on public.artist_portfolio_requests;
create policy "Senders can view their own requests"
  on public.artist_portfolio_requests
  for select
  to authenticated
  using (
    sender_artist_id in (select id from public.artists where owner_id = auth.uid())
  );

drop policy if exists "Recipients can view requests sent to them" on public.artist_portfolio_requests;
create policy "Recipients can view requests sent to them"
  on public.artist_portfolio_requests
  for select
  to authenticated
  using (
    recipient_artist_id in (select id from public.artists where owner_id = auth.uid())
  );

drop policy if exists "Senders can withdraw their own requests" on public.artist_portfolio_requests;
create policy "Senders can withdraw their own requests"
  on public.artist_portfolio_requests
  for update
  to authenticated
  using (
    sender_artist_id in (select id from public.artists where owner_id = auth.uid())
  )
  with check (
    status = 'withdrawn'
    and sender_artist_id in (select id from public.artists where owner_id = auth.uid())
  );

drop policy if exists "Recipients can update request status" on public.artist_portfolio_requests;
create policy "Recipients can update request status"
  on public.artist_portfolio_requests
  for update
  to authenticated
  using (
    recipient_artist_id in (select id from public.artists where owner_id = auth.uid())
  )
  with check (
    status in ('viewed', 'accepted', 'declined')
  );

-- Same note as company_portfolio_requests: API routes use the service-role
-- client and re-verify ownership in code; these policies are defense-in-depth.
