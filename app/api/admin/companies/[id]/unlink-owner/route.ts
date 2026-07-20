import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabase = getSupabaseServer();

    const { error } = await (supabase.from("companies" as any) as any)
      .update({ owner_id: null, updated_at: new Date().toISOString() })
      .eq("id", companyId);

    if (error) {
      console.error("[POST unlink-owner] DB error:", error);
      return NextResponse.json({ success: false, error: "대표 계정 해제에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "단체 대표 계정이 해제되었습니다. (owner_id = null)",
    });
  } catch (err: any) {
    console.error("[POST unlink-owner] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
