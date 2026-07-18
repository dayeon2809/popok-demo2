import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { PERFORMANCE_POSTER_BUCKET, extractPerformancePosterPath } from "@/lib/performances";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

// POST (not DELETE) so a plain JSON array body is unambiguous across
// runtimes/proxies — mirrors the list's "선택 삭제" bulk action only.
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((v: any) => typeof v === "string" && v) : [];

    if (ids.length === 0) {
      return NextResponse.json({ success: false, error: "삭제할 공연을 선택해 주세요." }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data: rows, error: fetchError } = await supabase
      .from("performances" as any)
      .select("id, poster_url")
      .in("id", ids);

    if (fetchError) {
      console.error("[POST /api/admin/performances/bulk-delete] Fetch error:", fetchError);
      return NextResponse.json({ success: false, error: "공연 정보를 확인하지 못했습니다." }, { status: 500 });
    }

    const posterPaths = (rows || [])
      .map((r: any) => extractPerformancePosterPath(r.poster_url))
      .filter((p: string | null): p is string => !!p);

    const { error: deleteError } = await supabase
      .from("performances" as any)
      .delete()
      .in("id", ids);

    if (deleteError) {
      console.error("[POST /api/admin/performances/bulk-delete] Delete error:", deleteError);
      return NextResponse.json({ success: false, error: `삭제 실패: ${deleteError.message}` }, { status: 500 });
    }

    if (posterPaths.length > 0) {
      const { error: removeError } = await supabase.storage.from(PERFORMANCE_POSTER_BUCKET).remove(posterPaths);
      if (removeError) {
        console.error("[POST /api/admin/performances/bulk-delete] Poster cleanup error:", removeError);
      }
    }

    return NextResponse.json({ success: true, deletedCount: (rows || []).length });
  } catch (err: any) {
    console.error("[POST /api/admin/performances/bulk-delete] Server error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
