## Piece of Cake design system — conventions

**Scope of this sync.** 9 components: `CountUp`, `Logo3D`, `LoadingSpinner`, `ErrorMessage`, `EmptyState` (status/utility pieces — the last three are named exports of one source file, `components/ui/States.tsx`), plus the core content components `ArtistCard`, `ArtistModal`, `PerformanceCard`, `AuthNav`. Still not a full component library — no buttons, inputs, or layout primitives yet.

**No provider needed.** None of the 9 components read from React context — mount them directly, no wrapper required.

**Card components manage their own display state via props, not fetching.** `ArtistCard` / `PerformanceCard` take a fully-formed `artist`/`performance` object and an optional `onClick`. `ArtistModal` takes `artist` (or `null`) plus `loading`/`error` booleans/strings — the caller owns the fetch and passes the state in; the modal itself has no network dependency. `ArtistModal` is a full-viewport overlay (`position: fixed`) — compose it as a modal/dialog layer, not inline content.

**`AuthNav` reads its own session state — no props.** It calls into the app's session module on mount to decide "logged in" vs "logged out" and renders one or the other. In this synced bundle that module is stubbed to always report "logged out" (see the source repo's own `lib/supabase.ts` — currently a local-storage-only mock with real Supabase integration explicitly left as a commented-out "future setup"), so build with it as a static logged-out nav link; the logged-in avatar/nickname/logout layout exists in the real app but isn't exercised here.

**Styling idiom: CSS custom properties + a small utility-class vocabulary, not a class-per-property system.** Most styling is inline `style={{ ... }}` reading `var(--token)`; on top of that, a handful of reusable classes cover recurring shapes — `ArtistCard`/`PerformanceCard` use `.card` for their container and `.tag`/`.tag-navy` for badges. Use these same classes (not new ones) for anything card- or badge-shaped:

| Token | Value | Use |
|---|---|---|
| `--ink` | `#1E2D40` | primary text |
| `--ink-muted` | `#5A6A7A` | secondary text |
| `--ink-faint` | `#B8C4CE` | tertiary/disabled text |
| `--navy` | `#1E2D40` | headings, dark surfaces (same value as `--ink`) |
| `--accent` | `#F5A623` | brand orange — spinners, active states |
| `--accent-dark` | `#C8841A` | accent text on light backgrounds |
| `--accent-light` | `#FEF3DC` | accent-tinted backgrounds/badges |
| `--border` / `--border-dark` | `#E8EDF2` / `#C0CDD8` | card and input borders |
| `--verified` / `--needs-review` | `#2A6B3A` / `#7A5C2E` | status badge colors |
| `--bg` / `--bg-warm` / `--bg-card` | `#FFFFFF` / `#FEFCF8` / `#FFFFFF` | page/card surfaces |

Reusable classes shipped alongside the tokens: `.card` (bordered, rounded, hover-lift container), `.tag` / `.tag-navy` / `.tag-outline` (pill badges), `.divider`, `.card-img` (gradient image placeholder), `.mono` (uppercase label text), `.display` (heavy display type). Build new pieces by combining these with the tokens above, matching the existing components' inline-style pattern rather than inventing new class names.

**Font: Pretendard Variable.** The stylesheet's font stack is `'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif`. Only "Pretendard Variable" ships as a `@font-face` (fetched from the public jsDelivr mirror of the `pretendard` npm package — the source repo itself doesn't bundle it and was relying on the OS having it installed). The other names in the stack are system fonts on macOS/Windows and are expected to come from the OS, not this bundle.

**Where the truth lives.** `styles.css` (imports `_ds_bundle.css`, which carries the tokens/classes above) and each component's `.prompt.md`.

**Example — an artist list with its loading/error/empty states:**
```jsx
import { ArtistCard, LoadingSpinner, ErrorMessage, EmptyState } from 'poc-app';

function ArtistList({ artists, loading, error }) {
  if (loading) return <LoadingSpinner message="아티스트 정보를 불러오는 중..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!artists.length) return <EmptyState message="검색 결과가 없습니다." />;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
      {artists.map((a) => (
        <ArtistCard key={a.id} artist={a} onClick={() => {}} />
      ))}
    </div>
  );
}
```
