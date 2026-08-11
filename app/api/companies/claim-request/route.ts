import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabaseUserClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json();
    const { companyId, applicantName, applicantEmail, applicantPhone, roleTitle, proofText } = body || {};

    if (!companyId || !applicantName || !applicantEmail) {
      return NextResponse.json(
        { success: false, error: "필수 정보(단체 선택, 신청자 이름, 이메일)가 누락되었습니다." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // Verify company exists
    const { data: company, error: companyError } = await supabase
      .from("companies" as any)
      .select("id, name, owner_id")
      .eq("id", companyId)
      .maybeSingle();

    if (companyError || !company) {
      return NextResponse.json({ success: false, error: "신청할 단체를 찾을 수 없습니다." }, { status: 404 });
    }

    // Check for existing pending claim request by this user for this company
    const { data: existingRequest } = await supabase
      .from("company_manager_requests" as any)
      .select("id, status")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: "이미 승인 대기 중인 신청 건이 존재합니다." },
        { status: 400 }
      );
    }

    // Insert claim request
    const { data: inserted, error: insertError } = await supabase
      .from("company_manager_requests" as any)
      .insert({
        company_id: companyId,
        user_id: user.id,
        applicant_name: applicantName.trim(),
        applicant_email: applicantEmail.trim(),
        applicant_phone: (applicantPhone || "").trim() || null,
        role_title: (roleTitle || "").trim() || "대표",
        proof_text: (proofText || "").trim() || null,
        status: "pending",
      } as any)
      .select("*")
      .single();

    if (insertError) {
      console.error("[POST /api/companies/claim-request] Insert error:", insertError);
      return NextResponse.json({ success: false, error: "신청 등록에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      request: inserted,
      message: "대표 권한 신청이 제출되었습니다. 관리자 승인 후 반영됩니다.",
    });
  } catch (err: any) {
    console.error("[POST /api/companies/claim-request] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
