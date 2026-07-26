import { requireAdminApi } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";
import { getSubmissions } from "@/lib/supabaseSubmissions";

export const dynamic = "force-dynamic";


export async function GET(req: NextRequest) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  try {
    const list = await getSubmissions();
    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    console.error("[GET /api/admin/submissions]", err);
    return NextResponse.json({ success: false, error: "신청 목록을 가져오는 데 실패했습니다.", detail: String(err) }, { status: 500 });
  }
}
