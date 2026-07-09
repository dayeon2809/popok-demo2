# Handoff: Piece of Cake — 디자인 시스템 적용

##개요
"Piece of Cake" (무용·공연 플랫폼)의 새 비주얼 디자인. Home / Artists / Performances / Login 4개 화면과 공용 헤더·푸터·아티스트 모달을 담은 단일 HTML 프로토타입입니다. 이 번들을 기존 Next.js 프로젝트에 이식하는 것이 목표입니다.

## ⚠️ 이 파일들에 대한 중요 안내
`design/` 폴더의 파일들은 **디자인 레퍼런스(HTML 프로토타입)**입니다. 프로덕션에 그대로 복사해 넣는 코드가 아닙니다.

- `design/Piece of Cake Site.dc.html` — 프로토타입 전체 (마크업 + 인라인 스타일 + mock 상태 로직). React 유사 문법(커스텀 템플릿 태그 `<sc-if>`, `<sc-for>`, `<x-import>`, `<dc-import>` 등)으로 쓰여 있는데, 이건 이 디자인 툴 자체의 문법이며 Next.js에서 그대로 쓸 수 없습니다. **레이아웃/스타일/문구/상태 흐름을 읽는 용도로만 참고**하세요.
- `design/_ds/.../` — Piece of Cake UI 디자인 시스템 번들 (React 컴포넌트 + CSS 토큰 + 폰트). 이 안의 컴포넌트(`ArtistCard`, `PerformanceCard`, `ArtistModal`, `AuthNav`, `Logo3D`, `LoadingSpinner`, `ErrorMessage`, `EmptyState`, `CountUp`)는 **실제로 재사용 가능한 소스**입니다 — 기존 프로젝트에 그대로 옮기거나, 이미 비슷한 컴포넌트가 있다면 그 스타일(CSS 변수·클래스)만 맞추면 됩니다.

**작업 방식(권장)**: 기존 Next.js 프로젝트의 기존 페이지/컴포넌트 구조, 데이터 페칭(Supabase 연동), 라우팅은 그대로 두고, 그 위에 이 디자인의 레이아웃과 스타일만 다시 구현하세요. 즉 "이 HTML을 복붙"이 아니라 "이 디자인을 기존 스택으로 재구현"입니다.

## Fidelity
**High-fidelity.** 색상, 타이포그래피, 간격, 컴포넌트 구조가 최종안입니다. 픽셀 단위로 동일하게 재현하는 것이 목표입니다.

## 적용 범위 (기존 기능 보존 원칙)
- 절대 건드리지 않는 것: 기존 라우팅 구조, Supabase 연동/쿼리, API 핸들러, 데이터 모델·타입, 인증 로직.
- 교체하는 것: 레이아웃, 색상, 타이포그래피, 카드/버튼/헤더/푸터 등 시각 컴포넌트의 마크업과 스타일.
- 실무적으로: 각 페이지의 `data fetching`/`page logic`은 그대로 두고, `return (...)` 안의 JSX와 스타일(className/inline style/CSS module)만 이 문서 기준으로 교체하는 방식을 권장합니다.

---

## 디자인 토큰

### 색상
| 토큰 | 값 | 용도 |
|---|---|---|
| `--ink` / `--navy` | `#1E2D40` | 본문 텍스트, 헤딩, 다크 서피스 |
| `--ink-muted` | `#5A6A7A` | 보조 텍스트 |
| `--ink-faint` | `#B8C4CE` | 3차 텍스트, 비활성, 푸터 |
| `--accent` | `#F5A623` | 브랜드 오렌지 — 활성 상태, 강조 밑줄 |
| `--accent-dark` | `#C8841A` | 밝은 배경 위 강조 텍스트, primary 버튼 hover |
| `--accent-light` | `#FEF3DC` | 강조 배경 (뱃지, outline 버튼 hover) |
| `--border` | `#E8EDF2` | 카드/인풋 기본 테두리 |
| `--border-dark` | `#C0CDD8` | 진한 테두리 |
| `--verified` | `#2A6B3A` | 인증 뱃지 |
| `--needs-review` | `#7A5C2E` | 검토 필요 뱃지 |
| `--bg` | `#FFFFFF` | 기본 배경 |
| `--bg-warm` | `#FEFCF8` | 페이지(body) 배경 |
| `--bg-card` | `#FFFFFF` | 카드 배경 |

### 타이포그래피
- 폰트: **Pretendard Variable** (fallback: Pretendard, -apple-system, BlinkMacSystemFont, Apple SD Gothic Neo, sans-serif). `_ds/.../fonts/fonts.css`에 `@font-face` 포함.
- `.display` 클래스: 헤딩용 헤비 display 타입 (Hero H1 `3rem`, 섹션 타이틀 `1.4rem`, 페이지 타이틀 `2rem`, 모달/카드 타이틀 `1.3–1.4rem`).
- `.mono` 클래스: 대문자 라벨 텍스트 (예: "무용 · 공연 플랫폼" eyebrow 텍스트, `--accent-dark` 색상).
- 본문: `0.85–1.05rem`, `color: var(--ink-muted)`, `line-height: 1.7`.

### 간격/모양
- 컨테이너 max-width: `1120px`, 좌우 padding `32px`.
- 카드 그리드: `grid-template-columns: repeat(auto-fit, minmax(220–240px, 1fr))`, `gap: 20px`.
- 버튼 border-radius: `22px` (pill). 인풋 border-radius: `10px`. 카드(`.card`): 둥근 모서리 + 테두리 + hover-lift (디자인 시스템 기본 클래스).
- Primary 버튼: `background: var(--navy)`, hover `var(--accent-dark)`, 텍스트 흰색, padding `12px 26px`, font-weight `700`.
- Outline 버튼: 투명 배경, `1.5px solid var(--navy)` 테두리, hover 시 `var(--accent-light)` 배경 + `var(--accent)` 테두리 + `var(--accent-dark)` 텍스트.

---

## 스크린샷 ↔ 실제 페이지 매핑

`screenshots/` 폴더의 이미지와, 이 디자인을 적용해야 할 기존 Next.js 페이지의 대응 관계입니다. 실제 경로는 프로젝트 구조에 맞게 조정하세요 (예시는 App Router 기준).

| 스크린샷 | 화면 | 대응 페이지(예시) |
|---|---|---|
| `screenshots/01-home.png` | Home | `app/page.tsx` |
| `screenshots/02-artists.png` | Artists 목록 | `app/artists/page.tsx` |
| `screenshots/03-artist-detail.png` | Artist Detail (모달) | `app/artists/[id]/page.tsx` (또는 Artists 목록 위 모달로 구현된 경우 해당 컴포넌트) |
| `screenshots/04-performances.png` | Performances 목록 | `app/performances/page.tsx` |
| `screenshots/05-login.png` | Login | `app/login/page.tsx` |

주의: 프로토타입에서는 Artist Detail을 Artists 목록 위에 뜨는 모달로 구현했지만, 실제 프로젝트에 이미 `app/artists/[id]/page.tsx` 같은 전용 상세 페이지 라우트가 있다면 **그 라우팅 구조를 유지**하면서 이 스크린샷의 카드/배지/버튼 레이아웃만 그대로 적용하면 됩니다. 모달로 할지 별도 페이지로 할지는 기존 프로젝트 구조를 따르고, 이 디자인은 시각 레이아웃 레퍼런스로만 사용하세요.

## 화면 (Screens)

### 1. 공용 헤더 (모든 페이지)
- **레이아웃**: `position: sticky; top:0`, 반투명 배경(`rgba(254,252,248,0.92)`) + `backdrop-filter: blur(8px)`, 하단 `1px solid var(--border)`. 내부 컨테이너 max-width 1120px, flex row, `justify-content: space-between`.
- **좌측**: 로고 버튼 — `Logo3D` 컴포넌트(40×40px로 스케일 다운) + "piece of cake" 워드마크(`.display`, `1.15rem`, `--navy`). 클릭 시 Home 이동.
- **중앙 nav**: Home / Artists / Performances 텍스트 링크. 활성 탭은 `--navy` 색 + `--accent` 색 하단 보더 2px. 나머지는 `--ink-muted`.
- **우측**: `AuthNav` 컴포넌트(로그아웃 상태 UI). 클릭을 가로채 커스텀 Login 페이지로 라우팅(디자인 시스템의 `AuthNav`는 자체 세션 상태만 읽으므로, 실제 프로젝트에서는 이미 있는 로그인 라우트로 그대로 연결하면 됨).

### 2. Home
- **Hero 섹션** (padding `96px 32px 72px`, flex row wrap, gap 64px):
  - 좌측: eyebrow 텍스트 "무용 · 공연 플랫폼"(`.mono`) → H1 "무대는 어렵지 않아요, 피스 오브 케이크."(`.display`, `3rem`, line-height 1.15) → 본문 문단("현대무용, 발레, 한국무용의 아티스트와 공연을 한곳에서 발견하고 예매하세요.") → 버튼 2개: Primary "공연 둘러보기"(→ Performances), Outline "아티스트 찾기"(→ Artists).
  - 우측: `Logo3D` 장식 (220×200px 프레임 안에 스케일 0.9로 배치).
- **"이번 시즌 공연" 섹션**: 섹션 타이틀 + 우측 "전체 보기 →" 링크(→ Performances). 그 아래 `PerformanceCard` 3개 그리드(공연 목록의 앞 3개, featured).

### 3. Artists
- 페이지 타이틀 "아티스트"(`.display`, `2rem`) + 서브텍스트 "현대무용, 발레, 한국무용 분야의 안무가와 무용단을 만나보세요."
- `ArtistCard` 그리드 (minmax 240px), 클릭 시 `ArtistModal` 오픈(풀뷰포트 오버레이).

### 4. Performances
- 페이지 타이틀 "공연"(`.display`, `2rem`) + 서브텍스트 "가까운 시일 내 열리는 공연을 확인하고 예매하세요."
- `PerformanceCard` 그리드 (minmax 220px), 전체 공연 목록.

### 5. Login
- 중앙 정렬 `.card`(max-width 380px, padding `36px 32px`).
- **기본 상태**: 타이틀 "로그인"(`.display`, `1.4rem`) + 서브텍스트 "피스 오브 케이크 계정으로 로그인하세요." + (에러 시) `ErrorMessage` 컴포넌트 + 폼(이메일 라벨/인풋, 비밀번호 라벨/인풋, Primary 풀와이드 "로그인" 버튼).
  - 라벨 스타일: `0.78rem`, `font-weight:700`, `--ink-muted`.
  - 인풋: `.pc-input` — 1.5px 보더 `--border`, radius 10px, focus 시 보더 `--accent`.
- **성공 상태**: 중앙 정렬, 이모지 🎉 + "환영합니다, {닉네임}님"(`.display`) + "로그인되었습니다." + Primary 풀와이드 "홈으로" 버튼.
- 클라이언트 유효성 검사 예시 문구: "이메일과 비밀번호를 모두 입력해주세요." / "올바른 이메일 형식이 아닙니다." — **실제 구현에서는 이 자리에 기존 Supabase 인증 로직의 에러 메시지를 그대로 연결**하면 됩니다. 폼 필드/에러 표시 레이아웃만 이 디자인을 따르세요.

### 6. Artist Modal (오버레이, 모든 페이지에서 열릴 수 있음)
- `PocApp.ArtistModal` 그대로 사용. `artist`(또는 null), `loading`, `error` props를 호출부에서 채워 넣는 구조 — fetch는 호출부(페이지) 책임. `position: fixed` 풀 오버레이이므로 모달/다이얼로그 레이어로 합성.

### 7. 공용 푸터 (모든 페이지)
- 상단 `1px solid var(--border)`, padding `28px 32px`. `Logo3D`(20×20px, opacity 0.8) + "© 2026 piece of cake" (`--ink-faint`, `0.8rem`).

---

## 인터랙션 & 상태
- **라우팅**: 프로토타입은 페이지 전환을 로컬 state(`page: 'home'|'artists'|'performances'|'login'`)로 흉내냈습니다. 실제 프로젝트에서는 기존 Next.js 라우트(App Router/Pages Router)를 그대로 사용하세요 — 이 부분은 새로 만들지 마세요.
- **아티스트 모달**: 카드 클릭 → 모달 오픈(선택된 artist 저장) → 배경 클릭/닫기 버튼 → 모달 닫힘.
- **AuthNav 클릭 가로채기**: 프로토타입에서는 로그아웃 상태의 AuthNav 링크 클릭을 가로채 Login 페이지로 보냅니다. 실제 프로젝트에서는 기존 인증 라우트로 연결하면 되고, 로그인 상태의 AuthNav(아바타/닉네임/로그아웃) UI는 이 디자인 시스템 컴포넌트에 이미 있으니 그대로 사용 가능합니다.
- **로그인 폼**: 제출 시 클라이언트 검증 → 에러 시 `ErrorMessage` 표시 → 성공 시 환영 카드로 전환. **실제 검증/인증 호출은 기존 Supabase 로직을 그대로 사용**하고, 이 디자인은 로딩/에러/성공 상태의 시각 레이아웃만 참고하세요.
- **호버 상태**: nav 링크(밑줄 강조 없음, 색상 고정 — 활성 탭만 밑줄), Primary/Outline 버튼(위 색상표 참고), `.card`(hover-lift, 디자인 시스템 기본 동작).
- **반응형**: 헤더 nav, hero, 카드 그리드 모두 `flex-wrap`/`auto-fit` 기반이라 좁은 화면에서 자연스럽게 줄바꿈됩니다. 별도 모바일 브레이크포인트를 하드코딩하지 않았습니다 — 필요 시 기존 프로젝트의 반응형 기준(브레이크포인트)을 적용하세요.

## State (참고용 — 실제 데이터는 기존 Supabase 연동으로 대체)
프로토타입 mock 데이터 구조 (실제 스키마는 기존 프로젝트 것을 사용):
- `artists`: `{ id, name, name_en, field, type, works[], verified, instagram?, website? }`
- `performances`: `{ id, title, company, startDate, endDate, venue, genre[] }`
- `selectedArtist`, `loginEmail`, `loginPassword`, `loginError`, `loginSuccess` — 화면 로컬 UI 상태.

## Assets
- 로고: `Logo3D` — 디자인 시스템 컴포넌트, 커스텀 이미지 없음.
- 폰트: Pretendard Variable (`design/_ds/.../fonts/`).
- 이모지 🎉 (로그인 성공 상태) 외 아이콘/이미지 자산 없음.

## 컴포넌트 매핑 (Piece of Cake UI → 기존 코드)
| 디자인 시스템 컴포넌트 | 사용 위치 | 비고 |
|---|---|---|
| `Logo3D` | 헤더, Hero, 푸터 | 크기만 다르게(scale) 반복 사용 |
| `AuthNav` | 헤더 | 자체 세션 상태 읽음, props 없음 |
| `PerformanceCard` | Home(featured 3개), Performances | `performance` prop |
| `ArtistCard` | Artists | `artist`, `onClick` prop |
| `ArtistModal` | 전역 오버레이 | `artist`, `loading`, `error`, `onClose` prop |
| `ErrorMessage` | Login 폼 에러 | `message` prop |
| (미사용이지만 참고) `LoadingSpinner`, `EmptyState`, `CountUp` | 로딩/빈 상태/숫자 카운트가 필요한 곳에 동일 토큰으로 활용 가능 |

## 파일
- `design/Piece of Cake Site.dc.html` — 전체 프로토타입 소스 (참고용, 프로덕션 코드 아님).
- `design/_ds/piece-of-cake-ui-.../` — Piece of Cake UI 디자인 시스템 번들: `_ds_bundle.js`(컴포넌트), `_ds_bundle.css` + `styles.css`(토큰/클래스), `fonts/`(Pretendard Variable), 컴포넌트별 `.prompt.md`/`.d.ts` 참고 문서.
- `design/support.js` — 프로토타입 런타임 헬퍼 (Next.js에는 불필요, 참고용 아님 — 무시해도 됨).
- `screenshots/01-home.png` ~ `screenshots/05-login.png` — 각 화면 스크린샷. 위 "스크린샷 ↔ 실제 페이지 매핑" 표 참고.

## Next.js 이식 시 권장 절차
1. `design/_ds/.../` 안의 디자인 시스템 컴포넌트(`ArtistCard`, `PerformanceCard`, `ArtistModal`, `AuthNav`, `Logo3D`, 상태 컴포넌트들)를 기존 프로젝트의 컴포넌트 폴더로 옮기고, 기존 프로젝트의 데이터 타입에 맞게 props를 연결합니다.
2. `styles.css`/`_ds_bundle.css`의 CSS 커스텀 프로퍼티(`--ink`, `--accent` 등)를 기존 프로젝트의 전역 스타일(전역 CSS 또는 Tailwind 테마 확장)에 병합합니다.
3. 각 기존 페이지(Home/Artists/Performances/ArtistDetail/Login)의 데이터 페칭·라우팅 코드는 그대로 두고, 반환하는 JSX만 이 README의 레이아웃 설명대로 다시 작성합니다.
4. 헤더/푸터는 공용 레이아웃 컴포넌트로 한 번만 구현해 모든 페이지에서 재사용합니다.
