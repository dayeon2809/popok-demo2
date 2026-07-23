import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { notifyArtistCompanyConnectionApproved } from "@/lib/email/notify";
import { clearPrimaryFlagForArtist } from "@/lib/companies";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const body = await req.json().catch(() => ({}));
    const confirmOverwrite = !!body.confirmOverwrite;

    const supabase = getSupabaseServer();

    // Fetch the claim request
    const { data: claimReq, error: reqError } = await supabase
      .from("company_manager_requests" as any)
      .select("*, companies(id, name, owner_id)")
      .eq("id", requestId)
      .maybeSingle();

    if (reqError || !claimReq) {
      return NextResponse.json({ success: false, error: "신청건을 찾을 수 없습니다." }, { status: 404 });
    }

    const reqObj = claimReq as any;
    const companyId = reqObj.company_id;
    const targetUserId = reqObj.user_id;

    // Check if target company already has an owner
    const currentOwnerId = reqObj.companies?.owner_id;

    if (currentOwnerId && currentOwnerId !== targetUserId && !confirmOverwrite) {
      return NextResponse.json({
        success: false,
        needsConfirmation: true,
        companyName: reqObj.companies?.name || "해당 단체",
        currentOwnerId,
        message: "이미 대표 계정이 연결된 단체입니다. 기존 대표를 새로운 대표로 변경하시겠습니까?",
      }, { status: 409 });
    }

    // 1. Update company owner_id
    const { error: companyUpdateError } = await (supabase.from("companies" as any) as any)
      .update({ owner_id: targetUserId, updated_at: new Date().toISOString() })
      .eq("id", companyId);

    if (companyUpdateError) {
      console.error("[POST approve] Company update error:", companyUpdateError);
      return NextResponse.json({ success: false, error: "단체 대표 변경에 실패했습니다." }, { status: 500 });
    }

    // 2. Update claim request status to approved
    const { error: claimUpdateError } = await (supabase.from("company_manager_requests" as any) as any)
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (claimUpdateError) {
      console.error("[POST approve] Request status update error:", claimUpdateError);
      return NextResponse.json({ success: false, error: "신청 상태 업데이트에 실패했습니다." }, { status: 500 });
    }

    // 3. The claimed account's own artist profile (if any) becomes this
    // company's representative artist_companies relation — without this,
    // linking a manager/owner account never surfaces an artist card, since
    // the storefront only reads the artist_companies join, never owner_id.
    const { data: ownedArtist } = await supabase
      .from("artists" as any)
      .select("id")
      .eq("owner_id", targetUserId)
      .maybeSingle();

    if (ownedArtist) {
      const artistId = (ownedArtist as any).id as string;

      await clearPrimaryFlagForArtist(artistId, companyId);

      const { data: existingRelation } = await supabase
        .from("artist_companies" as any)
        .select("id")
        .eq("artist_id", artistId)
        .eq("company_id", companyId)
        .is("role", null)
        .maybeSingle();

      if (existingRelation) {
        await (supabase.from("artist_companies" as any) as any)
          .update({ is_current: true, is_primary: true, updated_at: new Date().toISOString() })
          .eq("id", (existingRelation as any).id);
      } else {
        const { error: relationInsertError } = await (supabase.from("artist_companies" as any) as any)
          .insert({
            artist_id: artistId,
            company_id: companyId,
            is_current: true,
            is_primary: true,
          });
        if (relationInsertError) {
          console.error("[POST approve] Representative relation insert error:", relationInsertError);
        }
      }
    }

    // Notification is a side effect of a successful approval, never the
    // other way around — both DB writes above have already committed by
    // this point. Awaited (not fire-and-forget) so it actually completes
    // before this serverless function returns/freezes, but its outcome
    // never affects the response below — sendPopokEmail never throws, and
    // any failure is only ever recorded in email_notification_logs.
    // sendPopokEmail's own idempotency (the log table's unique index) is
    // what actually prevents a resend if this route is called again for an
    // already-approved request.
    await notifyArtistCompanyConnectionApproved({
      requestId,
      recipientUserId: targetUserId,
      artistName: reqObj.applicant_name || "회원",
      companyName: reqObj.companies?.name || "단체",
    }).catch((err) => console.error("[POST approve] Notification error:", err));

    return NextResponse.json({
      success: true,
      message: "대표 권한이 성공적으로 승인되었습니다.",
    });
  } catch (err: any) {
    console.error("[POST approve] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
