import { requireAdminApi } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

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
