import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const SENDER_ALLOWED_STATUSES = new Set(["withdrawn"]);
const RECIPIENT_ALLOWED_STATUSES = new Set(["viewed", "accepted", "declined"]);

// Status transitions for both request types. The client sends `type` to say
// which table to look in, but that's a routing hint only — every field used
// for the actual permission decision (sender/recipient identity) is re-derived
// here from the fetched row and the authenticated session, never trusted from
// the request body. A wrong `type` guess just returns 404, it can't grant
// access to the other table's row.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const supabaseUserClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as any));
    const nextStatus = typeof body?.status === "string" ? body.status : "";
    const requestType = body?.type === "artist" ? "artist" : "company";

    if (!SENDER_ALLOWED_STATUSES.has(nextStatus) && !RECIPIENT_ALLOWED_STATUSES.has(nextStatus)) {
      return NextResponse.json({ success: false, error: "허용되지 않은 상태 값입니다." }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data: myArtist } = await supabase
      .from("artists" as any)
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    const myArtistId = myArtist ? String((myArtist as any).id) : null;

    const table = requestType === "company" ? "company_portfolio_requests" : "artist_portfolio_requests";
    const senderField = requestType === "company" ? "artist_id" : "sender_artist_id";

    const { data: existing, error: fetchErr } = await supabase
      .from(table as any)
      .select(requestType === "company" ? "id, company_id, artist_id, status" : "id, sender_artist_id, recipient_artist_id, status")
      .eq("id", requestId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ success: false, error: "요청을 찾을 수 없습니다." }, { status: 404 });
    }

    if (SENDER_ALLOWED_STATUSES.has(nextStatus)) {
      const isSender = myArtistId && myArtistId === String((existing as any)[senderField]);
      if (!isSender) {
        return NextResponse.json({ success: false, error: "요청을 취소할 권한이 없습니다." }, { status: 403 });
      }
    } else if (requestType === "company") {
      let isCurrentRep = false;
      if (myArtistId) {
        const { data: repRelation } = await supabase
          .from("artist_companies" as any)
          .select("id")
          .eq("artist_id", myArtistId)
          .eq("company_id", (existing as any).company_id)
          .eq("is_current", true)
          .eq("is_primary", true)
          .maybeSingle();
        isCurrentRep = !!repRelation;
      }
      if (!isCurrentRep) {
        return NextResponse.json({ success: false, error: "이 요청을 처리할 권한이 없습니다." }, { status: 403 });
      }
    } else {
      const isRecipient = myArtistId && myArtistId === String((existing as any).recipient_artist_id);
      if (!isRecipient) {
        return NextResponse.json({ success: false, error: "이 요청을 처리할 권한이 없습니다." }, { status: 403 });
      }
    }

    const { data: updated, error: updateErr } = await (supabase.from(table as any) as any)
      .update({ status: nextStatus })
      .eq("id", requestId)
      .select("id, status")
      .single();

    if (updateErr) {
      console.error("[PATCH /api/portfolio-requests/[id]] DB Error:", updateErr);
      return NextResponse.json({ success: false, error: "상태 변경에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: (updated as any).status });
  } catch (err: any) {
    console.error("[PATCH /api/portfolio-requests/[id]] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
