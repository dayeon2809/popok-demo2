import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();

    const supabase = getSupabaseServer();

    let dbQuery = supabase
      .from("artists" as any)
      .select("id, name, name_en, slug, genre, role, profile_image_url, status")
      .eq("status", "published")
      .order("name", { ascending: true })
      .limit(20);

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,name_en.ilike.%${query}%,role.ilike.%${query}%,genre.ilike.%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error("[GET /api/artists/search] Error:", error);
      return NextResponse.json({ success: false, error: "아티스트 검색에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      artists: data || [],
    });
  } catch (err: any) {
    console.error("[GET /api/artists/search] Error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
