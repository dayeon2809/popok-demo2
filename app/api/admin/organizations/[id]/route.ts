import { NextRequest, NextResponse } from "next/server";
import { approveOrganizationApplication, rejectOrganizationApplication } from "@/lib/companies";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

// Compatibility shim for the old generic "PATCH { status }" contract this
// route used to have (back when status was pending|contacted|completed|rejected).
// New code should call the dedicated /approve and /reject endpoints under
// /api/admin/organization-applications/[id] instead — this just translates
// old-style calls onto the same underlying logic so nothing calling this
// path breaks.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const status = body?.status;

    if (status === "rejected") {
      await rejectOrganizationApplication(id);
      return NextResponse.json({ success: true });
    }

    if (status === "approved" || status === "contacted" || status === "completed") {
      const { companyId } = await approveOrganizationApplication(id);
      return NextResponse.json({ success: true, companyId });
    }

    return NextResponse.json({ success: false, error: "올바르지 않은 상태 값입니다." }, { status: 400 });
  } catch (err: any) {
    console.error(`[PATCH /api/admin/organizations/${id}] (compat shim)`, err);
    const message = err instanceof Error ? err.message : "상태 변경 중 오류가 발생했습니다.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
