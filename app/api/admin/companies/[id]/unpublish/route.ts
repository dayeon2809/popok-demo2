import { requireAdminApi } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;

  try {
    const supabase = getSupabaseServer();
    const { error } = await (supabase.from("companies" as any) as any)
      .update({ status: "draft" })
      .eq("id", id);

    if (error) {
      console.error(`[POST /api/admin/companies/${id}/unpublish]`, error);
      return NextResponse.json({ success: false, error: "비공개 전환에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[POST /api/admin/companies/${id}/unpublish]`, err);
    return NextResponse.json({ success: false, error: "비공개 전환 중 오류가 발생했습니다." }, { status: 500 });
  }
}
