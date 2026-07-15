import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const supabase = getSupabaseServer();
    const { error } = await (supabase.from("companies" as any) as any)
      .update({ status: "draft" })
      .eq("id", id);

    if (error) {
      console.error(`[POST /api/admin/companies/${id}/unpublish]`, error);
      return NextResponse.json({ success: false, error: "비공개 전환에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[POST /api/admin/companies/${id}/unpublish]`, err);
    return NextResponse.json({ success: false, error: "비공개 전환 중 오류가 발생했습니다." }, { status: 500 });
  }
}
