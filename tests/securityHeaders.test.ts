import test from "node:test";
import assert from "node:assert/strict";
import nextConfig from "../next.config.ts";

// 요청서 2.5 「1주」: "공개 쓰기 API rate limit·봇 방지·보안 헤더 … CSP 등 헤더".
// 이 테스트는 설정 파일을 읽는 게 아니라 실제로 headers() 를 호출해 결과를 본다.

async function headerMap(path: string): Promise<Map<string, string>> {
  assert.ok(typeof nextConfig.headers === "function", "next.config 에 headers() 가 없다");
  const rules = await nextConfig.headers();
  const map = new Map<string, string>();
  for (const rule of rules) {
    // source 가 /:path* 이면 모든 경로에 붙는다. 더 좁은 규칙이 생기면 여기서 걸린다.
    if (rule.source === "/:path*" || rule.source === path) {
      for (const h of rule.headers) map.set(h.key.toLowerCase(), h.value);
    }
  }
  return map;
}

test("모든 경로에 기본 보안 헤더가 붙는다", async () => {
  const headers = await headerMap("/artists");
  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(headers.get("x-frame-options"), "DENY");
  assert.equal(headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(headers.get("permissions-policy") ?? "", /camera=\(\)/);
});

test("공개 프로필 경로도 빠지지 않는다", async () => {
  // /p/[id] 는 신청 카드 주소다. Referrer-Policy 가 여기 안 붙으면 외부 링크를
  // 눌렀을 때 그 주소가 상대 서버 로그에 남는다.
  const headers = await headerMap("/p/1");
  assert.equal(headers.get("referrer-policy"), "strict-origin-when-cross-origin");
});

test("되돌리기 어려운 것은 켜지 않았다", async () => {
  const headers = await headerMap("/");
  const hsts = headers.get("strict-transport-security");
  // HSTS 는 Vercel 이 이미 넣는다. 여기서 includeSubDomains 나 preload 를 더하면
  // HTTPS 가 아닌 하위 도메인이 접속 불능이 되고 브라우저가 기간만큼 기억한다.
  if (hsts) {
    assert.equal(/includeSubDomains|preload/i.test(hsts), false, "HSTS 확장은 주인 확인 후에 켠다");
  }
  // script-src 를 켜면 Next 의 인라인 스크립트가 막혀 화면이 죽는다.
  const csp = headers.get("content-security-policy") ?? "";
  assert.equal(/script-src/.test(csp), false, "script-src 는 nonce 배선 없이 켜지 않는다");
});
