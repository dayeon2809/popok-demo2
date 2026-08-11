-- ============================================================================
-- backfill_missing_profiles.sql
--
-- Diagnoses and repairs the gap between auth.users and public.profiles for
-- the sawsqtqjqmesfasbcmyf project. Run in the Supabase SQL Editor.
--
-- BACKGROUND: on_auth_user_created (public.handle_new_user, see
-- supabase/baseline/current_schema.sql) inserts a public.profiles row after
-- every auth.users signup. As of 2026-08-03, 3 of 20 real auth.users rows
-- have no matching profiles row — all 3 signed up 2026-07-13/14, before the
-- separate "invisible on admin because no artist/company was ever created"
-- gap (a different, unrelated cause — see app/api/admin/users/route.ts).
-- This file only addresses the profiles gap. It does not touch auth.users
-- and does not delete or recreate anything.
--
-- SAFE TO RE-RUN: the backfill INSERT uses `on conflict (id) do nothing`, so
-- running it again after new signups (or after the trigger is confirmed
-- healthy) only inserts rows that are still missing.
-- ============================================================================


-- 1. DIAGNOSTIC — auth.users rows with no public.profiles row.
-- Run this first to see exactly who would be affected by the backfill below.
select
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  u.raw_app_meta_data ->> 'provider'  as provider,
  u.raw_app_meta_data -> 'providers'  as providers,
  u.raw_user_meta_data ->> 'full_name' as meta_full_name,
  u.raw_user_meta_data ->> 'name'      as meta_name
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
order by u.created_at;


-- 2. BACKFILL — insert the missing profiles rows only, using the exact same
-- column mapping as public.handle_new_user() so backfilled rows are
-- indistinguishable from trigger-created ones. Existing profiles rows are
-- never touched (on conflict do nothing), and no auth.users row is modified.
insert into public.profiles (id, email, display_name, avatar_url, onboarding_completed, profile_type, status)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '새 사용자'),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture', ''),
  false,
  'artist',
  'active'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;


-- 3. VERIFY — should return 0 rows after step 2.
select count(*) as still_missing
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;


-- ============================================================================
-- 4. Trigger health check — confirm on_auth_user_created is still attached
-- and enabled. If this returns 0 rows, new signups will silently stop
-- getting a profiles row again (the original failure mode this file repairs).
-- ============================================================================
select tgname, tgenabled, tgrelid::regclass
from pg_trigger
where tgname = 'on_auth_user_created';
