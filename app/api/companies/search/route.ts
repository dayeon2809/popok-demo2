import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();

    const supabase = getSupabaseServer();

    let dbQuery = supabase
      .from("companies" as any)
      .select("id, name, name_en, slug, genre, profile_image_url, owner_id, status")
      .neq("status", "archived")
      .order("name", { ascending: true })
      .limit(20);

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,name_en.ilike.%${query}%,genre.ilike.%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error("[GET /api/companies/search] Error:", error);
      return NextResponse.json({ success: false, error: "검색에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      companies: data || [],
    });
  } catch (err: any) {
    console.error("[GET /api/companies/search] Error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
