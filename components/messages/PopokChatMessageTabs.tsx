"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { formatUnreadCount } from "@/lib/messages";
import { usePopokChatData } from "./PopokChatDataProvider";

const pillBase = {
  minHeight: 44,
  padding: "8px 16px",
  borderRadius: 999,
  fontSize: "0.82rem",
  fontWeight: 800,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  flexShrink: 0,
  textDecoration: "none",
} as const;

export default function PopokChatMessageTabs({ artistName }: { artistName: string }) {
  const pathname = usePathname();
  const { unreadCount } = usePopokChatData();
  const activeRef = useRef<HTMLAnchorElement>(null);
  const chatActive = pathname === "/my-popok/messages" || pathname.startsWith("/my-popok/messages/");

  useEffect(() => {
    if (chatActive) activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [chatActive]);

  if (!chatActive) return null;

  const inactive = { ...pillBase, border: "1px solid var(--border)", background: "#fff", color: "var(--navy)" };
  const active = { ...pillBase, border: "1.5px solid var(--navy)", background: "var(--navy)", color: "#fff" };
  const unreadLabel = unreadCount > 0 ? `읽지 않은 포퐄챗 ${unreadCount}개` : undefined;

  return (
    <nav className="popok-dashboard-tabs-shell" aria-label="내 프로필과 포퐄 관리">
      <div className="popok-dashboard-tabs-scroll">
        <Link href="/my-popok" style={inactive}>내 프로필 <span style={{ opacity: 0.72, fontSize: "0.75rem" }}>({artistName})</span></Link>
        <Link ref={activeRef} href="/my-popok/messages" style={chatActive ? active : inactive} aria-current={chatActive ? "page" : undefined}>
          포퐄챗
          {unreadCount > 0 && <span aria-label={unreadLabel} className="popok-chat-tab-badge">{formatUnreadCount(unreadCount)}</span>}
        </Link>
        <Link href="/my-popok?tab=received-portfolios" style={inactive}>받은 포퐄</Link>
        <Link href="/my-popok?tab=sent-portfolios" style={inactive}>보낸 포퐄</Link>
      </div>
      <style>{`
        .popok-dashboard-tabs-shell { max-width: 1120px; margin: 20px auto 0; padding: 0 16px; min-width: 0; }
        .popok-dashboard-tabs-scroll { display: flex; align-items: center; gap: 8px; overflow-x: auto; overscroll-behavior-inline: contain; scrollbar-width: thin; padding: 2px 2px 8px; }
        .popok-dashboard-tabs-scroll > * { flex-shrink: 0; }
        .popok-chat-tab-badge { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; display: inline-grid; place-items: center; background: var(--accent); color: var(--navy); font-size: 0.68rem; font-weight: 950; line-height: 1; }
        .popok-dashboard-tabs-scroll a:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
        @media (max-width: 767px) {
          .popok-dashboard-tabs-shell { margin-top: 12px; padding: 0 12px; }
          .popok-dashboard-tabs-scroll { margin-inline: -2px; padding-inline: 2px; }
          .popok-dashboard-tabs-scroll::-webkit-scrollbar { height: 3px; }
          .popok-dashboard-tabs-scroll::-webkit-scrollbar-thumb { background: var(--border-dark); border-radius: 999px; }
        }
      `}</style>
    </nav>
  );
}