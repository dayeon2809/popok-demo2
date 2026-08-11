import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, setAdminSessionCookie } from "@/lib/admin";

// Intentionally the one /api/admin/** route that does NOT call
// requireAdminApi() — this *is* the entry point that issues the session
// requireAdminApi checks everywhere else. Public reachability is expected;
// the password compare below is the actual gate.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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
