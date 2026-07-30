export type MessageListItem = {
  id: string;
  otherName: string;
  otherImageUrl: string | null;
  targetType: "artist" | "company";
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
};

export function formatUnreadCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}

export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
