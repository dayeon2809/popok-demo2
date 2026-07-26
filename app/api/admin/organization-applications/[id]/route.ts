import { requireAdminApi } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("organization_applications" as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`[GET /api/admin/organization-applications/${id}]`, error);
      return NextResponse.json({ success: false, error: "신청서를 가져오는 데 실패했습니다." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, error: "신청서를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error(`[GET /api/admin/organization-applications/${id}]`, err);
    return NextResponse.json({ success: false, error: "신청서를 가져오는 데 실패했습니다." }, { status: 500 });
  }
}

// Narrow escape hatch for "rejected -> pending으로 되돌리기" only — approving
// goes through /approve (it has to create the company), and this never
// accepts "approved" to avoid bypassing that logic.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;

  try {
    const body = await req.json();
    if (body?.status !== "pending") {
      return NextResponse.json({ success: false, error: "이 엔드포인트는 대기 중 상태로 되돌리는 용도로만 사용할 수 있습니다." }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { error } = await (supabase.from("organization_applications" as any) as any)
      .update({ status: "pending" })
      .eq("id", id);

    if (error) {
      console.error(`[PATCH /api/admin/organization-applications/${id}]`, error);
      return NextResponse.json({ success: false, error: "상태 변경에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[PATCH /api/admin/organization-applications/${id}]`, err);
    return NextResponse.json({ success: false, error: "상태 변경 중 오류가 발생했습니다." }, { status: 500 });
  }
}
