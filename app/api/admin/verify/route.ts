import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const passcode = (body?.passcode ?? "").trim();
    const adminPasscode = (process.env.ADMIN_PASSCODE || "1234").trim();

    if (passcode === adminPasscode) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: "패스코드가 올바르지 않습니다." }, { status: 401 });
    }
  } catch (err) {
    console.error("[POST /api/admin/verify]", err);
    return NextResponse.json({ success: false, error: "올바르지 않은 요청입니다." }, { status: 400 });
  }
}
