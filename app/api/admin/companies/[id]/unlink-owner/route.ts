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

    // 1. Clear owner_id on companies
    const { error: compError } = await (supabase.from("companies" as any) as any)
      .update({ owner_id: null, updated_at: new Date().toISOString() })
      .eq("id", companyId);

    if (compError) {
      console.error("[POST unlink-owner] DB error:", compError);
      return NextResponse.json({ success: false, error: "대표 권한 해제에 실패했습니다." }, { status: 500 });
    }

    // 2. Clear is_primary on artist_companies for this company
    const { error: relError } = await (supabase.from("artist_companies" as any) as any)
      .update({ is_primary: false })
      .eq("company_id", companyId);

    if (relError) {
      console.error("[POST unlink-owner] artist_companies clear error:", relError);
    }

    return NextResponse.json({
      success: true,
      message: "단체 대표 및 관리 권한이 성공적으로 해제되었습니다.",
    });
  } catch (err: any) {
    console.error("[POST unlink-owner] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
