import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

// /api/admin/** 는 전부 같은 문지기(requireAdminApi)를 지나야 한다.
//
// 구코드에는 문지기가 두 종류였다 — lib/admin.ts 의 세션 쿠키 방식과,
// lib/adminAuth.ts 의 `x-admin-passcode` 헤더 방식(환경변수가 없으면 기본값
// "1234"). 공고 API 넷만 뒤쪽에 남아 있었고, 정작 그 화면은 저장하지도 않는
// sessionStorage 값을 보내고 있어서 정상 사용자는 못 쓰고 기본 비밀번호를 아는
// 사람만 쓸 수 있는 상태였다. adminAuth.ts 는 지웠고, 이 테스트는 그런 두 번째
// 문이 다시 생기는 것을 막는다.
//
// 인수인계 문서(docs/DEVELOPER_HANDOFF_TASKS.md) SEC-001 의 완료 조건이기도 하다:
// "새 관리자 API가 공통 가드 없이 추가되면 테스트 또는 정적 검사에서 실패한다."

const ADMIN_API_DIR = new URL("../app/api/admin/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// 가드가 없어도 되는 것들 — 이유가 없으면 목록에 넣지 않는다.
const EXEMPT: Record<string, string> = {
  "login/route.ts": "세션을 발급하는 입구. 비밀번호 비교 자체가 문이다",
  "logout/route.ts": "쿠키가 이미 만료됐어도 지워져야 한다",
};

function collectRoutes(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) collectRoutes(full, out);
    else if (name === "route.ts") out.push(full);
  }
  return out;
}

const routes = collectRoutes(ADMIN_API_DIR).map((f) => ({
  key: relative(ADMIN_API_DIR, f).split(sep).join("/"),
  source: readFileSync(f, "utf8"),
}));

test("관리자 API 라우트를 실제로 찾았다", () => {
  // 경로가 틀려 0건을 훑고 통과하는 일이 없도록.
  assert.ok(routes.length > 30, `찾은 라우트 ${routes.length}건 — 경로가 잘못됐다`);
});

const HTTP_METHODS = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)/g;

/** 파일을 핸들러 단위로 자른다. 파일 어딘가에 가드가 "있기만" 한 것으로는 부족하다. */
function handlersOf(source: string): Array<{ method: string; body: string }> {
  const starts: Array<{ method: string; index: number }> = [];
  // 정규식은 호출마다 새로 만든다 — g 플래그 객체를 공유하면 lastIndex 가 남아
  // 두 번째 파일부터 엉뚱한 위치에서 찾기 시작한다.
  const httpMethods = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)/g;
  for (const m of source.matchAll(httpMethods)) {
    starts.push({ method: m[1], index: m.index ?? 0 });
  }
  return starts.map((s, i) => ({
    method: s.method,
    body: source.slice(s.index, i + 1 < starts.length ? starts[i + 1].index : source.length),
  }));
}

test("관리자 API 의 핸들러 하나하나가 requireAdminApi 를 지난다", () => {
  // 한 파일에 GET·POST 가 함께 있는데 한쪽만 가드가 빠지는 것이 가장 흔한 실수다.
  const unguarded: string[] = [];
  for (const { key, source } of routes) {
    if (key in EXEMPT) continue;
    // 재수출 shim 은 원본 라우트의 가드를 그대로 물려받는다.
    if (/^export \{[^}]+\} from/m.test(source)) continue;
    const handlers = handlersOf(source);
    assert.ok(handlers.length > 0, `${key} 에서 핸들러를 찾지 못했다`);
    for (const h of handlers) {
      if (!h.body.includes("requireAdminApi")) unguarded.push(`${key}:${h.method}`);
    }
  }
  assert.deepEqual(unguarded, [], "문지기 없는 관리자 핸들러가 있다");
});

test("passcode 방식이 되살아나지 않았다", () => {
  for (const { key, source } of routes) {
    assert.equal(source.includes("checkAdminAuth"), false, `${key} 가 checkAdminAuth 를 쓴다`);
    assert.equal(source.includes("x-admin-passcode"), false, `${key} 가 passcode 헤더를 읽는다`);
    assert.equal(source.includes("ADMIN_PASSCODE"), false, `${key} 가 ADMIN_PASSCODE 를 읽는다`);
  }
});

test("기본 비밀번호 1234 가 코드에 없다", () => {
  for (const { key, source } of routes) {
    assert.equal(/["'`]1234["'`]/.test(source), false, `${key} 에 기본 비밀번호가 있다`);
  }
});
