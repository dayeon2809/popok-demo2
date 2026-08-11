import { trackEvent } from "@/lib/analytics";

export const messageAnalytics = {
  portfolioConversationCreated: () => trackEvent("portfolio_conversation_created"),
  messageListOpen: () => trackEvent("message_list_open"),
  conversationOpen: () => trackEvent("conversation_open"),
  chatMessageSent: () => trackEvent("chat_message_sent"),
};
