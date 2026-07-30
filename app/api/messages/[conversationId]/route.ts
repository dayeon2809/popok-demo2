import { after, NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getSupabaseServer } from "@/lib/supabaseServer";
import { notifyConversationMessage } from "@/lib/email/notifyConversationMessage";

export const dynamic = "force-dynamic";

async function getViewer(conversationId: string) {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;
  const db = getSupabaseServer();
  const { data: membership } = await db.from("conversation_participants" as any)
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .is("left_at", null)
    .maybeSingle();
  return membership ? { user, db } : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const viewer = await getViewer(conversationId);
  if (!viewer) return NextResponse.json({ error: "대화를 찾을 수 없습니다." }, { status: 404 });
  const { user, db } = viewer;

  const [{ data: conversation }, { data: messages }, { data: otherMembership }] = await Promise.all([
    db.from("conversations" as any).select("*").eq("id", conversationId).maybeSingle(),
    db.from("messages" as any).select("id, sender_id, message_type, body, created_at")
      .eq("conversation_id", conversationId).order("created_at"),
    db.from("conversation_participants" as any).select("user_id")
      .eq("conversation_id", conversationId).neq("user_id", user.id).maybeSingle(),
  ]);
  const otherUserId = String((otherMembership as any)?.user_id || "");
  const [{ data: artist }, { data: company }] = await Promise.all([
    db.from("artists" as any).select("name, slug, profile_image_url").eq("owner_id", otherUserId).maybeSingle(),
    db.from("companies" as any).select("name, slug, profile_image_url").eq("owner_id", otherUserId).order("created_at").limit(1).maybeSingle(),
  ]);
  const profile = (artist as any) || (company as any);
  await (db.from("conversation_participants" as any) as any).update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId).eq("user_id", user.id);

  const requestType = (conversation as any).portfolio_request_type;
  const requestId = (conversation as any).portfolio_request_id;
  let portfolioPath = "/my-popok?tab=received-portfolios";
  if (requestType === "artist") {
    const { data: request } = await db.from("artist_portfolio_requests" as any)
      .select("sender_artist_id, artists!artist_portfolio_requests_sender_artist_id_fkey(slug,id)")
      .eq("id", requestId).maybeSingle();
    const sender = (request as any)?.artists;
    if (sender) portfolioPath = `/artists/${sender.slug || sender.id}`;
  }
  return NextResponse.json({
    conversation: {
      id: conversationId,
      otherName: profile?.name || "POPOK 사용자",
      otherImageUrl: profile?.profile_image_url || null,
      profilePath: artist ? `/artists/${(artist as any).slug}` : company ? `/companies/${(company as any).slug}` : null,
      portfolioPath,
    },
    messages: messages || [],
    viewerId: user.id,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const viewer = await getViewer(conversationId);
  if (!viewer) return NextResponse.json({ error: "대화를 찾을 수 없습니다." }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text || text.length > 2000) {
    return NextResponse.json({ error: "메시지는 1~2,000자로 입력해주세요." }, { status: 400 });
  }
  const { data, error } = await (viewer.db.from("messages" as any) as any).insert({
    conversation_id: conversationId,
    sender_id: viewer.user.id,
    message_type: "user",
    body: text,
  }).select("id, sender_id, message_type, body, created_at").single();
  if (error) return NextResponse.json({ error: "메시지를 보내지 못했습니다. 다시 시도해주세요." }, { status: 500 });
  after(() =>
    notifyConversationMessage({
      messageId: String((data as any).id),
      conversationId,
      senderUserId: viewer.user.id,
    })
  );
  return NextResponse.json({ message: data });
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const viewer = await getViewer(conversationId);
  if (!viewer) return NextResponse.json({ error: "대화를 찾을 수 없습니다." }, { status: 404 });

  const { error } = await (viewer.db.from("conversation_participants" as any) as any)
    .update({ left_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", viewer.user.id)
    .is("left_at", null);

  if (error) {
    console.error("[messages] leave conversation failed", {
      conversationId,
      userId: viewer.user.id,
      message: error.message,
      code: error.code,
    });
    return NextResponse.json({ error: "채팅에서 나가지 못했습니다. 다시 시도해주세요." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}