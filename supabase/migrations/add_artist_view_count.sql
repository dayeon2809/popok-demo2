-- ============================================================================
-- add_artist_view_count.sql
--
-- Adds a cumulative view counter to the existing "artists" table so artist
-- detail pages (/artists/[slug]) can display and rank by view count. No
-- per-visit log table is created — only a running total, per the product
-- decision to keep this simple and reusable later for an "artists of the
-- week" feature (`order by view_count desc`).
--
-- The increment itself must be atomic under concurrent requests, so this
-- migration also creates increment_artist_view_count(), an RPC function
-- that performs the check-and-increment as a single UPDATE statement
-- (no read-then-write race). It accepts either the artist's uuid or its
-- slug so callers (app/api/artists/[id]/view/route.ts) don't need a
-- separate lookup step, and it only touches rows with status = 'published'
-- — draft artists and nonexistent ids/slugs simply return NULL (no row
-- updated), which the API route treats as "don't increment".
--
-- Review this file in the Supabase SQL Editor before running. Nothing here
-- runs automatically.
-- ============================================================================

alter table public.artists
  add column if not exists view_count bigint not null default 0;

-- Supports future "most-viewed this week" queries (order by view_count desc)
-- without a full table scan.
create index if not exists artists_view_count_idx
  on public.artists (view_count desc);

create or replace function public.increment_artist_view_count(identifier text)
returns bigint
language plpgsql
as $$
declare
  new_count bigint;
begin
  update public.artists
  set view_count = view_count + 1
  where status = 'published'
    and (id::text = identifier or slug = identifier)
  returning view_count into new_count;

  return new_count; -- NULL when no published row matched (draft or not found)
end;
$$;
