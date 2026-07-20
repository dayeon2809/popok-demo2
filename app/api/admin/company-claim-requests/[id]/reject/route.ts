import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const supabase = getSupabaseServer();

    const { error } = await (supabase.from("company_manager_requests" as any) as any)
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (error) {
      console.error("[POST reject] Request error:", error);
      return NextResponse.json({ success: false, error: "신청 거절 처리에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "대표 권한 신청이 거절 처리되었습니다.",
    });
  } catch (err: any) {
    console.error("[POST reject] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
