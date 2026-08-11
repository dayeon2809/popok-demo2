"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { messageAnalytics } from "@/lib/messageAnalytics";
import { formatMessageTime, type MessageListItem } from "@/lib/messages";


const TYPE_LABEL: Record<MessageListItem["targetType"], string> = { artist: "아티스트", company: "단체" };


export default function MessageListClient() {
  const [items, setItems] = useState<MessageListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    messageAnalytics.messageListOpen();
    fetch("/api/messages")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="popok-message-list-page" style={{ minHeight: "100vh", background: "#FFFFFF", padding: "clamp(28px,5vw,64px) 16px" }}>
      <div className="popok-message-list-shell" style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/my-popok" className="popok-message-list-back" style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink-muted)", textDecoration: "none" }}>
          ← 대시보드
        </Link>
        <h1 className="display popok-message-list-title" style={{ fontSize: "clamp(1.7rem, 3vw, 2.15rem)", margin: "12px 0 6px", color: "var(--navy)" }}>{"\uD3EC\uD404\uCC57"}</h1>
        <p style={{ margin: "0 0 26px", color: "var(--ink-muted)", fontSize: "0.9rem" }}>{"\uD3EC\uD404\uC744 \uD1B5\uD574 \uC5F0\uACB0\uB41C \uC0C1\uB300\uC640 \uC774\uC57C\uAE30\uB97C \uC774\uC5B4\uAC00\uC138\uC694."}</p>

        {loading && (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-muted)", fontSize: "0.85rem" }}>불러오는 중...</div>
        )}

        {!loading && !items.length && (
          <div className="popok-message-empty" style={{ background: "#FFFFFF", border: "1px dashed var(--border)", borderRadius: "14px", padding: "56px 24px", textAlign: "center", color: "var(--ink-muted)", fontSize: "0.88rem", lineHeight: 1.7 }}>
            {"\uC544\uC9C1 \uC2DC\uC791\uB41C \uD3EC\uD404\uCC57\uC774 \uC5C6\uC5B4\uC694."}<br />{"\uD3EC\uD404\uC744 \uBCF4\uB0B4\uBA74 \uC774\uACF3\uC5D0\uC11C \uC774\uC57C\uAE30\uB97C \uC774\uC5B4\uAC08 \uC218 \uC788\uC5B4\uC694."}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {items.map((i) => (
            <Link key={i.id} href={`/my-popok/messages/${i.id}`} className="popok-msg-card" style={{ display: "flex", alignItems: "center", gap: 14, minHeight: 82, padding: "15px 17px", background: "#FFFFFF", border: "1px solid #DED9CF", borderRadius: 14, color: "inherit", textDecoration: "none", boxShadow: "0 4px 14px rgba(23,20,17,.045)" }}>
              {i.otherImageUrl ? (
                <img src={i.otherImageUrl} alt="" className="popok-msg-avatar" style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", border: "1px solid #DED9CF", flexShrink: 0 }} />
              ) : (
                <div className="popok-msg-avatar-fallback" style={{ width: 50, height: 50, borderRadius: "50%", background: "#F0EDE5", border: "1px solid #DED9CF", display: "grid", placeItems: "center", color: "var(--navy)", fontWeight: 900, flexShrink: 0 }}>{i.otherName[0]}</div>
              )}
              <div className="popok-msg-content" style={{ minWidth: 0, flex: 1 }}>
                <div className="popok-msg-name-row" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <strong className="popok-msg-name" style={{ fontSize: "0.92rem", color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {i.otherName}
                  </strong>
                  <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--ink-muted)", background: "var(--bg-warm)", padding: "2px 8px", borderRadius: "6px", flexShrink: 0 }}>
                    {TYPE_LABEL[i.targetType]}
                  </span>
                </div>
                <span
                  className="popok-msg-preview"
                  style={{
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: "0.82rem",
                    color: i.unread ? "var(--ink)" : "var(--ink-muted)",
                    fontWeight: i.unread ? 700 : 400,
                  }}
                >
                  {i.lastMessage}
                </span>
              </div>
              <div className="popok-msg-meta" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
                <span className="popok-msg-time" style={{ fontSize: "0.68rem", color: "var(--ink-faint)" }}>{formatMessageTime(i.lastMessageAt)}</span>
                {i.unread && <span className="popok-unread-badge" aria-label="읽지 않은 포퐄챗 1개" style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
