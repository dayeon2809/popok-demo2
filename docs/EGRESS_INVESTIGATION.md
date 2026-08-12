# Supabase 전송량 초과 — 조사와 조치 기록

**작업 로그다.** 무엇을 쟀고, 무엇을 고쳤고, 무엇이 남았는지를 순서대로 남긴다.
새 사실이 나오면 맨 아래 "작업 로그"에 한 줄 추가한다.

노션 요약본: [Supabase 전송량 초과 — 원인과 조치](https://app.notion.com/p/3bab445aba4981a182e7f2661c1e94c5)
(비개발자용. 상세와 명령어는 이 문서가 정본이다.)

---

## 0. 이 저장소를 볼 때 먼저 알아야 할 것

**`main`은 라이브가 아니다.**

| | |
|---|---|
| 라이브 브랜치 | **`feature/home-feed-v2`** |
| `main` | 2026-07-25에 멈춰 있음. `/api/image`도 i18n도 없다 |
| 라이브 Supabase ref | `sawsqtqjqmesfasbcmyf` |
| 조직 ID | `azrbtqmoszmhfrqzackm` |
| 호스팅 | Vercel |

`data/artists.json`에 박혀 있는 ref `qbqozpjasykiuzuajzqh`는 **낡은 값**이다. 대시보드에서 그 프로젝트를 열면 엉뚱한 데이터를 보게 된다.

라이브 브랜치를 판별한 근거 — 라이브 HTML에는 `popok-locale` 쿠키, `hrefLang`, `/api/image` 호출이 있고, 이 셋을 모두 가진 브랜치는 `feature/home-feed-v2`뿐이다.

---

## 1. 무슨 일이 있었나

2026-08-11, Supabase에서 Fair Use 경고 메일이 왔다.

```
Cached egress (Bandwidth): 16.41 GB of 5.5 GB
2026-08-14 이후 서비스 제한, 402 반환
```

한도의 3배다. 유예는 사실상 1회성이라, 다음 초과 때는 유예 없이 즉시 제한된다.

**이미 쓴 16.41 GB는 어떤 방법으로도 줄지 않는다.** 공식 문서상 제한은 *다음 청구 주기 시작* 또는 *요금제 업그레이드* 시점에만 풀린다. 코드 수정은 다음 주기부터 효과가 난다.

---

## 2. 실측값 (2026-08-12)

`popok.kr` 홈이 참조하는 Supabase 이미지를 전수 측정했다.

| 항목 | 값 |
|---|---|
| 이미지 수 | 185장 |
| 합계 | 150.77 MB |
| 평균 | 835 KB |
| 최대 | 5.54 MB |
| 2MB 초과 | 30장 (합계 91.3 MB) |
| `Cache-Control` | **185장 전부 `no-cache`** |
| CDN 캐시 | 185장 중 184장 MISS |
| `robots.txt` | 없음 (404) |
| 리사이즈 프록시 | 5.54 MB → **11.9 KB** (실측) |

역산하면 한 달에 사진 약 2만 장 배달 = 화면 조회 약 1,000회. 장당 30 KB로 줄이면 같은 트래픽에서 **0.6 GB**가 된다.

### 재현 명령어

```bash
# 홈이 참조하는 Supabase 이미지 URL 수집
curl -s -L https://popok.kr/ \
  | grep -oE 'https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/[^"\\ ]+' \
  | sort -u > home.txt
wc -l < home.txt

# 용량과 캐시 헤더 일괄 측정 (HEAD 요청이라 egress를 쓰지 않는다)
cat home.txt | xargs -P 12 -I{} curl -sI "{}" \
  | grep -iE '^(content-length|cache-control|cf-cache-status):' | tr -d '\r' > headers.txt

grep -i '^cache-control' headers.txt | sort | uniq -c
grep -i '^content-length' headers.txt | awk -F': ' \
  '{s+=$2; n++} END {printf "%d장 합계 %.2f MB 평균 %.0f KB\n", n, s/1048576, s/n/1024}'
```

---

## 3. 원인

**전송량은 "이용자에게 배달된 바이트"다.** 방문 횟수는 줄일 수 없으니, 줄일 수 있는 것은 **한 번에 나가는 크기**뿐이다.

캐시는 이 숫자를 줄이지 못한다 — Supabase의 `cached egress`는 CDN이 *캐시 적중으로 내보낸* 바이트까지 포함해 과금한다. 캐시가 바꾸는 것은 단가(GB당 0.09 → 0.03달러)와 별도 할당량 칸이지 총량이 아니다.

**단, Supabase 바깥의 CDN은 다르다.** Vercel이 대신 배달하면 Supabase 계량기는 한 번만 돈다. `/api/image`가 정확히 그 구조다.

### 원인 순위

1. **공개 화면이 원본을 그대로 내보냈다** ← 사실상 전부
2. **`/api/image` 프록시가 일부 화면에만 연결돼 있었다** — 1번의 직접 원인
3. **2MB 초과 30장은 프록시조차 캐시하지 못한다** — Next.js 데이터 캐시의 항목당 2MB 한도
4. `no-cache` 메타데이터 — 단가와 재방문에만 영향. 총량은 안 줄어든다
5. `robots.txt` 부재 — 조사 결과 주원인은 아니었다

크롤러 가설은 **배제**했다. 네 브랜치를 전수 조사한 결과 Storage 업로드 경로는 `app/api/upload/route.ts`와 `app/api/admin/companies/[id]/source-file/route.ts` 둘뿐이고, `feature/opportunity-platform`의 크롤러도 Storage에 쓰지 않는다.

---

## 4. 조치 — 완료

### `fix/image-egress` (커밋 `d7c31c8`)

| | |
|---|---|
| 베이스 | `feature/home-feed-v2` |
| 파일 | 26개 공개 컴포넌트·페이지 |
| 프록시 연결 | 36곳 (`getListImageUrl`, 표시 크기별 32~600px) |
| 지연 로딩 | 23곳 `loading="lazy"` |
| 신규 | `app/robots.ts`, `tests/imageEgress.test.ts` |

검증 — 테스트 56개 통과, 타입 오류 0건, 프로덕션 빌드 성공.
(빌드는 `.env.local`이 없으면 `/copyright` 프리렌더에서 실패한다. 더미 환경변수를 넣으면 통과한다.)

**의도적으로 원본을 유지한 곳**

- `RepresentativeGallery`의 라이트박스 — 프록시가 600px로 자르므로 확대 보기는 화질 우선. 클릭해야 뜨므로 빈도도 낮다
- 로그인 후 화면(메시지, 포트폴리오 요청, 단체 CMS) — 실제 Supabase 이미지지만 한 번에 한 사용자만 본다
- 인스타그램·유튜브·QR·로컬 이미지 — 프록시가 거부하는 대상이다

### 회귀 방지

```bash
npm run test:image-egress
```

`app/`·`components/`를 스캔해 원본 URL을 쓰는 `<img>`를 찾고, 이유가 적힌 허용 목록 밖이면 실패한다. 허용 목록이 실제보다 헐거워져도 실패한다(고쳤는데 목록에 남아 있는 경우).

**일부러 되돌려서 실패하는 것을 확인했다.** `ArtistCompactCard`의 수정을 되돌리자 그 파일명을 짚어 실패했고, 복구 후 통과했다.

`robots.txt`는 대량 스크래퍼만 막고 검색엔진은 남긴다. 사이트가 모든 공개 페이지에 canonical·hreflang·OpenGraph를 내보내므로 검색 노출은 포기하지 않는다. 전면 차단으로 되돌아가는 것도 테스트가 막는다.

---

## 5. 남은 일

### 해결됨 — `no-cache`의 원인은 Supabase 쪽이다 (2026-08-12 확정)

**우리 코드 문제가 아니다. `cacheControl`은 정확히 지정돼 있고, Supabase Storage가 그것을 무시한다.**

확인 방법 — `/api/upload`를 타는 경로(프로필 관리)로 이미지를 하나 올리고 원본 URL의 헤더를 쟀다.

```
Last-Modified: Wed, 12 Aug 2026 04:46:16 GMT   ← 방금 올린 것
Cache-Control: no-cache                        ← 코드는 31536000 을 지정하고 있다
Content-Length: 34462
```

배포 누락도 아니다. `/api/image`와 `cacheControl`은 **같은 커밋 `0ae07cd`에 들어 있고**, `/api/image`는 라이브에서 정상 동작한다(5.54 MB → 11.9 KB 실측). 즉 그 커밋은 배포돼 있다.

**알려진 플랫폼 이슈다.**

| 출처 | 내용 |
|---|---|
| [supabase/storage#18](https://github.com/supabase/storage/issues/18) | 업로드 시 보낸 cache-control이 무시되고 `no-cache`로 응답. 닫혔으나 증상은 지속 |
| [supabase#21119](https://github.com/orgs/supabase/discussions/21119) | 기존 객체의 cacheControl을 바꾸는 방법 문의 — **미답변**. 버킷 단위 설정도 없다 |
| [supabase-swift#550](https://github.com/supabase/supabase-swift/issues/550) | 다른 클라이언트에서도 동일 증상 |

**결론 — 작업 5(cacheControl 일괄 갱신)는 우리가 할 수 있는 게 없다.**
재업로드해도 같은 API를 타므로 같은 결과가 나온다. 버킷 단위로 강제하는 설정도 없다.

**그리고 이미 해결돼 있다.** 위 이슈들에서 공통으로 제시되는 우회로가 "직접 만든 프록시로 서빙하며 헤더를 직접 붙인다"인데, `/api/image`가 정확히 그것이고 커밋 `d7c31c8`로 공개 화면 전체에 연결했다.

```
Supabase 원본     Cache-Control: no-cache                              (고칠 수 없음)
/api/image 출력   Cache-Control: public, max-age=31536000, immutable   (우리가 붙인다)
```

이용자는 프록시 출력만 받으므로 `no-cache`는 프록시가 원본을 끌어오는 몇 번에만 영향을 준다. 실질적으로 무해해졌다.

남은 선택지 하나 — `upsert: true`가 원인일 가능성이 있다(그 경로에서 헤더가 누락된다는 보고가 있다). 확인하려면 코드를 바꿔 배포해야 하므로 우선순위는 낮다.

**참고 — SQL Editor로 현황 보기 (읽기 전용)**

```sql
select
  metadata->>'cacheControl' as cache_control,
  count(*) as files,
  min(created_at) as oldest,
  max(created_at) as newest
from storage.objects
group by 1
order by 2 desc;
```

경계 날짜가 배포 시각과 일치하면 가설 1 확정.

```sql
-- 경로별 교차: 특정 경로만 no-cache면 그 경로를 만드는 코드가 범인
select
  split_part(name, '/', 1) as path_prefix,
  metadata->>'cacheControl' as cache_control,
  count(*) as files
from storage.objects
where bucket_id = 'artist-media'
group by 1, 2
order by 3 desc;

-- 업로더 주체: owner가 비어 있으면 service role(서버 코드), 값이 있으면 사용자/대시보드
select owner, count(*) as files
from storage.objects
where bucket_id = 'artist-media'
group by 1 order by 2 desc;

-- 저장 용량 (무료 한도 1GB. 홈 185장만으로 원본 150MB다)
select bucket_id,
       count(*) as files,
       pg_size_pretty(sum((metadata->>'size')::bigint)) as total
from storage.objects
group by bucket_id
order by sum((metadata->>'size')::bigint) desc;
```

**확인 방법 C** — Vercel 대시보드에서 `0ae07cd`가 프로덕션에 반영된 시각 확인. 가설 1의 직접 검증이다.

### 작업 3 — 2MB 초과 원본 30장 교체 (미착수)

**작업 5는 취소됐다** (위 참조 — Supabase가 `cacheControl`을 무시하므로 우리가 할 수 있는 게 없다). 작업 3만 남았고, 목적도 캐시가 아니라 **크기**다.

여전히 할 가치가 있는 이유 두 가지 —

- 2MB를 넘으면 **Next.js 데이터 캐시에 저장되지 않아**, 프록시가 실행될 때마다 Supabase에서 원본을 다시 받는다. 이 30장이 원본 총량 150.77 MB 중 91.3 MB다
- **파일 저장 1GB 한도**도 같이 완화된다

```
1. 백업       전체 버킷을 로컬로 다운로드. 되돌릴 수 없다
2. 목록       2MB 초과 30장 선별 (아래 SQL)
3. 변환       sharp: 최대 1600px, 품질 82
4. 재업로드   같은 경로에 upsert
5. 검증       curl -sI 로 크기 재측정 (캐시 헤더는 여전히 no-cache일 것이다 — 정상이다)
```

- 같은 경로에 덮어쓰므로 **URL이 바뀌지 않는다.** DB의 `image_url`을 손댈 필요가 없어 위험이 크게 준다
- **확장자를 바꾸면 URL이 바뀐다.** `.jpg`는 `.jpg`로 재인코딩한다
- 30장 먼저 하고 결과를 본 뒤 나머지로 확대한다
- 필요한 것은 `SUPABASE_SERVICE_ROLE_KEY` 하나

---

## 6. 참고 — Supabase 무료 한도

| 항목 | 무료 | Pro (월 25달러) |
|---|---|---|
| 전송량 (캐시) | 5 GB | 250 GB |
| 전송량 (비캐시) | 5 GB | 250 GB |
| 파일 저장 | 1 GB | 100 GB |
| DB | 500 MB | 8 GB |
| 월 활성 사용자 | 5만 | 10만 |

전송량 한도는 방문자 수가 아니라 **이미지 크기**가 정한다. 장당 835 KB면 월 330회 조회에서 차고, 30 KB면 9,300회까지 간다.

---

## 작업 로그

| 날짜 | 내용 |
|---|---|
| 2026-08-11 | Supabase Fair Use 경고 수신 (16.41 GB / 5.5 GB, 마감 8/14) |
| 2026-08-12 | 라이브 브랜치가 `main`이 아니라 `feature/home-feed-v2`임을 확인 |
| 2026-08-12 | 홈 이미지 185장 전수 측정. 평균 835 KB, 전부 `no-cache` 확인 |
| 2026-08-12 | 크롤러 가설 배제 (전 브랜치 업로드 경로 조사) |
| 2026-08-12 | `fix/image-egress` 커밋 `d7c31c8` — 프록시 36곳 연결, lazy 23곳, robots.txt, 회귀 테스트 |
| 2026-08-12 | 테스트 업로드로 `no-cache` 원인 확정 — **Supabase Storage가 `cacheControl`을 무시한다.** 우리 코드는 정상. 작업 5 취소 |
| | ↓ 다음: 작업 3(2MB 초과 30장 축소), 브랜치 배포 여부 결정 |
