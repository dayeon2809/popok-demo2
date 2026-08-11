# POPOK 개발 인수인계 · 개선 백로그

> 마지막 코드 점검: 2026-07-24  
> 기준: 현재 저장소의 `app/`, `components/`, `lib/`, `supabase/`, 설정 및 Next.js 16.2.9 로컬 문서

## 이 문서의 목적

새로 합류한 개발자가 “무엇부터, 왜, 어디까지” 고쳐야 하는지 바로 판단할 수 있도록 현재 코드에서 확인된 작업을 우선순위와 완료 조건까지 정리한 문서입니다.

현재 POPOK은 단순 랜딩 페이지가 아닙니다. Next.js App Router 기반으로 공개 아티스트·단체 페이지, Supabase Auth/DB/Storage, 관리자 CMS, 단체 신청, 포트폴리오 요청, AI 문서 파싱, 이메일 알림까지 포함한 MVP입니다. 따라서 아래 순서는 **보안 경계 → 운영 안정성 → 테스트와 타입 → 구조 개선 → 사용자 경험**을 기준으로 잡았습니다.

## 현재 상태 한눈에 보기

| 영역 | 현재 상태 | 판단 |
|---|---|---|
| 프로덕션 빌드 | `npm run build` 성공 | 배포 가능한 상태 |
| 테스트·Lint | 스크립트와 설정 없음 | 회귀 방지 장치 필요 |
| API | Route Handler 약 65개 | 인증·검증 로직 표준화 필요 |
| 인증 | 사용자 Supabase Auth + 관리자 passcode 혼용 | 관리자 인증 교체 필요 |
| DB 접근 | 서버의 service-role client 사용 | API별 권한 검토 필수 |
| 타입 | `as any` 사용이 광범위함 | DB 타입 생성 및 적용 필요 |
| 화면 구조 | 1,000줄 이상 파일 다수 | 기능 단위 분리 필요 |
| DB 마이그레이션 | timestamp 파일과 무번호 파일 혼재 | 적용 순서·재현성 정리 필요 |
| CI | 저장소 내 GitHub Actions 없음 | PR 품질 게이트 필요 |
| Next.js 빌드 | 성공하나 workspace root 경고 발생 | Turbopack root 정리 필요 |

---

## P0 · 배포 전에 반드시 처리

### SEC-001. 모든 변경 API에 서버 측 인증·인가 적용

**근거**

- `app/api/admin/companies/[id]/unlink-owner/route.ts`는 관리자 인증 검사 없이 service-role client로 `companies.owner_id`와 `artist_companies.is_primary`를 변경합니다.
- 관리자 API마다 `x-admin-passcode` 검사 코드가 반복되어 누락 가능성이 높습니다.
- `app/admin/layout.tsx`의 `sessionStorage` 확인은 화면 표시용일 뿐 서버 권한 검증이 아닙니다.
- Next.js의 현재 가이드도 Proxy만 믿지 말고 데이터에 가까운 Route Handler/데이터 접근 계층에서 권한을 확인하도록 권장합니다.

**작업**

- [ ] `/api/admin/**` 전체를 변경/조회/파일 접근으로 나눠 인증 여부를 전수 조사한다.
- [ ] `requireAdmin()` 같은 단일 서버 전용 가드를 만들고 모든 관리자 Route Handler 시작점에서 호출한다.
- [ ] `unlink-owner`를 포함해 인증이 빠진 엔드포인트를 즉시 차단한다.
- [ ] 일반 사용자 API는 로그인 여부뿐 아니라 대상 리소스의 `owner_id`까지 검증한다.
- [ ] service-role client는 권한 검증 이후의 서버 코드에서만 사용하고 브라우저 번들 유입을 방지한다.
- [ ] 인증 실패는 `401`, 권한 부족은 `403`으로 일관되게 응답한다.

**완료 조건**

- 비로그인·일반 사용자·관리자 각각에 대한 API 권한 테스트가 존재한다.
- 인증되지 않은 요청으로 관리자 데이터 조회/변경/파일 다운로드가 불가능하다.
- 새 관리자 API가 공통 가드 없이 추가되면 테스트 또는 정적 검사에서 실패한다.

### SEC-002. 관리자 passcode를 실제 세션 기반 관리자 인증으로 교체

**근거**

- 다수 관리자 Route Handler가 `process.env.ADMIN_PASSCODE || "1234"` 형태의 기본값을 사용합니다.
- 입력한 passcode가 브라우저 `sessionStorage`에 저장되고 요청 헤더로 재사용됩니다.
- `/api/admin/verify`에는 시도 횟수 제한이나 잠금 정책이 없습니다.

**작업**

- [ ] Supabase Auth 사용자에 `admin` 역할을 부여하는 방식으로 전환한다.
- [ ] 역할은 조작 가능한 클라이언트 상태가 아니라 서버에서 검증 가능한 DB/claims에 둔다.
- [ ] 전환 전 임시 조치로 기본값 `1234`를 제거하고, 환경변수가 없으면 서버 시작/요청을 실패시킨다.
- [ ] 로그인 실패 rate limit, 감사 로그, 세션 만료 및 로그아웃을 구현한다.
- [ ] passcode 전환이 끝나면 `sessionStorage`와 `x-admin-passcode` 코드를 제거한다.

**완료 조건**

- 관리자 화면과 API가 동일한 서버 검증 세션을 사용한다.
- passcode 또는 관리자 비밀값이 브라우저 저장소·네트워크 요청에 노출되지 않는다.
- 관리자 권한 부여/회수 절차가 운영 문서에 적혀 있다.

### SEC-003. 범용 업로드 API 제한

**근거**

- `app/api/upload/route.ts`의 일반 업로드 경로는 요청자가 `bucket`과 `path`를 지정할 수 있습니다.
- 이 경로는 인증, 허용 버킷 목록, 일반 파일의 크기 제한 및 강한 MIME/확장자 검증이 없습니다.
- 업로드는 service-role client로 실행되고 public URL을 반환합니다.

**작업**

- [ ] 용도별 업로드 엔드포인트 또는 서버 내부 함수로 분리한다.
- [ ] 허용 버킷·경로 prefix·MIME·확장자·최대 크기를 서버 상수로 고정한다.
- [ ] 로그인/소유권이 필요한 업로드는 사용자 및 대상 리소스 권한을 검증한다.
- [ ] 파일 시그니처 검사와 이미지 재인코딩/악성 파일 검사 도입 여부를 결정한다.
- [ ] 실패한 DB 저장 이후 orphan object를 정리하는 보상 로직을 추가한다.
- [ ] IP/사용자 기준 rate limit과 용량 모니터링을 추가한다.

**완료 조건**

- 임의 버킷, 실행성 파일, 제한 초과 파일, 비인가 사용자의 업로드가 거부된다.
- 허용된 정상 이미지와 이력서 업로드의 통합 테스트가 통과한다.

### SEC-004. 외부 입력·고비용 API 보호

**대상**

- `/api/profile/parse`
- `/api/admin/**/ai-structure`
- `/api/instagram/preview`
- `/api/organizations/apply`
- `/api/popok-submit`
- `/api/auth/check-username`
- `/api/debug/airtable`

**작업**

- [ ] Zod schema로 body/query/form-data 검증을 통일한다.
- [ ] OpenAI·외부 HTTP·이메일 발송 엔드포인트에 timeout, rate limit, 요청 크기 제한을 둔다.
- [ ] SSRF 가능성이 있는 URL 입력은 scheme, hostname, redirect, 사설 IP를 검증한다.
- [ ] `/api/debug/airtable`은 삭제하거나 개발 환경과 관리자 권한으로 이중 제한한다.
- [ ] 사용자에게 내부 오류·키·DB 세부 정보가 노출되지 않도록 오류 응답을 표준화한다.

**완료 조건**

- 잘못된 입력과 과도한 반복 요청에 예측 가능한 `4xx` 응답을 반환한다.
- 외부 서비스 장애가 요청을 무한 대기시키거나 비용 폭증으로 이어지지 않는다.

---

## P1 · 첫 번째 안정화 스프린트

### QA-001. 최소 테스트 피라미드와 CI 구축

현재 `package.json`에는 `dev`, `build`, `start`와 마이그레이션 스크립트만 있고 `lint`, `typecheck`, `test`가 없습니다.

**작업**

- [ ] `typecheck`, `lint`, `test`, `test:e2e` 스크립트를 추가한다.
- [ ] Vitest로 순수 함수와 validation schema를 테스트한다.
- [ ] Playwright로 핵심 흐름을 E2E 테스트한다.
- [ ] PR마다 install → typecheck → lint → unit → build를 실행하는 CI를 추가한다.
- [ ] main 또는 배포 브랜치에는 필수 체크를 설정한다.

**우선 E2E 시나리오**

1. 회원가입/로그인/로그아웃과 세션 갱신
2. 아티스트 onboarding 및 본인 프로필 수정
3. 단체 신청 → 관리자 승인/반려
4. 포트폴리오 요청 발송 → 수신 → 상태 변경
5. 관리자 CRUD와 비관리자 접근 차단
6. 파일 업로드의 정상/용량 초과/잘못된 형식
7. 계정 삭제와 연결 데이터 처리

**완료 조건**

- 깨진 빌드·타입 오류·핵심 흐름 회귀가 merge 전에 차단된다.
- 외부 API는 fixture/mock으로 안정적으로 재현된다.

### DATA-001. Supabase schema 타입 생성 및 `any` 제거

`app/`, `components/`, `lib/`에서 `as any`가 수백 회 사용되고 있어 컬럼명 변경이나 응답 shape 오류가 빌드에서 잡히지 않습니다.

**작업**

- [ ] Supabase CLI로 `Database` 타입을 생성하고 생성 명령을 script로 고정한다.
- [ ] browser/server/service-role client 모두 같은 `Database` generic을 사용한다.
- [ ] 우선 관리자 변경 API, 포트폴리오 요청, 계정 삭제 경로부터 `any`를 제거한다.
- [ ] API request/response DTO를 DB row 타입과 분리한다.
- [ ] `types/index.ts`, `lib/types.ts` 등 중복/레거시 타입의 기준 파일을 정한다.

**완료 조건**

- 핵심 write 경로에 `as any`가 남지 않는다.
- 존재하지 않는 table/column 또는 잘못된 update payload가 TypeScript 오류가 된다.

### DATA-002. 마이그레이션을 새 환경에서 재현 가능하게 정리

**근거**

- `supabase/migrations/`에 timestamp가 붙은 파일과 `add_*.sql`, `create_*.sql` 파일이 혼재합니다.
- `baseline`, `manual-migrations`, `schema-snapshots`, `docs/*migration*.sql`도 함께 존재해 무엇이 실행 기준인지 불명확합니다.

**작업**

- [ ] 운영 DB와 migration history를 대조한다.
- [ ] 실행 대상은 timestamp migration으로 통일하고 의존 순서를 확정한다.
- [ ] baseline, snapshot, 수동 복구 SQL의 용도를 README에 명시한다.
- [ ] 빈 로컬 Supabase에 `db reset` 후 동일 schema가 생성되는지 검증한다.
- [ ] RLS policy, Storage policy, index, unique/FK constraint를 함께 점검한다.
- [ ] 파괴적 migration의 backup/rollback 절차를 기록한다.

**완료 조건**

- 새 개발자가 문서의 한 가지 절차로 로컬 DB를 재현한다.
- 운영과 로컬 schema drift를 자동 검사할 수 있다.

### OPS-001. 환경변수 검증과 실행 문서 정비

**작업**

- [ ] 서버 시작 시 필수 환경변수를 Zod 등으로 검증하고 빈 문자열 fallback을 없앤다.
- [ ] `.env.example`에 필수/선택, server-only/public, 발급처를 표시한다.
- [ ] Node/npm 버전을 `engines` 또는 `.nvmrc`로 고정한다.
- [ ] README의 설치, Supabase 연결, migration, seed, 실행, 관리자 생성, 배포 절차를 현재 코드에 맞춘다.
- [ ] 비밀값 교체 주기와 유출 시 rotation 절차를 기록한다.

**완료 조건**

- 누락된 필수 값은 의미 있는 메시지와 함께 즉시 실패한다.
- 신규 개발자가 별도 구두 설명 없이 로컬 환경을 띄울 수 있다.

### OPS-002. 관측 가능성과 오류 처리 표준화

**작업**

- [ ] `console.error` 중심 로그를 구조화 로그로 교체하고 request ID를 붙인다.
- [ ] 사용자/관리자 작업의 감사 이벤트를 정의한다.
- [ ] 오류 추적 도구와 배포 release/source map을 연결한다.
- [ ] OpenAI, Resend, Instagram, Supabase의 지연·실패율을 수집한다.
- [ ] `app/error.tsx`, 구역별 `error.tsx`, 필요한 `loading.tsx`를 설계한다.
- [ ] 로그에 이메일, 이력서 원문, 토큰 등 개인정보가 남지 않게 redaction한다.

**완료 조건**

- 운영 오류를 특정 요청과 배포 버전까지 추적할 수 있다.
- 핵심 외부 서비스 장애에 알림과 사용자용 fallback이 있다.

### OPS-003. 백업·삭제·개인정보 정책 검증

이 서비스는 이메일, 연락처, 프로필, 이력서 파일과 AI 파싱 결과를 다룹니다.

**작업**

- [ ] 개인정보 항목별 저장 위치, 보존 기간, 접근 주체를 목록화한다.
- [ ] 계정 삭제 시 DB/Auth/Storage/이메일 로그/AI 원문 처리 정책을 확정한다.
- [ ] `app/api/account/delete/route.ts`의 다단계 삭제가 중간 실패해도 복구 가능하도록 설계한다.
- [ ] Supabase DB/Storage 백업과 복원 훈련 절차를 만든다.
- [ ] signed URL 만료, private bucket, 관리자 다운로드 감사 로그를 검증한다.

**완료 조건**

- 삭제/보존 정책이 개인정보 처리방침과 실제 구현에서 일치한다.
- 백업으로 복원 가능한지 정기적으로 검증한다.

---

## P2 · 유지보수성과 개발 속도

### ARCH-001. 대형 페이지와 CMS 컴포넌트 분리

확인된 대표 대형 파일:

- `app/admin/companies/[id]/page.tsx`: 약 2,600줄
- `components/company/CompanyCmsEditor.tsx`: 약 2,200줄
- `app/artists/[id]/page.tsx`: 약 1,700줄
- `app/my-popok/MyPopokClient.tsx`: 약 1,600줄

**작업**

- [ ] 데이터 조회/변경, form state, validation, 표시 컴포넌트를 분리한다.
- [ ] 관리자 회사 편집을 섹션별 컴포넌트와 schema로 나눈다.
- [ ] 재사용 mutation 로직을 feature hook 또는 서버 모듈로 이동한다.
- [ ] `"use client"` 경계를 아래로 내려 초기 JavaScript와 결합도를 줄인다.
- [ ] 한 번에 전면 재작성하지 말고 테스트를 먼저 추가한 뒤 기능 단위로 이동한다.

**완료 조건**

- 페이지 파일은 routing과 orchestration 역할에 집중한다.
- 주요 편집 섹션을 독립적으로 테스트할 수 있다.
- 기존 저장/미리보기/발행 흐름이 E2E 테스트로 보존된다.

### ARCH-002. API 공통 계층 만들기

**작업**

- [ ] `requireUser`, `requireAdmin`, `parseJson`, `parseFormData`, `apiError`를 공통화한다.
- [ ] route별 try/catch, 상태 코드, 오류 payload 형태를 통일한다.
- [ ] Supabase query를 route에서 직접 반복하지 않고 도메인 service/repository로 이동한다.
- [ ] mutation에 idempotency가 필요한 경로(승인, 이메일, 요청 발송)를 식별한다.
- [ ] 목록 API에 pagination, 최대 limit, 정렬 allowlist를 적용한다.

**완료 조건**

- 새 Route Handler가 인증·검증·오류 처리의 표준 템플릿을 따른다.
- 승인 재시도나 네트워크 재전송으로 중복 데이터/메일이 생기지 않는다.

### ARCH-003. 스타일과 UI 기본 요소 정리

현재 큰 컴포넌트에 inline style과 직접 작성한 form/modal/table 패턴이 많습니다.

**작업**

- [ ] 색상, 간격, typography, breakpoint token의 기준을 정한다.
- [ ] Button, Input, Select, Dialog, Toast, Table, FormField를 공통화한다.
- [ ] 관리자 화면부터 inline style을 단계적으로 CSS module/공통 class로 이동한다.
- [ ] loading/error/empty/success 상태 표현을 통일한다.

**완료 조건**

- 공통 UI의 hover/focus/disabled/error 상태가 한 곳에서 관리된다.
- 모바일 수정이 대량의 `!important` override에 의존하지 않는다.

### BUILD-001. Next.js 16 빌드 경고와 설정 정리

`npm run build`는 성공하지만 상위 경로의 다른 lockfile 때문에 Next.js가 workspace root를 잘못 추론할 수 있다는 경고가 발생합니다.

**작업**

- [ ] `next.config.ts`의 `turbopack.root`를 프로젝트 기준으로 명시하거나 상위 lockfile 필요성을 확인한다.
- [ ] 실험 옵션 `proxyClientMaxBodySize` 사용 이유와 제거 조건을 기록한다.
- [ ] 새 Next.js 기능을 적용할 때는 설치된 `node_modules/next/dist/docs/` 문서를 기준으로 검토한다.

**완료 조건**

- 로컬과 CI의 build root 및 tracing 범위가 동일하다.
- 프로덕션 빌드에 원인 미확인 경고가 없다.

### CLEAN-001. 레거시·임시 파일 분류

검토 대상:

- `lib/airtable.ts`, `/api/debug/airtable`
- `scratch/`
- `scripts/archive/`
- `data/artists.json.bak`
- 루트의 분석/마이그레이션 산출물
- 현재 코드와 맞지 않거나 문자 인코딩이 깨진 기존 문서

**작업**

- [ ] 실행 중인 코드에서 import/호출 여부를 확인한다.
- [ ] 유지할 운영 script에는 목적, 입력, dry-run, 재실행 안전성을 적는다.
- [ ] 일회성 산출물은 `archive/`로 이동하거나 안전하게 삭제한다.
- [ ] 사용자 데이터가 포함된 파일이 Git history에 들어갔는지 확인한다.

**완료 조건**

- 저장소 루트에는 현재 개발·운영에 필요한 파일만 남는다.
- 어떤 script도 설명 없이 운영 DB를 변경하지 않는다.

---

## P3 · 사용자 경험과 제품 완성도

### UX-001. 접근성 기본선 확보

- [ ] 키보드만으로 메뉴, modal, drawer, CMS form을 사용할 수 있게 한다.
- [ ] modal focus trap, 닫힌 뒤 focus 복귀, ESC 동작을 구현한다.
- [ ] form label/error 연결과 `aria-live`를 적용한다.
- [ ] 이미지 alt, heading 순서, 색 대비, focus ring을 점검한다.
- [ ] Playwright + axe 기반 접근성 smoke test를 추가한다.

### PERF-001. 이미지·클라이언트 번들·목록 성능 개선

- [ ] 큰 `<img>`/background image를 점검하고 가능한 곳에 `next/image`를 적용한다.
- [ ] 원격 이미지 host 정책과 fallback을 중앙화한다.
- [ ] 대형 client component와 framer-motion 사용 구간의 번들 크기를 측정한다.
- [ ] 검색 입력 debounce, 긴 목록 pagination/virtualization을 적용한다.
- [ ] Core Web Vitals를 실제 사용자 기준으로 수집한다.

### SEO-001. 공개 프로필 검색 노출 정리

- [ ] 아티스트·단체 상세에 고유 metadata와 canonical URL을 제공한다.
- [ ] `sitemap.ts`, `robots.ts` 및 동적 공개 URL 포함 정책을 추가한다.
- [ ] draft/preview/admin/account 페이지는 index 제외한다.
- [ ] OG 이미지와 구조화 데이터(JSON-LD)를 검토한다.

### PRODUCT-001. 미완성·임시 기능의 제품 결정 기록

- [ ] `/premium`의 실제 결제 범위와 출시 여부를 결정한다.
- [ ] Instagram feed 실패 시 fallback과 token 갱신 운영자를 정한다.
- [ ] AI 생성 결과의 검수, 재실행, 비용 한도, 원문 보존 정책을 정한다.
- [ ] 캘린더·추천·주간 소식 등 진행 중인 홈 기능의 데이터 source와 acceptance criteria를 적는다.
- [ ] 기능별 상태를 “실험/베타/운영”으로 표시하고 제거 조건을 둔다.

---

## 권장 실행 순서

### 1주차 · 권한 경계 봉합

1. `SEC-001` 관리자 API 전수 조사 및 `unlink-owner` 차단
2. `SEC-003` 업로드 allowlist·용량·인증 적용
3. passcode 기본값 제거
4. debug/외부 입력 API 임시 제한

### 2주차 · 회귀 방지 장치

1. CI와 typecheck/lint
2. 인증·관리자·업로드 E2E
3. 공통 auth/validation/error helper
4. 환경변수 런타임 검증

### 3~4주차 · 데이터와 운영 안정화

1. Supabase 생성 타입 적용
2. migration 재현성 및 RLS 점검
3. 로그·오류 추적·rate limit
4. 개인정보 삭제/백업 복원 검증

### 이후 · 구조와 UX

대형 파일은 테스트가 보호하는 범위부터 작은 단위로 분리하고, 접근성·성능·SEO를 공개 페이지 우선으로 개선합니다.

---

## 신규 개발자 첫날 체크리스트

- [ ] `README.md`, 이 문서, `supabase/migrations/README.md`를 읽는다.
- [ ] `.env.example`을 기준으로 로컬 환경변수를 준비한다.
- [ ] `npm ci` 후 `npm run build`를 실행한다.
- [ ] Supabase 프로젝트/로컬 DB와 Storage bucket 구성을 확인한다.
- [ ] 일반 사용자, 아티스트 소유자, 단체 소유자, 관리자 권한 차이를 이해한다.
- [ ] 변경하려는 API가 service-role client를 쓰는지 먼저 확인한다.
- [ ] Next.js 작업 전 설치된 버전의 `node_modules/next/dist/docs/` 관련 가이드를 읽는다.
- [ ] 현재 수정 중인 파일과 migration 충돌 여부를 `git status`로 확인한다.

## 공통 Definition of Done

모든 작업은 아래 조건을 만족해야 완료로 봅니다.

- [ ] 서버에서 인증·인가와 입력 검증을 수행한다.
- [ ] 성공, validation 실패, 권한 실패, 외부 서비스 실패 테스트가 있다.
- [ ] loading/error/empty 상태와 모바일 화면을 확인한다.
- [ ] 개인정보·비밀값이 로그나 클라이언트 bundle에 노출되지 않는다.
- [ ] DB 변경에는 순서가 명확한 migration과 rollback/복구 메모가 있다.
- [ ] `typecheck`, `lint`, `test`, `build`가 모두 통과한다.
- [ ] 운영 방식 또는 환경변수가 바뀌면 README와 `.env.example`도 함께 갱신한다.

## 이번 점검에서 확인한 사항

- `npm run build`: 성공
- Next.js: 16.2.9 / React: 19.2.4
- 빌드 경고: 상위 디렉터리 lockfile로 인한 workspace root 자동 추론
- 기존 작업 중 변경 파일이 있으므로 본 문서 외의 소스 파일은 수정하지 않음

