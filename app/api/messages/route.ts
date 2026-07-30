import { NextResponse } from "next/server";
import { createServerSupabaseClient, getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const db = getSupabaseServer();
  const { data: memberships, error } = await db
    .from("conversation_participants" as any)
    .select("conversation_id, last_read_at, conversations(id, portfolio_request_id, portfolio_request_type, last_message_at)")
    .eq("user_id", user.id)
    .is("left_at", null);
  if (error) return NextResponse.json({ error: "메시지 목록을 불러오지 못했습니다." }, { status: 500 });

  const items = await Promise.all((memberships || []).map(async (membership: any) => {
    const conversation = membership.conversations;
    const [{ data: otherMembership }, { data: lastMessage }] = await Promise.all([
      db.from("conversation_participants" as any)
        .select("user_id").eq("conversation_id", conversation.id).neq("user_id", user.id).maybeSingle(),
      db.from("messages" as any)
        .select("body, created_at").eq("conversation_id", conversation.id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const otherUserId = String((otherMembership as any)?.user_id || "");
    const [{ data: artist }, { data: company }] = await Promise.all([
      db.from("artists" as any).select("name, slug, profile_image_url").eq("owner_id", otherUserId).maybeSingle(),
      db.from("companies" as any).select("name, slug, profile_image_url").eq("owner_id", otherUserId).order("created_at").limit(1).maybeSingle(),
    ]);
    const profile = (artist as any) || (company as any);
    return {
      id: conversation.id,
      otherName: profile?.name || "POPOK 사용자",
      otherImageUrl: profile?.profile_image_url || null,
      targetType: conversation.portfolio_request_type,
      lastMessage: (lastMessage as any)?.body || "",
      lastMessageAt: conversation.last_message_at,
      unread: !membership.last_read_at || new Date(conversation.last_message_at) > new Date(membership.last_read_at),
    };
  }));

  items.sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
  return NextResponse.json({ items });
}
