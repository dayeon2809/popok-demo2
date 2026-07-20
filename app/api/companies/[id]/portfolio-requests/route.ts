import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getSupabaseServer } from "@/lib/supabaseServer";
import { getPrimaryArtistByCompanyId } from "@/lib/companies";
import { notifyCompanyPortfolioRequestReceived } from "@/lib/email/notify";

export const dynamic = "force-dynamic";

const MESSAGE_MAX = 500;

// "포퐄 보내기" — an artist sends their portfolio to a company's current
// representative. Mirrors the auth/ownership pattern used by every other
// write route in this repo (app/api/companies/[id]/update,
// app/api/companies/claim-request): createServerSupabaseClient() only to
// identify the caller, then getSupabaseServer() (service role, bypasses RLS)
// for the actual reads/writes, with every business rule enforced here in code
// — RLS on company_portfolio_requests is defense-in-depth, not the primary gate.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabaseUserClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as any));
    const message = typeof body?.message === "string" ? body.message.trim().slice(0, MESSAGE_MAX) : "";

    const supabase = getSupabaseServer();

    // Sender's artist_id is ALWAYS resolved from the session, never taken
    // from the request body — this is the "artist_id 위조 금지" requirement.
    const { data: senderArtist, error: senderErr } = await supabase
      .from("artists" as any)
      .select("id, name")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (senderErr || !senderArtist) {
      return NextResponse.json(
        { success: false, error: "포퐄을 보내려면 먼저 개인 포트폴리오를 만들어야 합니다.", code: "NO_ARTIST_PROFILE" },
        { status: 400 }
      );
    }
    const artistId = String((senderArtist as any).id);
    const senderArtistName = (senderArtist as any).name || "아티스트";

    const { data: targetCompany, error: companyErr } = await supabase
      .from("companies" as any)
      .select("id, name, owner_id")
      .eq("id", companyId)
      .maybeSingle();

    if (companyErr || !targetCompany) {
      return NextResponse.json({ success: false, error: "단체를 찾을 수 없습니다." }, { status: 404 });
    }

    if ((targetCompany as any).owner_id && String((targetCompany as any).owner_id) === user.id) {
      return NextResponse.json({ success: false, error: "자신의 단체에는 포퐄을 보낼 수 없습니다." }, { status: 400 });
    }

    const { data: existingMembership } = await supabase
      .from("artist_companies" as any)
      .select("id")
      .eq("artist_id", artistId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (existingMembership) {
      return NextResponse.json({ success: false, error: "이미 소속된 단체에는 포퐄을 보낼 수 없습니다." }, { status: 400 });
    }

    // Explicit duplicate check (fast path/clear error message) — the partial
    // unique index (company_portfolio_requests_live_unique_idx) is the race-safe
    // backstop for concurrent double-clicks, handled via the 23505 branch below.
    const { data: existingRequest } = await supabase
      .from("company_portfolio_requests" as any)
      .select("id, status")
      .eq("artist_id", artistId)
      .eq("company_id", companyId)
      .in("status", ["pending", "viewed"])
      .maybeSingle();

    if (existingRequest) {
      return NextResponse.json({ success: true, alreadySent: true, status: (existingRequest as any).status });
    }

    // Representative may not exist yet — the request still saves against
    // company_id and simply has no recipient snapshot until one is resolved.
    const recipient = await getPrimaryArtistByCompanyId(companyId);

    const { data: created, error: insertErr } = await supabase
      .from("company_portfolio_requests" as any)
      .insert({
        company_id: companyId,
        artist_id: artistId,
        recipient_artist_id: recipient?.id || null,
        message: message || null,
        status: "pending",
      } as any)
      .select("id, status")
      .single();

    if (insertErr) {
      if ((insertErr as any).code === "23505") {
        // Concurrent double-click lost the race to the explicit check above —
        // an existing request already owns this slot, so no new email either.
        return NextResponse.json({ success: true, alreadySent: true, status: "pending" });
      }
      console.error("[POST /api/companies/[id]/portfolio-requests] DB Error:", insertErr);
      return NextResponse.json({ success: false, error: "포퐄 전송에 실패했습니다." }, { status: 500 });
    }

    // Only reached when a request row was genuinely just created — never on
    // the alreadySent/idempotent branches above. Awaited so it completes
    // before this function returns, but never turns a successful send into
    // an error response.
    await notifyCompanyPortfolioRequestReceived({
      requestId: String((created as any).id),
      companyId,
      companyName: (targetCompany as any).name || "단체",
      senderArtistName,
      message,
    }).catch((err) => console.error("[POST /api/companies/[id]/portfolio-requests] Notification error:", err));

    return NextResponse.json({ success: true, status: (created as any).status });
  } catch (err: any) {
    console.error("[POST /api/companies/[id]/portfolio-requests] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
