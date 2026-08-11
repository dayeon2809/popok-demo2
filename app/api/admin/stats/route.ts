import { requireAdminApi } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";
import { getSubmissions } from "@/lib/supabaseSubmissions";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  try {
    // 1. Get submissions statistics
    const submissions = await getSubmissions();
    const totalSubmissions = submissions.length;

    // 2. Get published artists count directly from Supabase
    let publishedArtists = 0;
    try {
      const supabase = getSupabaseServer();
      const { count, error } = await supabase
        .from("artists")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");

      if (error) {
        console.error("Failed to query published artists from Supabase:", error);
      } else if (count !== null) {
        publishedArtists = count;
      }
    } catch (err) {
      console.warn("Failed to read Supabase for statistics", err);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalSubmissions,
        publishedArtists
      }
    });
  } catch (err: any) {
    console.error("[GET /api/admin/stats]", err);
    return NextResponse.json(
      { success: false, error: "통계 정보를 가져오는 중 오류가 발생했습니다.", detail: String(err) },
      { status: 500 }
    );
  }
}

