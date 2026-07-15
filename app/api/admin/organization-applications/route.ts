import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

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
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("organization_applications" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/organization-applications]", error);
      return NextResponse.json({ success: false, error: "신청 목록을 가져오는 데 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("[GET /api/admin/organization-applications]", err);
    return NextResponse.json({ success: false, error: "신청 목록을 가져오는 데 실패했습니다." }, { status: 500 });
  }
}
