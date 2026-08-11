import { requireAdminApi } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";
import { approveOrganizationApplication } from "@/lib/companies";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;

  try {
    const { companyId } = await approveOrganizationApplication(id);
    return NextResponse.json({ success: true, companyId });
  } catch (err: any) {
    console.error(`[POST /api/admin/organization-applications/${id}/approve]`, err);
    const message = err instanceof Error ? err.message : "승인 처리 중 오류가 발생했습니다.";
    const status = message.includes("찾을 수 없습니다") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
