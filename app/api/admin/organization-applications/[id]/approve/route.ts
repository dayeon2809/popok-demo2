import { NextRequest, NextResponse } from "next/server";
import { approveOrganizationApplication } from "@/lib/companies";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

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
