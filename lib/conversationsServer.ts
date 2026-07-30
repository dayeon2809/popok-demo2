import { getSupabaseServer } from "@/lib/supabaseServer";
import { after } from "next/server";
import { notifyConversationMessage } from "@/lib/email/notifyConversationMessage";

export async function createPortfolioConversation(params: {
  requestId: string;
  requestType: "artist" | "company";
  senderUserId: string;
  recipientUserId: string | null;
  senderArtistName: string;
  message: string;
}): Promise<string | null> {
  if (!params.recipientUserId) return null;
  const firstMessage = params.message.trim() ||
    `${params.senderArtistName} 님이 포퐄을 보냈습니다.\n상대방의 포퐄을 확인하고 이야기를 시작해보세요.`;
  const { data, error } = await (getSupabaseServer() as any).rpc("create_portfolio_conversation", {
    request_id: params.requestId,
    request_type: params.requestType,
    sender_user_id: params.senderUserId,
    recipient_user_id: params.recipientUserId,
    first_message: firstMessage,
    first_message_is_system: !params.message.trim(),
  });
  if (error) {
    console.error("[portfolio conversation] creation failed", {
      portfolio_request_id: params.requestId,
      reason: error.code || error.message,
    });
    return null;
  }
  const conversationId = String(data);
  if (!params.message.trim()) return conversationId;

  const { data: firstMessageRow, error: firstMessageError } = await getSupabaseServer()
    .from("messages" as any)
    .select("id, sender_id, message_type")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (
    !firstMessageError &&
    firstMessageRow &&
    (firstMessageRow as any).message_type === "user" &&
    String((firstMessageRow as any).sender_id || "") === params.senderUserId
  ) {
    after(() =>
      notifyConversationMessage({
        messageId: String((firstMessageRow as any).id),
        conversationId,
        senderUserId: params.senderUserId,
        senderName: params.senderArtistName,
      })
    );
  }

  return conversationId;
}
