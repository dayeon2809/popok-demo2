"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatUnreadCount } from "@/lib/messages";
import PopokChatPreviewPanel from "./PopokChatPreviewPanel";
import { usePopokChatData } from "./PopokChatDataProvider";

export default function PopokChatLauncher() {
  const pathname = usePathname();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { items, loading, unreadCount, reload } = usePopokChatData();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [open]);

  if (/^\/my-popok\/messages\/[^/]+/.test(pathname)) return null;
  const badge = formatUnreadCount(unreadCount);

  const toggle = () => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      router.push("/my-popok/messages");
      return;
    }
    setOpen((current) => {
      const next = !current;
      if (next) void reload();
      return next;
    });
  };

  return (
    <div ref={rootRef} className="popok-chat-launcher-root" style={{ position: "fixed", right: "max(16px, env(safe-area-inset-right))", bottom: "calc(20px + env(safe-area-inset-bottom))", zIndex: 80 }}>
      {open && <PopokChatPreviewPanel items={items} loading={loading} unreadCount={unreadCount} onClose={() => setOpen(false)} />}
      <button
        type="button"
        onClick={toggle}
        aria-label={unreadCount ? `포퐄챗 열기, 읽지 않은 포퐄챗 ${unreadCount}개` : "포퐄챗 열기"}
        aria-expanded={open}
        aria-controls="popok-chat-preview"
        title="포퐄챗 열기"
        className="popok-chat-launcher"
        style={{ width: 58, height: 58, borderRadius: "50%", border: "1px solid rgba(255,255,255,.18)", background: "var(--navy)", color: "var(--accent)", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "0 12px 30px rgba(23,20,17,.24)", transition: "transform .16s ease, box-shadow .16s ease", position: "relative" }}
      >
        <svg aria-hidden="true" width="27" height="27" viewBox="0 0 24 24" fill="none"><path d="M20 11.5a7.5 7.5 0 0 1-8 7.48 8.8 8.8 0 0 1-3.3-.9L4 20l1.42-4.08A7.5 7.5 0 1 1 20 11.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>
        {unreadCount > 0 && <span aria-label={`읽지 않은 포퐄챗 ${unreadCount}개`} style={{ position: "absolute", right: -4, top: -5, minWidth: 23, height: 23, padding: "0 6px", borderRadius: 999, display: "grid", placeItems: "center", background: "var(--accent)", color: "var(--navy)", border: "2px solid #fff", fontSize: 11, fontWeight: 950 }}>{badge}</span>}
      </button>
      <style>{`
        .popok-chat-launcher:hover { transform: translateY(-2px); box-shadow: 0 16px 34px rgba(23,20,17,.28) !important; }
        .popok-chat-launcher:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
        @media (max-width: 767px) {
          .popok-chat-launcher-root { right: max(16px, env(safe-area-inset-right)) !important; bottom: calc(16px + env(safe-area-inset-bottom)) !important; }
          .popok-chat-launcher { width: 54px !important; height: 54px !important; }
        }
      `}</style>
    </div>
  );
}