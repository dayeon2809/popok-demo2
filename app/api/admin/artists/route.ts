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
    const { data: artists, error } = await (supabase.from("artists") as any)
      .select("id, name, name_en, company, genre, slug, claim_code, verified, profile_image")
      .order("id", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/artists] Supabase error:", error);
      return NextResponse.json({ success: false, error: `데이터 조회 실패: ${error.message}` }, { status: 500 });
    }

    // Map DB columns to match React Artist state expectations
    const mapped = artists.map((a: any) => {
      let field = "unknown";
      if (a.genre) {
        if (a.genre.includes("contemporary")) field = "contemporary_dance";
        else if (a.genre.includes("ballet")) field = "ballet";
        else if (a.genre.includes("korean")) field = "korean_dance";
        else if (a.genre.includes("interdisciplinary")) field = "interdisciplinary";
      }
      return {
        id: String(a.id),
        recordId: String(a.id),
        name: a.name,
        name_en: a.name_en,
        company: a.company,
        profileImage: a.profile_image || "",
        field: field,
        claim_code: a.claim_code || "",
        verified: a.verified,
        slug: a.slug
      };
    });

    return NextResponse.json({ success: true, data: mapped });
  } catch (err: any) {
    console.error("[GET /api/admin/artists] Server error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
