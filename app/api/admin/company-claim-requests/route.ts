import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseServer();

    const { data: requests, error } = await supabase
      .from("company_manager_requests" as any)
      .select("*, companies(id, name, name_en, profile_image_url, owner_id, status)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/company-claim-requests] DB error:", error);
      return NextResponse.json({ success: false, error: "신청 목록을 불러오지 못했습니다." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      requests: requests || [],
    });
  } catch (err: any) {
    console.error("[GET /api/admin/company-claim-requests] Error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
