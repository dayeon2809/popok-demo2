import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { mapCompanyRowToCompany } from "@/lib/companies";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 410 });
    }

    // Query companies owned by this user
    const { data, error } = await supabase
      .from("companies" as any)
      .select("*")
      .eq("owner_id", user.id)
      .order("name", { ascending: true });

    if (error) {
      console.error("[GET /api/companies/my] Supabase query error:", error);
      return NextResponse.json({ success: false, error: "단체 목록을 불러오지 못했습니다." }, { status: 500 });
    }

    const companies = (data || []).map(mapCompanyRowToCompany);

    return NextResponse.json({
      success: true,
      companies,
    });
  } catch (err: any) {
    console.error("[GET /api/companies/my] Error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
