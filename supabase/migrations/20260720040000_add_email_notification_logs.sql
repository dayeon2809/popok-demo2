-- ============================================================================
-- 20260720040000_add_email_notification_logs.sql
--
-- Idempotency + audit log for transactional notification emails. The
-- (event_key, entity_type, entity_id, recipient_email) unique index is
-- intentionally NOT partial (no `where status in (...)`) — once any row
-- exists for that tuple, in ANY status (sent, failed, skipped_*), a second
-- attempt is blocked. This is deliberate: the spec calls for "log only, do
-- not auto-resend on failure" in this first version, so a `failed` row
-- should permanently occupy the slot exactly like a `sent` one — retrying a
-- failed notification is a conscious future feature (e.g. an admin "resend"
-- action that deletes/supersedes the old log row), not automatic.
-- ============================================================================

create table if not exists public.email_notification_logs (
  id uuid primary key default gen_random_uuid(),

  event_key text not null,
  entity_type text not null,
  -- text, not uuid: entities span tables with different id types (e.g.
  -- public.submissions.id is `bigint`, while companies/artists/*_portfolio_requests
  -- all use uuid) — text safely accepts either without a cast failure.
  entity_id text not null,

  recipient_user_id uuid,
  recipient_email text,

  provider text not null default 'resend',
  provider_message_id text,

  status text not null,
  error_message text,

  created_at timestamptz not null default now(),

  constraint email_notification_logs_status_check
    check (
      status in (
        'pending',
        'sent',
        'failed',
        'skipped_no_recipient',
        'skipped_no_email',
        'skipped_not_configured'
      )
    )
);

create index if not exists email_notification_logs_event_idx
  on public.email_notification_logs (event_key, entity_type, entity_id);
create index if not exists email_notification_logs_status_idx
  on public.email_notification_logs (status);

-- The idempotency guard. A row with recipient_email = NULL (skipped_no_recipient,
-- no email address to even key on) does NOT collide with other NULL rows —
-- Postgres never treats NULL = NULL in a unique constraint — but that's fine
-- here since entity_id is always a freshly-created row's own id, so
-- "no recipient" can only ever be logged once per real event regardless.
create unique index if not exists email_notification_logs_event_unique
  on public.email_notification_logs (
    event_key,
    entity_type,
    entity_id,
    recipient_email
  );

-- No RLS policies: this table is written/read exclusively by server-side
-- code via the service-role client (lib/email/send-email.ts), the same
-- pattern as every other write path in this codebase. Not exposed to any
-- client-side Supabase query, so there's no anon/authenticated access surface
-- to define policies for (matching organization_applications' existing
-- "RLS enabled, no policies" posture for the same reason).
alter table public.email_notification_logs enable row level security;
