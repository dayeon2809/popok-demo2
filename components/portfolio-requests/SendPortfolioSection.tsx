"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SendPortfolioModal from "./SendPortfolioModal";
import { PORTFOLIO_REQUEST_COPY, type PortfolioRequestTarget } from "@/lib/portfolioRequests";
import type { PortfolioRequestViewerState } from "@/lib/portfolioRequestsServer";

interface SendPortfolioSectionProps {
  target: PortfolioRequestTarget;
  viewerState: PortfolioRequestViewerState;
  /** Current page path, e.g. from usePathname() — used to build /auth?redirect=... */
  currentPath: string;
  onToast: (message: string) => void;
}

// Bottom-of-page CTA, shared by the company and artist detail pages — only
// `target.type` changes copy/endpoint/self-label. Button behavior:
//  - logged out          -> /auth?redirect=<currentPath> (this repo's login
//                            route — confirmed via Header.tsx/AuthNav.tsx,
//                            NOT /login — with a return-path so the user
//                            lands back here instead of /my-popok)
//  - no artist profile    -> inline banner pointing to /onboarding
//  - viewing your own     -> hidden entirely (see page-level isSelf checks)
//  - has profile, unsent  -> opens SendPortfolioModal
//  - already sent         -> disabled "포퐄을 보냈습니다"
export default function SendPortfolioSection({ target, viewerState, currentPath, onToast }: SendPortfolioSectionProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(viewerState.existingRequestStatus);
  const copy = PORTFOLIO_REQUEST_COPY[target.type];

  // On the artist detail page this component now mounts immediately, before
  // the async viewer-state fetch resolves (see app/artists/[id]/page.tsx).
  // The initial useState value only captures existingRequestStatus at mount
  // time (likely null, from the safe default), so it must be re-synced once
  // the real viewerState arrives — otherwise an already-sent request would
  // never flip the button out of its default "send" label.
  useEffect(() => {
    setStatus(viewerState.existingRequestStatus);
  }, [viewerState.existingRequestStatus]);

  if (viewerState.isSelf) return null;

  const alreadySent = status === "pending" || status === "viewed";

  const handleClick = () => {
    if (!viewerState.isLoggedIn) {
      router.push(`/auth?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    if (!viewerState.artist) return; // handled by the inline banner below
    if (alreadySent) return;
    setModalOpen(true);
  };

  return (
    <section style={{ padding: "60px 24px", textAlign: "center", borderTop: "1px solid var(--border)" }}>
      <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
        <div style={{ height: "1px", background: "var(--border)", width: "80px", margin: "0 auto 32px" }} />

        <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--navy)", margin: "0 0 10px" }}>
          {copy.heading}
        </h3>
        <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", margin: "0 0 28px" }}>
          {copy.subheading}
        </p>

        {viewerState.isLoggedIn && !viewerState.artist ? (
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", margin: 0 }}>
              포퐄을 보내려면 먼저 개인 포트폴리오를 만들어야 합니다.
            </p>
            <Link
              href="/onboarding"
              style={{
                display: "inline-block",
                padding: "13px 32px",
                fontSize: "0.9rem",
                fontWeight: 800,
                color: "#FFFFFF",
                background: "var(--navy)",
                borderRadius: "999px",
                textDecoration: "none",
              }}
            >
              내 포퐄 만들기
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            disabled={alreadySent}
            style={{
              padding: "13px 32px",
              fontSize: "0.9rem",
              fontWeight: 800,
              color: alreadySent ? "var(--ink-muted)" : "#FFFFFF",
              background: alreadySent ? "#F0EEE9" : "var(--navy)",
              border: alreadySent ? "1px solid var(--border)" : "none",
              borderRadius: "999px",
              cursor: alreadySent ? "default" : "pointer",
            }}
          >
            {alreadySent ? copy.sentLabel : copy.buttonLabel}
          </button>
        )}
      </div>

      {modalOpen && viewerState.artist && (
        <SendPortfolioModal
          target={target}
          senderArtist={viewerState.artist}
          onClose={() => setModalOpen(false)}
          onSent={() => {
            setStatus("pending");
            setModalOpen(false);
            onToast("포퐄을 보냈습니다.");
          }}
          onError={(msg) => {
            setModalOpen(false);
            onToast(msg);
          }}
        />
      )}
    </section>
  );
}
