-- ============================================================================
-- create_performance_artists.sql
--
-- Many-to-many join table between performances and artists, keyed on the real
-- primary keys (performances.id, artists.id — both uuid, confirmed via live
-- schema introspection), never on artist_name or slug.
--
-- Depends on create_performances.sql having been run first.
--
-- Review this file in the Supabase SQL Editor before running. Nothing here
-- runs automatically.
-- ============================================================================

create table if not exists public.performance_artists (
  id uuid primary key default gen_random_uuid(),

  performance_id uuid not null references public.performances (id) on delete cascade,
  artist_id uuid not null references public.artists (id) on delete cascade,

  -- Free-text role for this artist on this performance, e.g. 안무 / 출연 / 연출 / 음악 / 제작.
  role text,

  created_at timestamptz not null default now(),

  -- Prevent the same artist being linked twice to the same performance.
  constraint performance_artists_unique_link unique (performance_id, artist_id)
);

create index if not exists performance_artists_performance_id_idx
  on public.performance_artists (performance_id);

create index if not exists performance_artists_artist_id_idx
  on public.performance_artists (artist_id);

-- ── RLS ──────────────────────────────────────────────────────────────────
-- Service-role queries (lib/performances.ts) bypass RLS entirely. This policy
-- only matters if the table is ever read directly with the anon/public key.
-- Read access is intentionally not restricted to each performance's own
-- status here — lib/performances.ts already filters relatedArtists down to
-- artists.status = 'published' after the join, and only exposes rows for
-- performances it already decided are public.
alter table public.performance_artists enable row level security;

drop policy if exists "Public can read performance-artist links" on public.performance_artists;
create policy "Public can read performance-artist links"
  on public.performance_artists
  for select
  to anon, authenticated
  using (true);
