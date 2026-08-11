import { requireAdminApi } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  try {
    const body = await req.json();
    const bucket = typeof body.bucket === "string" ? body.bucket : "artist-media";
    const path = typeof body.path === "string" ? body.path : "";

    if (!path) {
      return NextResponse.json({ success: false, error: "삭제할 파일 경로가 지정되지 않았습니다." }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error("[POST /api/admin/delete-file] Supabase storage remove error:", error);
      return NextResponse.json({ success: false, error: "파일 삭제 실패" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[POST /api/admin/delete-file] Server error:", err);
    return NextResponse.json({ success: false, error: "서버 오류" }, { status: 500 });
  }
}
