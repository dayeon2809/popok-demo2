# Walkthrough — Homepage Performances ↔ Artists

## Context found before writing any code

- `docs/DEVELOPER_PRODUCT_OVERVIEW.md` describes an older architecture (`app/performances/`,
  `lib/performances.ts` reading `data/performances.json`, a Supabase `performances` table with
  an `artist_id` column, admin performance CRUD). **None of that exists on disk.** There is no
  `app/performances/` route, no prior `lib/performances.ts`, and no `data/performances.json`.
  That doc is stale and was not used as a source of truth here — the actual current pattern
  (`lib/artists.ts` querying Supabase directly via `getSupabaseServer()`, no JSON cache layer)
  is what this work follows instead.
- Live schema introspection (service-role OpenAPI schema fetch, `scripts/inspectAllDb.ts`) confirmed
  the real tables are only: `profiles`, `popok_upload_requests`, `artist_submissions`, `artists`,
  `submissions`. **There is no `performances` table in the live database at all** — confirmed twice,
  once via the OpenAPI schema (returned `undefined` for `performances`) and once via a direct REST
  call (`404 PGRST205: Could not find the table 'public.performances'`).
- `artists.id` is `uuid` (confirmed from the live schema), so `performances.id` and the
  `performance_artists` foreign keys were designed as `uuid` too, not assumed.
- `Performance`/`PerformanceComment`/`PerformanceRating` types already existed in `types/index.ts`
  and a `usePerformances`/`usePerformance` hook pair already existed in `lib/api.ts`, but neither
  hook is called from any `.tsx` file anywhere in the repo, and no `/api/performances` route exists.
  This is dead scaffolding from an earlier design pass. It was safe to redefine `Performance`'s
  shape without breaking anything — verified by grepping for actual call sites first.
- `scripts/migrateSlugsToSupabase.ts`, a real (if currently non-functional) one-off migration
  script, already assumes a `performances` table with `title`, `venue`, `start_date`, `external_id`,
  `slug` columns. The new schema keeps those exact column names for continuity with that script.

## Why the DB currently returns no performances

Both `performances` and `performance_artists` are net-new tables — see
`supabase/migrations/create_performances.sql` and `create_performance_artists.sql`. **Neither has
been run yet.** Until you run them in the Supabase SQL Editor, `lib/performances.ts` will hit
`relation "performances" does not exist` on every call. Every function in that file catches the
Supabase error, logs it via `console.error`, and returns `[]` / `null` — so the homepage renders
normally with the "이번 주 공연" section simply hidden (same pattern `ArtistCarousel`/
`PerformanceCarousel` already used for an empty list), rather than a 500.

## Schema decisions worth knowing about

- `performances.status` is the single source of truth (`'draft' | 'published' | 'archived'`),
  matching `artists.status`'s existing convention. The `Performance.published` field in the app
  type is *derived* (`status === 'published'`) in `lib/performances.ts`'s row mapper, not stored
  as a second column — avoids the two ever disagreeing.
- Added `performances.featured boolean default false` (not in the original request's SQL sketch)
  specifically to back `getFeaturedPerformances()`, since no such flag existed anywhere yet and the
  function needs something to filter on. Independent of `status`.
- `genre` and `category` are both plain `text` columns, mirroring how `artists` already stores both
  (`genre`, `category`) rather than inventing a new convention.

## Artist matching principle (for the future crawler + admin UI)

Per the request, no admin matching UI was built in this pass — the current API surface
(`performance_artists` with just `performance_id`, `artist_id`, `role`) intentionally only stores
**confirmed** links. The recommended future flow, so nothing built now blocks it later:

```
크롤링 → 원본 출연진 이름 저장 (raw text, not yet linked to any artist)
      → 이름 정규화 (whitespace/공백, 특수문자 정리)
      → artists 후보 검색 (이름 유사도 매칭, 여러 후보 가능)
      → 관리자 검수 (동명이인·단체명 충돌은 사람이 판단)
      → performance_artists에 artist_id 확정 저장 (여기서 처음 이 테이블에 행이 생김)
```

Crucially: **never** auto-insert a `performance_artists` row just because a crawled name string
matches an `artists.name` value. Do it once and admin-approves-links stops applying scrutiny to
new performances forever.

When the admin matching UI is eventually built, it will need a staging table that this migration
deliberately does *not* create yet (kept out of scope, per the request) — something like:

```
performance_cast_candidates
- id
- performance_id
- raw_name          -- exactly as scraped, before normalization
- role
- candidate_artist_ids   -- array/jsonb of similarity-matched artists.id candidates
- match_confidence
- review_status     -- pending | confirmed | rejected
- confirmed_artist_id    -- set only once an admin picks one, then copied into performance_artists
```

`performance_artists` itself stays the clean, confirmed-only join table — the staging/candidate
data belongs in its own table so a bad crawler guess can never leak into what's displayed publicly.

## Known follow-ups / not done in this pass

1. **Run the two migration SQL files** in the Supabase SQL Editor — nothing in this codebase
   executes them automatically. Until then `getUpcomingPerformances()` returns `[]` and the
   homepage section stays hidden by design.
2. No `/performances/[slug-or-id]` detail page exists yet. `getPerformanceByIdOrSlug()` in
   `lib/performances.ts` is ready for it, and `PerformanceCarousel`'s link-priority helper has a
   `TODO` marking exactly where to slot the internal route in ahead of `ticketUrl`/`sourceUrl` once
   that page exists.
3. No crawler or admin matching UI was touched — see the matching principle above for the
   recommended shape when that's picked up.
4. `lib/api.ts`'s `usePerformances`/`usePerformance` hooks and the pre-existing `Performance`-shaped
   fields (`company`, `city`, `posterImage`, `artistIds`, etc.) were left in `types/index.ts` as
   optional/legacy for now rather than deleted, since they're unused-but-harmless; worth deleting
   in a follow-up cleanup once confirmed nothing external depends on them.
