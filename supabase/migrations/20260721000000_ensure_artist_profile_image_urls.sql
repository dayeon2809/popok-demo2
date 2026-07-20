-- Migration to ensure profile_image_urls jsonb column exists on public.artists table
alter table public.artists
add column if not exists profile_image_urls jsonb not null default '[]'::jsonb;
