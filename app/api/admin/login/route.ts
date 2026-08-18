import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, setAdminSessionCookie } from "@/lib/admin";
import { checkRateLimit, clientRateLimitKey, rateLimitedResponse } from "@/lib/simpleRateLimit";

// Intentionally the one /api/admin/** route that does NOT call
// requireAdminApi() — this *is* the entry point that issues the session
// requireAdminApi checks everywhere else. Public reachability is expected;
// the password compare below is the actual gate.
export const dynamic = "force-dynamic";

// 관리자 비밀번호는 사람이 외우는 단일 문자열이라 무한히 시도하게 두면 안 된다.
// 인수인계 문서 SEC-002 가 지적한 "시도 횟수 제한 없음"이 이 자리다.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(clientRateLimitKey(req, "admin-login"), {
    windowMs: LOGIN_WINDOW_MS,
    max: LOGIN_MAX_ATTEMPTS,
  });
  if (!limit.allowed) return rateLimitedResponse(limit.retryAfterMs);

  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json(
      { success: false, error: "Admin authentication is not configured." },
      { status: 500 },
    );
  }

  let password: unknown;
  try {
    const body = await req.json();
    password = body?.password;
  } catch {
    return NextResponse.json({ success: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (typeof password !== "string" || !password) {
    return NextResponse.json({ success: false, error: "비밀번호를 입력해주세요." }, { status: 400 });
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ success: false, error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  await setAdminSessionCookie();
  return NextResponse.json({ success: true });
}
