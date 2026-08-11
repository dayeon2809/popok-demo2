import { getSupabaseServer } from "@/lib/supabaseServer";
import { notifyMessageReceived } from "./notify";
import { isUserMessageFromSender } from "./messageReceivedDelivery";

async function getAccountDisplayName(userId: string): Promise<string> {
  const db = getSupabaseServer();
  const [{ data: artist }, { data: company }] = await Promise.all([
    db.from("artists" as any).select("name").eq("owner_id", userId).maybeSingle(),
    db.from("companies" as any).select("name").eq("owner_id", userId).order("created_at").limit(1).maybeSingle(),
  ]);
  return String((artist as any)?.name || (company as any)?.name || "POPOK 사용자");
}

export async function notifyConversationMessage(params: {
  messageId: string;
  conversationId: string;
  senderUserId: string;
  senderName?: string;
}): Promise<void> {
  try {
    const db = getSupabaseServer();
    const { data: message, error: messageError } = await db
      .from("messages" as any)
      .select("id, sender_id, message_type")
      .eq("id", params.messageId)
      .eq("conversation_id", params.conversationId)
      .maybeSingle();

    if (messageError || !isUserMessageFromSender(message as any, params.senderUserId)) return;

    const { data: recipient, error: recipientError } = await db
      .from("conversation_participants" as any)
      .select("user_id")
      .eq("conversation_id", params.conversationId)
      .neq("user_id", params.senderUserId)
      .is("left_at", null)
      .limit(1)
      .maybeSingle();

    const recipientUserId = String((recipient as any)?.user_id || "");
    if (recipientError || !recipientUserId || recipientUserId === params.senderUserId) return;

    const [senderName, recipientName] = await Promise.all([
      params.senderName ? Promise.resolve(params.senderName) : getAccountDisplayName(params.senderUserId),
      getAccountDisplayName(recipientUserId),
    ]);

    await notifyMessageReceived({
      messageId: params.messageId,
      conversationId: params.conversationId,
      senderUserId: params.senderUserId,
      recipientUserId,
      senderName,
      recipientName,
    });
  } catch (error) {
    console.error("[email] message notification failed after message save", {
      notification_type: "message_received",
      message_id: params.messageId,
      conversation_id_exists: Boolean(params.conversationId),
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
