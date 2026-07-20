import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getSupabaseServer } from "@/lib/supabaseServer";
import { notifyArtistPortfolioRequestReceived } from "@/lib/email/notify";

export const dynamic = "force-dynamic";

const MESSAGE_MAX = 500;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Artist-to-artist "포퐄 보내기" — mirrors app/api/companies/[id]/portfolio-requests
// exactly in structure/error shape/idempotency, targeting artist_portfolio_requests
// instead of company_portfolio_requests. `[id]` accepts either a slug or a uuid,
// same as GET /api/artists/[id].
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const decodedId = decodeURIComponent(rawId).trim();

    const supabaseUserClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as any));
    const message = typeof body?.message === "string" ? body.message.trim().slice(0, MESSAGE_MAX) : "";

    const supabase = getSupabaseServer();

    // Sender's artist_id always resolved from the session, never trusted from the client.
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
    const senderArtistId = String((senderArtist as any).id);
    const senderArtistName = (senderArtist as any).name || "아티스트";

    // Recipient lookup: real DB row only — deliberately does NOT fall back to
    // the demo-artist JSON fixture that lib/artists.ts getArtistById() uses,
    // since demo artists have no owner_id/account to ever receive anything.
    const isUuid = UUID_RE.test(decodedId);
    const { data: recipientArtist, error: recipientErr } = await supabase
      .from("artists" as any)
      .select("id, name, status, owner_id")
      .or(isUuid ? `id.eq.${decodedId}` : `slug.eq.${decodedId}`)
      .maybeSingle();

    if (recipientErr || !recipientArtist) {
      return NextResponse.json({ success: false, error: "아티스트를 찾을 수 없습니다." }, { status: 404 });
    }
    if ((recipientArtist as any).status !== "published") {
      return NextResponse.json({ success: false, error: "공개되지 않은 아티스트입니다." }, { status: 400 });
    }
    const recipientArtistId = String((recipientArtist as any).id);

    if (recipientArtistId === senderArtistId) {
      return NextResponse.json({ success: false, error: "자신에게는 포퐄을 보낼 수 없습니다." }, { status: 400 });
    }

    // Explicit duplicate check (fast path/clear message) — the partial unique
    // index (artist_portfolio_requests_active_unique) is the race-safe backstop,
    // handled via the 23505 branch below.
    const { data: existingRequest } = await supabase
      .from("artist_portfolio_requests" as any)
      .select("id, status")
      .eq("sender_artist_id", senderArtistId)
      .eq("recipient_artist_id", recipientArtistId)
      .in("status", ["pending", "viewed"])
      .maybeSingle();

    if (existingRequest) {
      return NextResponse.json({ success: true, alreadySent: true, status: (existingRequest as any).status });
    }

    const { data: created, error: insertErr } = await (supabase.from("artist_portfolio_requests" as any) as any)
      .insert({
        sender_artist_id: senderArtistId,
        recipient_artist_id: recipientArtistId,
        message: message || null,
        status: "pending",
      })
      .select("id, status")
      .single();

    if (insertErr) {
      if ((insertErr as any).code === "23505") {
        return NextResponse.json({ success: true, alreadySent: true, status: "pending" });
      }
      console.error("[POST /api/artists/[id]/portfolio-requests] DB Error:", insertErr);
      return NextResponse.json({ success: false, error: "포퐄 전송에 실패했습니다." }, { status: 500 });
    }

    // Only reached when a request row was genuinely just created.
    await notifyArtistPortfolioRequestReceived({
      requestId: String((created as any).id),
      recipientArtistId,
      recipientArtistName: (recipientArtist as any).name || "아티스트",
      senderArtistName,
      message,
    }).catch((err) => console.error("[POST /api/artists/[id]/portfolio-requests] Notification error:", err));

    return NextResponse.json({ success: true, status: (created as any).status, requestId: (created as any).id });
  } catch (err: any) {
    console.error("[POST /api/artists/[id]/portfolio-requests] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
