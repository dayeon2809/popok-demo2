import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkRateLimit, clientRateLimitKey, rateLimitedResponse } from "../lib/simpleRateLimit.ts";

// 요청서 「높음」: "공개·관리 API의 서버 측 요청 제한 부족 — upload, apply, submit,
// admin verify 등". 아래 목록이 그 넷에 소유권 신청을 더한 것이다.
//
// 상한이 없으면 관리자 비밀번호는 무한히 대입할 수 있고, 로그인 없이 행을 만드는
// 공개 폼들은 그대로 스팸·저장소 통로가 된다.

const GUARDED_ROUTES = [
  ["app/api/admin/login/route.ts", "관리자 비밀번호 대입"],
  ["app/api/upload/route.ts", "파일 업로드"],
  ["app/api/popok-submit/route.ts", "공개 등록 폼"],
  ["app/api/organizations/apply/route.ts", "단체 신청 폼"],
  ["app/api/companies/claim-request/route.ts", "단체 소유권 신청"],
];

test("남용 가능한 라우트가 전부 요청 제한을 부른다", () => {
  for (const [path, why] of GUARDED_ROUTES) {
    const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
    assert.match(source, /checkRateLimit\(/, `${path} (${why}) 에 요청 제한이 없다`);
    assert.match(source, /429|rateLimitedResponse/, `${path} 가 429 를 돌려주지 않는다`);
  }
});

test("남은 TODO 가 실제로 채워졌다", () => {
  // 이 자리에는 "요청 제한 인프라가 아직 없다"는 TODO 가 있었다.
  const source = readFileSync(new URL("../app/api/organizations/apply/route.ts", import.meta.url), "utf8");
  assert.equal(/TODO: rate limit/.test(source), false);
});

test("상한을 넘으면 막고 Retry-After 를 준다", () => {
  const key = `test-${process.pid}-${GUARDED_ROUTES.length}`;
  const opts = { windowMs: 60_000, max: 3 };
  assert.equal(checkRateLimit(key, opts).allowed, true);
  assert.equal(checkRateLimit(key, opts).allowed, true);
  assert.equal(checkRateLimit(key, opts).allowed, true);

  const blocked = checkRateLimit(key, opts);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterMs > 0);
});

test("키는 요청자별로 갈린다", () => {
  const headers = (values: Record<string, string>) => ({
    get: (name: string) => values[name.toLowerCase()] ?? null,
  });

  // Vercel 뒤에서는 실제 IP 가 x-forwarded-for 맨 앞에 온다.
  assert.equal(
    clientRateLimitKey({ headers: headers({ "x-forwarded-for": "203.0.113.9, 70.41.3.18" }) }, "up"),
    "up:203.0.113.9"
  );
  assert.equal(clientRateLimitKey({ headers: headers({ "x-real-ip": "198.51.100.4" }) }, "up"), "up:198.51.100.4");
  assert.equal(clientRateLimitKey({ headers: headers({}) }, "up"), "up:unknown");

  // 접두사가 달라야 한 화면의 상한이 다른 화면을 막지 않는다.
  const h = headers({ "x-real-ip": "203.0.113.9" });
  assert.notEqual(clientRateLimitKey({ headers: h }, "upload"), clientRateLimitKey({ headers: h }, "admin-login"));
});

test("429 응답 모양", async () => {
  const res = rateLimitedResponse(45_000);
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("Retry-After"), "45");
  const body = await res.json();
  assert.equal(body.code, "RATE_LIMITED");
});
