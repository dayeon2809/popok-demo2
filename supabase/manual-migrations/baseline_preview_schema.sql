-- ============================================================================
-- baseline_preview_schema.sql
--
-- TARGET: Supabase PREVIEW project only (the one linked to the GitHub "main"
-- branch), currently an EMPTY public schema.
-- DO NOT RUN THIS AGAINST PRODUCTION. Production already has every table
-- below (that's where this definition was reverse-engineered from) — running
-- CREATE statements there is unnecessary and `create table if not exists`
-- guards would just no-op, but there's no reason to run it there at all.
--
-- WHAT THIS FILE IS
-- Supabase CLI's `db pull`/`db dump` could not be used here (db pull hit a
-- migration-history conflict; db dump requires Docker, unavailable on this
-- machine) — see prior conversation. Instead, every table/column below was
-- reconstructed BY HAND from actual application code (every `.from(...)`,
-- `.select(...)`, `.insert(...)`, `.update(...)` call in this repo), not
-- from a live introspection dump. Treat this as a best-effort reconstruction
-- of "what main's code needs to exist", not a byte-for-byte copy of
-- Production's real schema — there may be Production columns that no
-- current code path touches and are therefore invisible to this method.
--
-- EXECUTION ORDER (fixed):
--   ① baseline_preview_schema.sql          <- this file
--   ② supabase/migrations/20260716020000_apply_new_schema.sql
-- Run ① first on the empty Preview DB, then ②. ② already uses
-- `create table if not exists` / `add column if not exists` throughout, so
-- running it after ① is safe and adds only what ① intentionally omits
-- (companies, artist_companies, artists.view_count, and the
-- organization_applications.company_id/portfolio_text/logo_url columns).
--
-- NO PRODUCTION DATA: every statement below is schema-only (CREATE
-- TABLE / ALTER TABLE / CREATE INDEX / CREATE POLICY / CREATE FUNCTION /
-- CREATE TRIGGER). There is not a single INSERT in this file, and nothing
-- here reads or writes auth.users' real rows.
--
-- ⚠ KNOWN GAPS — read before relying on this file:
-- create_performances.sql (already in supabase/migrations/) contains a
-- 2026-07-14 comment recording a live schema introspection that found FIVE
-- tables in Production: profiles, popok_upload_requests, artist_submissions,
-- artists, submissions. This repo's application code has ZERO references to
-- `popok_upload_requests` or `artist_submissions` anywhere — confirmed again
-- 2026-07-16 via a repo-wide case-insensitive search (no `.from(...)` call,
-- no import, no type, nothing). Neither is defined in this file:
--
--   - `artist_submissions`: structure still entirely unknown — no column
--     info has been provided for this one, so it genuinely cannot be
--     reconstructed. Share `information_schema.columns` output if real
--     parity is ever wanted.
--
--   - `popok_upload_requests`: structure IS now known (confirmed via
--     information_schema.columns dump, 2026-07-16) — documented here for
--     the record, but still deliberately NOT created, since no code path
--     touches it:
--       id uuid primary key default gen_random_uuid()
--       created_at timestamptz default now()
--       submission_id bigint          -- likely references submissions(id), unconfirmed (see below)
--       artist_id uuid                -- likely references artists(id), unconfirmed (see below)
--       request_type text not null
--       message text not null
--       contact_email text
--       status text default 'pending'
--
-- Since no current app code path touches either table, Preview not having
-- them should not break anything main's code does today.
--
-- Policies for all 6 tables (including artists/profiles) have now been
-- checked against a real pg_policies dump (2026-07-16) and deliberately
-- de-duplicated — see each table's section below and the final report for
-- the full list of Production policies intentionally NOT reproduced here.
-- ============================================================================


-- ============================================================================
-- 1. public.profiles
--
-- Row-per-auth-user profile. No application code in this repo ever INSERTs
-- into profiles — every reference is SELECT (own row) or UPDATE (own row via
-- onboarding). Row creation happens via a Postgres trigger on auth.users.
--
-- Column list, defaults, CHECK constraints, and the handle_new_user()
-- function below were all CORRECTED against an actual information_schema /
-- pg_catalog dump of Production (2026-07-16) — no more best-effort guessing.
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  email text,
  display_name text not null,
  username text unique,
  avatar_url text,

  -- 'artist' | 'organization' | 'admin' — chosen at onboarding step 1
  -- (app/api/artists/onboard/route.ts writes this; app/my-popok/page.tsx reads it).
  profile_type text default 'artist'
    check (profile_type in ('artist', 'organization', 'admin')),

  onboarding_completed boolean default false,

  status text not null default 'active'
    check (status in ('active', 'suspended')),

  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ⚠ INTENTIONAL DEVIATION FROM PRODUCTION — see final report section ④.
-- Production's real trigger on profiles is named "on_profile_updated" and
-- calls a dedicated function "handle_updated_at()" (identical body to
-- set_updated_at() below). Preview instead reuses the same shared
-- set_updated_at() helper already used by artists, to avoid having two
-- functions that do the exact same thing. Purely a naming/consolidation
-- choice — not a bug fix, since Production's profiles trigger was NOT one
-- of the duplicates (only artists had genuine duplicate triggers, see below).
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Policies below are CORRECTED against the real pg_policies dump
-- (2026-07-16). Production defines all 3 of these to the `public` role;
-- Preview intentionally narrows them to `authenticated` (id = auth.uid()
-- can never match an anonymous request anyway, so this is a no-op for real
-- traffic, just a tighter/clearer role grant) — see final report section ④.
-- No policy from Production is dropped here — profiles had no duplicates,
-- unlike artists below.
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Username-availability checks (app/api/auth/check-username, the onboard
-- route's duplicate check) go through the service-role client, bypassing
-- RLS — no separate "look up any username" policy is needed here.

-- Real Production definition (information_schema/pg_catalog dump,
-- 2026-07-16) — reproduced verbatim, not a guess.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, onboarding_completed, profile_type, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '새 사용자'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    false,
    'artist',
    'active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ============================================================================
-- 2. public.artists
--
-- Core artist profile table. No migration in this repo ever created this
-- table — reconstructed BY HAND from application code, then CORRECTED
-- against an actual information_schema/pg_catalog dump of Production's real
-- `artists` table (2026-07-16): columns, defaults, CHECK/UNIQUE constraints,
-- FKs (with on-delete actions), and indexes below all follow that dump.
-- artist_type is kept (per create_companies_and_artist_companies.sql's own
-- comment: "left in place, not dropped, but no longer used for public
-- company browsing"). view_count is DELIBERATELY EXCLUDED — that column,
-- its index, and increment_artist_view_count() belong to
-- 20260716020000_apply_new_schema.sql only.
-- ============================================================================

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete set null,

  name text not null,
  name_en text,
  slug text unique,

  -- Free-text fallback company name (never auto-matched to public.companies —
  -- see create_companies_and_artist_companies.sql's header comment).
  -- @deprecated per lib/artists.ts / types/index.ts — kept for existing rows only.
  company text,

  genre text,
  role text,
  city_or_region text,
  category text,

  -- 'draft' | 'published' — the only two values app/api/admin/artists/route.ts
  -- writes. Confirmed default in Production is 'published' (not 'draft') —
  -- the onboard route always passes an explicit "draft" on insert, so this
  -- default never actually applies to that flow, but it's the real column
  -- default and reproduced as such.
  status text default 'published',
  verified boolean default false,

  bio text,
  bio_short text,

  -- jsonb in Production (confirmed via dump) — mapArtistRowToArtist's
  -- `typeof reviewLinksRaw === "string"` check is just defensively handling
  -- a jsonb value that happens to hold a plain string, not proof this is a
  -- text column.
  review_links jsonb default '[]'::jsonb,
  portfolio_url text,

  profile_image_url text,
  profile_image_urls jsonb default '[]'::jsonb,
  motion_video_url text,
  youtube_url text,
  -- Confirmed present in Production with real defaults; no code in this
  -- repo currently reads or writes either column, but they're real columns.
  youtube_preview_start integer default 0,
  youtube_preview_end integer default 15,

  works jsonb not null default '[]'::jsonb
    check (jsonb_typeof(works) = 'array'),
  affiliations jsonb default '[]'::jsonb,
  -- Historically observed as string, object, or array on live rows
  -- (see lib/normalize.ts) — jsonb, nullable, matching Production.
  current_activity jsonb default '[]'::jsonb,
  awards jsonb default '[]'::jsonb,
  competitions jsonb default '[]'::jsonb,
  education jsonb default '[]'::jsonb,
  links jsonb default '[]'::jsonb,

  email text,
  instagram text,
  website text,

  -- 'individual' | 'company' | 'project_group' | 'group' — @deprecated per
  -- create_companies_and_artist_companies.sql, kept for existing rows.
  artist_type text,

  -- Links back to the /submit-flow row this artist was created from, if any.
  -- FK added separately below (section 4), after public.submissions exists.
  submission_id bigint,

  claim_code text unique,
  is_demo boolean default false,

  -- Confirmed present in Production; no code in this repo currently reads
  -- or writes it, but it's a real column, not invented.
  motion_intro text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists artists_owner_id_idx on public.artists (owner_id);

-- One "current" artist row per owner — a real Production constraint
-- (artists_owner_id_unique_idx), not merely a lookup index. NULLs (no owner
-- yet, e.g. demo/legacy rows) are exempt via the partial WHERE clause.
create unique index if not exists artists_owner_id_unique_idx
  on public.artists (owner_id)
  where owner_id is not null;

-- Supports jsonb containment queries against works (e.g. searching by work
-- title/tag) — matches Production's artists_works_gin_idx.
create index if not exists artists_works_gin_idx
  on public.artists using gin (works);

-- ⚠ DUPLICATE CLEANUP — see final report section ②. Production has THREE
-- separate triggers on artists that all do the same "set updated_at = now()"
-- on update, via three near-identical functions (on_artist_updated ->
-- handle_updated_at, set_artists_updated_at -> set_updated_at,
-- update_artists_updated_at -> update_updated_at_column). Preview keeps only
-- ONE, reusing the same set_updated_at() helper already defined for
-- profiles above.
drop trigger if exists trg_artists_updated_at on public.artists;
create trigger trg_artists_updated_at
  before update on public.artists
  for each row
  execute function public.set_updated_at();

alter table public.artists enable row level security;

-- ⚠ DUPLICATE CLEANUP — see final report section ②. Production has NINE
-- policies on artists — for every one of the 5 operations kept below, there
-- was a `public`-role duplicate of the `authenticated`-role version (plus a
-- second `anon+authenticated` duplicate of the published-select policy).
-- Preview keeps exactly ONE policy per operation, named to match
-- Production's `authenticated`-role version. NOT reproduced here (checked
-- against the real pg_policies dump, 2026-07-16):
--   - "Anyone can view published artists"        (public,  duplicate of "Public can view published artists")
--   - "Users can delete their own artist profile" (public, duplicate of "Users can delete own artist")
--   - "Users can insert their own artist profile" (public, duplicate of "Users can create own artist")
--   - "Users can update their own artist profile" (public, duplicate of "Users can update own artist")

drop policy if exists "Public can view published artists" on public.artists;
create policy "Public can view published artists"
  on public.artists
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Users can view own artist" on public.artists;
create policy "Users can view own artist"
  on public.artists
  for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "Users can create own artist" on public.artists;
create policy "Users can create own artist"
  on public.artists
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update own artist" on public.artists;
create policy "Users can update own artist"
  on public.artists
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- New relative to this file's previous draft — Production has this policy
-- (DELETE was missing from the earlier best-effort version entirely).
drop policy if exists "Users can delete own artist" on public.artists;
create policy "Users can delete own artist"
  on public.artists
  for delete
  to authenticated
  using (auth.uid() = owner_id);


-- ============================================================================
-- 3. public.submissions
--
-- The public /submit intake form's target table (app/api/popok-submit,
-- app/api/admin/submissions/*, app/p/[id]). NOT the same table as the
-- "artist_submissions" table mentioned in create_performances.sql's
-- 2026-07-14 introspection comment — this repo's code exclusively uses
-- .from("submissions"), never .from("artist_submissions"). Uses an
-- integer id (bigint identity), unlike every uuid-keyed table elsewhere in
-- this schema — kept as-is since app/p/[id]/page.tsx parses ids with
-- Number(...), matching an integer key.
--
-- Column list, nullability, CHECK/UNIQUE constraints, and indexes below were
-- CORRECTED against an actual information_schema/pg_catalog dump of
-- Production's real `submissions` table (2026-07-16). Ordinal-position gaps
-- in that dump indicate historically dropped columns — not reconstructed
-- here on purpose, per explicit instruction not to guess at columns no
-- longer present.
-- ============================================================================

create table if not exists public.submissions (
  id bigint generated by default as identity primary key,

  name text not null,
  email text not null,
  instagram text,
  genre text not null,

  bio_short text,
  profile_image_url text,
  profile_image_urls jsonb not null default '[]'::jsonb
    check (jsonb_typeof(profile_image_urls) = 'array'),
  motion_video_url text,

  works jsonb not null default '[]'::jsonb
    check (jsonb_typeof(works) = 'array'),

  additional_requests text,

  -- Real Production allows 'reviewing' too (an intermediate admin state not
  -- otherwise referenced by name in this repo's code, but a real value).
  status text not null default 'pending'
    check (status in ('pending', 'reviewing', 'approved', 'rejected')),

  -- Private login code (poc_xxxxxxxx) issued at submit time.
  claim_code text unique,
  -- Slug of the artists row this submission was published as, once approved.
  public_slug text unique,

  -- AI-parsed structured profile, populated by app/api/admin/submissions/[id]/parse.
  parsed_profile jsonb,
  parsed_at timestamptz,
  -- 'reviewed' is real (matches app/api/admin/submissions/[id]/route.ts's
  -- "AI 검수 안전장치" gate, which requires parser_status = 'reviewed' before
  -- a parsed submission can be published) — code-inference had missed it.
  parser_status text default 'not_parsed'
    check (parser_status in ('not_parsed', 'parsing', 'parsed', 'reviewed', 'error')),
  parser_error text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Matches app/p/[id]/page.tsx's `.eq("name", decodedId)` fallback lookup and
-- lib/supabaseSubmissions.ts's email use — both real Production indexes.
create index if not exists idx_submissions_email on public.submissions (email);
create index if not exists idx_submissions_name on public.submissions (name);

-- Supports jsonb containment queries against works — matches Production's
-- submissions_works_gin_idx. (claim_code/public_slug uniqueness is already
-- covered by the inline `unique` constraints above — Production additionally
-- has idx_submissions_claim_code, idx_submissions_public_slug, and
-- submissions_claim_code_unique_idx, all functionally redundant with those
-- unique constraints; not reproduced here, see final report section ②.)
create index if not exists submissions_works_gin_idx
  on public.submissions using gin (works);

create or replace function public.set_submissions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Production's single real trigger here (update_submissions_updated_at ->
-- update_updated_at_column) is NOT duplicated like artists' — nothing to
-- clean up on this table, kept as its own dedicated function for
-- consistency with organization_applications/performances below.
drop trigger if exists trg_submissions_updated_at on public.submissions;
create trigger trg_submissions_updated_at
  before update on public.submissions
  for each row
  execute function public.set_submissions_updated_at();

-- All access (public submit, public /p/[id] lookup, admin review) goes
-- through service-role server routes (getSupabaseServer()) — same
-- no-anon-policy convention as organization_applications below.
alter table public.submissions enable row level security;


-- ============================================================================
-- 4. public.artists.submission_id -> public.submissions(id)
--
-- Added as a separate ALTER after both tables exist, to avoid ordering this
-- file around a forward reference.
-- ============================================================================

alter table public.artists
  drop constraint if exists artists_submission_id_fkey;
alter table public.artists
  add constraint artists_submission_id_fkey
  foreign key (submission_id) references public.submissions (id) on delete set null;

create index if not exists artists_submission_id_idx
  on public.artists (submission_id);


-- ============================================================================
-- 5. public.performances / public.performance_artists
--
-- Already exist as their own tracked migration files
-- (supabase/migrations/create_performances.sql,
-- supabase/migrations/create_performance_artists.sql) — NOT duplicated here.
-- Run those two files (renamed with timestamp prefixes per the file-ordering
-- plan) as their own step between this file and apply_new_schema.sql, or
-- fold them in later if you'd rather have one single baseline file. Left as
-- separate files for now so their existing git history stays attached to
-- them.
-- ============================================================================


-- ============================================================================
-- 6. public.organization_applications — BASE structure only
--
-- Reproduced verbatim from supabase/migrations/create_organization_applications.sql
-- (already an exact, hand-written match for "the base structure before
-- company_id/portfolio_text/logo_url" — no need to reconstruct this one from
-- a pull). company_id, portfolio_text, logo_url, and the narrowed status
-- constraint are added later by 20260716020000_apply_new_schema.sql — do NOT
-- add them here.
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

  resume_file_path text,
  resume_file_name text,

  status text not null default 'pending'
    check (status in ('pending', 'contacted', 'completed', 'rejected')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_applications_status_created_at_idx
  on public.organization_applications (status, created_at desc);

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

alter table public.organization_applications enable row level security;
-- No anon/authenticated policies on purpose — service-role-only access,
-- same convention as submissions above.


-- ============================================================================
-- 7. VERIFY — read-only, run after applying this file to Preview.
-- ============================================================================

select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
-- Expect: artists, organization_applications, profiles, submissions
-- (+ performances, performance_artists once those two files are run)
-- and NOT companies / artist_companies (those come from apply_new_schema.sql).

select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'artists' and column_name = 'view_count';
-- Expect: no rows — view_count must not exist yet at this stage.

select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'organization_applications'
  and column_name in ('company_id', 'portfolio_text', 'logo_url');
-- Expect: no rows — these must not exist yet at this stage.
