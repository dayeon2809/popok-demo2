import type { EmailContent } from "./templates";
import type { SendPopokEmailParams, SendPopokEmailResult } from "./types";

export interface MessageReceivedDeliveryDependencies {
  getAccountEmail: (userId: string) => Promise<string | null>;
  buildEmail: (params: { recipientName: string; senderName: string; conversationId: string }) => EmailContent;
  sendEmail: (params: SendPopokEmailParams) => Promise<SendPopokEmailResult>;
}

export function isUserMessageFromSender(
  message: { message_type?: unknown; sender_id?: unknown } | null,
  senderUserId: string
): boolean {
  return Boolean(
    message &&
    message.message_type === "user" &&
    String(message.sender_id || "") === senderUserId
  );
}
export async function deliverMessageReceivedEmail(
  params: {
    messageId: string;
    conversationId: string;
    senderUserId: string;
    recipientUserId: string;
    senderName: string;
    recipientName: string;
  },
  dependencies: MessageReceivedDeliveryDependencies
): Promise<SendPopokEmailResult> {
  if (!params.recipientUserId || params.recipientUserId === params.senderUserId) {
    return { success: true, skipped: true };
  }

  const email = await dependencies.getAccountEmail(params.recipientUserId);
  const content = dependencies.buildEmail({
    recipientName: params.recipientName,
    senderName: params.senderName,
    conversationId: params.conversationId,
  });

  return dependencies.sendEmail({
    to: email || "",
    ...content,
    eventKey: "message_received",
    entityType: "message",
    entityId: params.messageId,
    recipientUserId: params.recipientUserId,
    conversationId: params.conversationId,
  });
}
