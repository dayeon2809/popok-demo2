import { NextRequest, NextResponse } from "next/server";
import { getSubmissions } from "@/lib/supabaseSubmissions";

export const dynamic = "force-dynamic";


function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  try {
    const list = await getSubmissions();
    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    console.error("[GET /api/admin/submissions]", err);
    return NextResponse.json({ success: false, error: "신청 목록을 가져오는 데 실패했습니다.", detail: String(err) }, { status: 500 });
  }
}
