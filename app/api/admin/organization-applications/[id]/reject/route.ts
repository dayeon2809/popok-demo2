import { requireAdminApi } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";
import { rejectOrganizationApplication } from "@/lib/companies";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;

  try {
    await rejectOrganizationApplication(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[POST /api/admin/organization-applications/${id}/reject]`, err);
    return NextResponse.json({ success: false, error: "반려 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
