## Repo shape

This is a Next.js **app**, not a publishable component package — there's no `dist/`, no `.d.ts` output, no build script that produces one. The sync uses synth-entry mode via a hand-authored `.design-sync/entry.tsx` (set as `cfg.entry`) that re-exports only the components explicitly listed there, instead of letting the converter auto-scan all of `components/` (which would pull in whatever's excluded at the time, plus each file's own imports, unfiltered). `cfg.tsconfig` points at `.design-sync/tsconfig.ds.json`, a DS-only tsconfig that extends path resolution with mock overrides (see below) — never the app's real `tsconfig.json`, which has no such overrides. Any component added to `entry.tsx` also needs a `componentSrcMap` entry (positive path) since there's no `.d.ts` to discover exports from.

`cfg.srcDir` is pinned to `"components"` — the default heuristic (`src`/`lib`/`components`, in that order) would otherwise pick the repo's `lib/` dir (Supabase client, unrelated utils) since it exists and comes first in the search order.

## ArtistCard / ArtistModal / AuthNav / PerformanceCard (added in the second sync)

These 4 were initially excluded, then added back per user request with Supabase/auth isolated. What actually needed isolating turned out to be narrower than expected:

- `ArtistCard`, `ArtistModal`, `PerformanceCard` have **no** Supabase dependency at all — pure presentational, props-in. `PerformanceCard`'s only lib import (`@/lib/performances`) just reads a static `data/performances.json`.
- `AuthNav` imports `getLoggedInUser`/`logout` from `@/lib/supabase` — but that module is *already* a pure localStorage-based mock (no real `@supabase/supabase-js` client instantiated; a real client is explicitly left as a commented-out "future setup" block at the bottom of the file). Still isolated it via `.design-sync/tsconfig.ds.json` (`@/lib/supabase` → `.design-sync/mocks/supabase.ts`, always-anonymous) specifically so a *future* real-Supabase migration in that file can't silently start instantiating a live client inside the design bundle.
- `AuthNav` also imports `next/link`, which pulled in ~180KB of Next.js App Router client internals (`next/dist/shared/lib/router/...`) that expect a router context this static bundle doesn't have. Mocked to a plain `<a>` via the same tsconfig (`next/link` → `.design-sync/mocks/next-link.tsx`) — dropped the bundle from 195KB back to 43KB with no behavior loss (Link was only ever used for its `href`, never client-side navigation, in these previews).
- **Resolver quirk, not a config knob**: `tsconfigPathsPlugin` (in the bundled `lib/bundle.mjs`, not forked) resolves a bare-extension match before trying `/index.ts` — so `@/types` (a directory with `index.ts`) failed with `Cannot read file "types"` until pinned to the exact file via an exact (non-wildcard) `"@/types"` paths entry ahead of the `"@/*"` wildcard in `tsconfig.ds.json`. Any other `@/<dir>`-style import added later will hit the same thing; add another exact override rather than touching `lib/bundle.mjs`.
- `ArtistModal` is a `position: fixed` full-viewport overlay → flagged `[GRID_OVERFLOW]` in the contact-sheet grid. Fixed via `cfg.overrides.ArtistModal: {"cardMode": "single", "primaryStory": "Default"}` (its `Loading`/`Error` exports still exist and are graded, just not the card shown in the grid).
- `componentSrcMap` needs a **positive** path entry for every component here (not just the original 5) — there's no `.d.ts` to auto-discover exports from in this repo shape, so anything not listed (or explicitly `null`'d) is invisible to the converter regardless of what `entry.tsx` exports.

## cssEntry: `.design-sync/tokens.css`, not `app/globals.css` directly

`app/globals.css`'s first line is `@import "tailwindcss";` — a bare specifier Tailwind resolves at its own build time, not a real file path. Copied verbatim it becomes an unresolvable `@import` in the shipped CSS ([CSS_IMPORT_MISSING], a hard build error). None of the 3 synced components use Tailwind utility classes (all are inline-style + `var(--token)`), so `.design-sync/tokens.css` is `app/globals.css` with that one line stripped — everything else (tokens + `.card`/`.tag`/etc. utility classes) is unchanged. **Re-sync risk**: if `app/globals.css` changes, re-copy it and strip the tailwind import again (`tail -n +2 app/globals.css > .design-sync/tokens.css` handles it as long as the import stays on line 1).

## Font: Pretendard Variable

Not shipped by the app itself anywhere (no `@font-face`, no `public/` font file, no CDN `<link>`) — the real site currently relies on visitors already having it installed, falling back to system fonts otherwise. Per user's request, fetched the variable woff2 from the public jsDelivr mirror (`cdn.jsdelivr.net/npm/pretendard/dist/web/variable/woff2/PretendardVariable.woff2`) into `.design-sync/fonts/` and wrote a matching `@font-face` in `.design-sync/fonts/pretendard.css`, wired via `cfg.extraFonts`. `[FONT_MISSING]` still fires for the plain "Pretendard" (non-variable) and "Apple SD Gothic Neo" names later in the font stack — accepted, since "Apple SD Gothic Neo" is a macOS system font not meant to ship, and "Pretendard Variable" (which IS shipped) is first in the stack so it wins wherever available.

## Known render warns

- `[RENDER_ERRORS]` on `ErrorMessage`: the render-check's caught-error text scan (`text.startsWith('⚠')`) collides with the component's own legitimate "⚠️" warning-icon glyph in its error-state UI. Confirmed via the screenshot (`_screenshots/review/general__ErrorMessage.png`) that the cell renders correctly — this is a false positive, not a real error. Expected on every re-sync as long as the component keeps that glyph.

## Re-sync risks

- If `app/globals.css` gains real Tailwind utility class usage in the 3 synced components (currently none do), `.design-sync/tokens.css` needs to become a real Tailwind build output, not a stripped copy.
- The Pretendard font file is a one-time CDN fetch, not tracked back to a version — if the app ever pins a specific Pretendard version, update `.design-sync/fonts/PretendardVariable.woff2` to match.
- `.design-sync/entry.tsx` is hand-maintained — adding/removing synced components means editing both it and `cfg.componentSrcMap`.
- `.design-sync/mocks/supabase.ts` always reports "logged out" — if `lib/supabase.ts` gains a real Supabase client and other synced components start depending on authenticated data (not just `AuthNav`'s two functions), the mock needs matching exports, and the design bundle's "logged in" state will keep being unrepresented until someone authors it.
- `.design-sync/mocks/next-link.tsx` drops all Next.js Link behavior (prefetch, client-side transitions) down to a bare `<a>`. Fine for a static design bundle; don't copy this mock's presence as a signal that the real app doesn't need real `next/link`.
