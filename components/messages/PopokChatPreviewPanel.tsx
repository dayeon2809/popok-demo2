"use client";

import Link from "next/link";
import type { MessageListItem } from "@/lib/messages";
import { formatMessageTime } from "@/lib/messages";

export default function PopokChatPreviewPanel({
  items,
  loading,
  unreadCount,
  onClose,
}: {
  items: MessageListItem[];
  loading: boolean;
  unreadCount: number;
  onClose: () => void;
}) {
  return (
    <section
      id="popok-chat-preview"
      aria-label="최근 포퐄챗"
      style={{
        position: "absolute",
        right: 0,
        bottom: 76,
        width: "min(370px, calc(100vw - 32px))",
        maxHeight: "min(540px, calc(100vh - 140px))",
        overflow: "hidden",
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr) auto",
        background: "#FFFEFA",
        border: "1px solid var(--border)",
        borderRadius: 18,
        boxShadow: "0 20px 50px rgba(23, 20, 17, 0.18)",
      }}
    >
      <header style={{ background: "var(--navy)", color: "#fff", padding: "15px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <strong style={{ flex: 1, fontSize: "1rem" }}>포퐄챗</strong>
        {unreadCount > 0 && <span style={{ fontSize: 12, opacity: 0.82 }}>읽지 않음 {unreadCount > 99 ? "99+" : unreadCount}</span>}
        <Link href="/my-popok/messages" onClick={onClose} style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>전체 보기</Link>
        <button type="button" onClick={onClose} aria-label="포퐄챗 닫기" style={{ width: 30, height: 30, border: 0, borderRadius: "50%", background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 18, cursor: "pointer" }}>×</button>
      </header>
      <div style={{ overflowY: "auto", padding: 8 }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--ink-muted)", fontSize: 13 }}>불러오는 중...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-muted)", lineHeight: 1.7, fontSize: 13 }}>아직 시작된 포퐄챗이 없어요.</div>
        ) : items.slice(0, 5).map((item) => (
          <Link key={item.id} href={`/my-popok/messages/${item.id}`} onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 9px", borderBottom: "1px solid var(--border)", color: "inherit", textDecoration: "none" }}>
            {item.otherImageUrl ? (
              <img src={item.otherImageUrl} alt="" style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--tag-bg)", display: "grid", placeItems: "center", color: "var(--navy)", fontWeight: 900, flexShrink: 0 }}>{item.otherName.slice(0, 1)}</div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 14 }}>{item.otherName}</strong>
                <span style={{ fontSize: 11, color: "var(--ink-faint)", flexShrink: 0 }}>{formatMessageTime(item.lastMessageAt)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                <span style={{ minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: item.unread ? "var(--ink)" : "var(--ink-muted)", fontWeight: item.unread ? 700 : 400, fontSize: 12 }}>{item.lastMessage}</span>
                {item.unread && <span aria-label="읽지 않은 포퐄챗" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/my-popok/messages" onClick={onClose} className="btn-lime" style={{ margin: 12, padding: "11px 16px", borderRadius: 10, textAlign: "center", textDecoration: "none", fontSize: 13, fontWeight: 900 }}>포퐄챗 전체 보기</Link>
    </section>
  );
}
