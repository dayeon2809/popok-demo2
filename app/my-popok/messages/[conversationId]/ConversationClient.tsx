"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { messageAnalytics } from "@/lib/messageAnalytics";

type Msg = { id: string; sender_id: string | null; message_type: "user" | "system"; body: string; created_at: string };
type Meta = { otherName: string; otherImageUrl: string | null; profilePath: string | null; portfolioPath: string };

export default function ConversationClient({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [viewerId, setViewerId] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let activeController: AbortController | null = null;
    const load = async () => {
      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;
      try {
        const response = await fetch(`/api/messages/${conversationId}`, { cache: "no-store", signal: controller.signal });
        if (cancelled) return;
        if (response.status === 404) { setMissing(true); return; }
        const data = await response.json();
        if (cancelled) return;
        setMeta(data.conversation); setViewerId(data.viewerId);
        setMessages((current) => {
          const byId = new Map(current.map((message) => [message.id, message]));
          (data.messages || []).forEach((message: Msg) => byId.set(message.id, message));
          return [...byId.values()].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
        });
      } catch (loadError) {
        if (!cancelled && !(loadError instanceof DOMException && loadError.name === "AbortError")) setError("메시지를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      }
    };
    messageAnalytics.conversationOpen();
    void load();
    const intervalId = window.setInterval(() => { void load(); }, 7000);
    return () => { cancelled = true; activeController?.abort(); window.clearInterval(intervalId); };
  }, [conversationId]);

  useEffect(() => {
    if (shouldAutoScroll.current) end.current?.scrollIntoView();
  }, [messages.length]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [menuOpen]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true); setError("");
    const r = await fetch(`/api/messages/${conversationId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
    const d = await r.json();
    if (!r.ok) setError(d.error);
    else {
      shouldAutoScroll.current = true;
      setMessages((x) => (x.some((m) => m.id === d.message.id) ? x : [...x, d.message]));
      setText("");
      messageAnalytics.chatMessageSent();
    }
    setSending(false);
  }

  async function leaveConversation() {
    if (leaving || !window.confirm("이 채팅에서 나갈까요?\n나가면 내 포퐄챗 목록과 대화 기록에서 사라집니다.")) return;
    setLeaving(true);
    setError("");
    try {
      const response = await fetch(`/api/messages/${conversationId}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "채팅에서 나가지 못했습니다. 다시 시도해주세요.");
        setLeaving(false);
        return;
      }
      router.replace("/my-popok/messages");
      router.refresh();
    } catch {
      setError("채팅에서 나가지 못했습니다. 네트워크 연결을 확인해주세요.");
      setLeaving(false);
    }
  }
  if (missing) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", background: "#FFFFFF" }}>
        <div style={{ color: "var(--ink-muted)", fontSize: "0.9rem", lineHeight: 1.7 }}>
          접근할 수 없는 대화입니다.<br />
          <Link href="/my-popok/messages" style={{ color: "var(--navy)", fontWeight: 700 }}>{"\uD3EC\uD404\uCC57"}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="popok-conversation-page" style={{ display: "flex", justifyContent: "center", overflow: "hidden", background: "#FFFFFF" }}>
      <section className="popok-conversation-shell" style={{ width: "100%", maxWidth: 820, display: "grid", gridTemplateRows: "auto minmax(0,1fr) auto" }}>
        <header className="popok-conversation-header" style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "#FFFFFF", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/my-popok/messages" className="popok-chat-header-btn" aria-label="포퐄챗 목록으로 돌아가기" style={{ width: 44, height: 44, padding: 0, flexShrink: 0 }}>
            ←
          </Link>
          {meta?.otherImageUrl ? (
            <img src={meta.otherImageUrl} alt="" className="popok-msg-avatar" style={{ width: 36, height: 36 }} />
          ) : (
            <div className="popok-msg-avatar-fallback" style={{ width: 36, height: 36 }}>{(meta?.otherName || "?")[0]}</div>
          )}
          <strong style={{ flex: 1, minWidth: 0, fontSize: "0.95rem", color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {meta?.otherName ? `${meta.otherName}과의 포퐄챗` : "포퐄챗"}
          </strong>
          <div className="popok-chat-desktop-actions" style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {meta?.profilePath && (
              <Link href={meta.profilePath} className="popok-chat-header-btn">
                <span className="popok-btn-text-desktop">공개 프로필</span>
                <span className="popok-btn-text-mobile">프로필</span>
              </Link>
            )}
            {meta && (
              <Link href={meta.portfolioPath} className="popok-chat-header-btn">포퐄 보기</Link>
            )}
            {meta && (
              <button
                type="button"
                className="popok-chat-header-btn popok-chat-leave-btn"
                onClick={leaveConversation}
                disabled={leaving}
                aria-label="채팅 나가기"
                style={{ color: "#B42318", borderColor: "#F0B8B2", background: "#FFFFFF" }}
              >
                {leaving ? "나가는 중" : "채팅 나가기"}
              </button>
            )}
          </div>
          {meta && (
            <div ref={menuRef} className="popok-chat-mobile-menu">
              <button
                type="button"
                className="popok-chat-menu-trigger"
                aria-label="대화 메뉴 열기"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                ⋯
              </button>
              {menuOpen && (
                <div className="popok-chat-menu-popover" role="menu" aria-label="대화 메뉴">
                  {meta.profilePath && <Link href={meta.profilePath} role="menuitem" onClick={() => setMenuOpen(false)}>공개 프로필</Link>}
                  <Link href={meta.portfolioPath} role="menuitem" onClick={() => setMenuOpen(false)}>포퐄 보기</Link>
                  <button type="button" role="menuitem" className="popok-chat-menu-danger" disabled={leaving} onClick={() => { setMenuOpen(false); void leaveConversation(); }}>
                    {leaving ? "나가는 중" : "채팅 나가기"}
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        <div
          ref={messagesRef}
          className="popok-chat-messages"
          onScroll={(event) => {
            const node = event.currentTarget;
            shouldAutoScroll.current = node.scrollHeight - node.scrollTop - node.clientHeight < 120;
          }}
          style={{ overflowY: "auto", padding: "20px", background: "#FFFFFF" }}
        >
          {messages.map((m, n) => {
            const mine = m.sender_id === viewerId;
            const prev = messages[n - 1];
            const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
            return (
              <div key={m.id}>
                {newDay && (
                  <div style={{ textAlign: "center", margin: "18px 0 14px", fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-muted)" }}>
                    {new Date(m.created_at).toLocaleDateString("ko-KR")}
                  </div>
                )}
                {m.message_type === "system" ? (
                  <div style={{ display: "flex", justifyContent: "center", margin: "14px 0" }}>
                    <div style={{ background: "#F7F6F2", color: "var(--ink-muted)", fontSize: "0.76rem", fontWeight: 600, padding: "8px 14px", borderRadius: "8px", whiteSpace: "pre-wrap", textAlign: "center", maxWidth: "80%" }}>
                      {m.body}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                    <div
                      className={`popok-chat-bubble ${mine ? "popok-chat-bubble-mine" : "popok-chat-bubble-theirs"}`}
                      style={{ maxWidth: "72%", padding: "10px 14px", margin: "3px 0", whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: "0.9rem", lineHeight: 1.5, background: mine ? "var(--navy)" : "#F5F3EE", color: mine ? "#FFFFFF" : "var(--ink)", border: mine ? "1px solid var(--navy)" : "1px solid #DED9CF", borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px", boxShadow: "0 1px 2px rgba(23,20,17,.04)" }}
                    >
                      {m.body}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={end} />
        </div>

        <form className="popok-chat-composer" onSubmit={send} style={{ padding: "12px 16px max(12px,env(safe-area-inset-bottom))", borderTop: "1px solid var(--border)", background: "#FFFFFF", display: "flex", flexDirection: "column", gap: 6 }}>
          {error && <div role="alert" style={{ color: "#B91C1C", fontSize: "0.78rem", fontWeight: 700 }}>{error}</div>}
          <div className="popok-chat-composer-row" style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              value={text}
              maxLength={2000}
              rows={1}
              placeholder="메시지를 입력하세요"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
              className="popok-chat-textarea"
              style={{ flex: 1, minWidth: 0, resize: "none", padding: "10px 14px", fontSize: "0.9rem", lineHeight: 1.5, maxHeight: 120 }}
            />
            <button aria-label="메시지 보내기" disabled={sending || !text.trim()} className="btn-lime popok-chat-send-btn" style={{ padding: "10px 20px", borderRadius: "10px", fontWeight: 800, fontSize: "0.85rem", border: "none" }}>
              보내기
            </button>
          </div>
          <small style={{ alignSelf: "flex-end", fontSize: "0.68rem", color: "var(--ink-faint)" }}>{text.length} / 2,000</small>
        </form>
      </section>
    </main>
  );
}
