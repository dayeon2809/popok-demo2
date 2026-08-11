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
    // Archiving removes the company from /companies and from any connected
    // artist's CONNECTED ORGANIZATION card (both only show status='published'
    // rows) without touching the artist_companies relations themselves.
    const { error } = await (supabase.from("companies" as any) as any)
      .update({ status: "archived" })
      .eq("id", id);

    if (error) {
      console.error(`[POST /api/admin/companies/${id}/archive]`, error);
      return NextResponse.json({ success: false, error: "보관 처리에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[POST /api/admin/companies/${id}/archive]`, err);
    return NextResponse.json({ success: false, error: "보관 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
