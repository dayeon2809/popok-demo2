"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SendPortfolioModal from "./SendPortfolioModal";
import ConnectGateModal, { type ConnectGateVariant } from "./ConnectGateModal";
import type { PortfolioRequestTarget } from "@/lib/portfolioRequests";
import type { PortfolioRequestViewerState } from "@/lib/portfolioRequestsServer";

interface ConnectCtaProps {
  target: PortfolioRequestTarget;
  viewerState: PortfolioRequestViewerState;
  /** Current page path, e.g. from usePathname() — used to build /auth?redirect=... */
  currentPath: string;
  onToast: (message: string) => void;
  label?: string;
  /** Small inline pill for the hero button row, next to Share — skips the
   * full-width-on-mobile treatment used by the standalone CONNECT section. */
  compact?: boolean;
}

// Shared "연결하기" trigger — used both in the artist page hero and in the
// bottom CONNECT section, so the login/register/confirm gate logic and the
// SendPortfolioModal wiring only exist once. Reuses the same viewer-state
// shape and modal as the older SendPortfolioSection (still used as-is on the
// company page), just inserts a confirm step before ever opening
// SendPortfolioModal.
export default function ConnectCta({ target, viewerState, currentPath, onToast, label = "연결하기", compact = false }: ConnectCtaProps) {
  const router = useRouter();
  const [gate, setGate] = useState<ConnectGateVariant | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(viewerState.existingRequestStatus);

  // This component can mount (on the artist page) before the async
  // viewer-state fetch resolves — re-sync once the real status arrives so an
  // already-sent request reliably blocks a second send.
  useEffect(() => {
    setStatus(viewerState.existingRequestStatus);
  }, [viewerState.existingRequestStatus]);

  if (viewerState.isSelf) return null;

  const alreadySent = status === "pending" || status === "viewed";

  const handleClick = () => {
    if (!viewerState.isLoggedIn) {
      setGate("login");
      return;
    }
    if (!viewerState.artist) {
      setGate("register");
      return;
    }
    if (alreadySent) {
      onToast("이미 포퐄을 보냈습니다.");
      return;
    }
    setGate("confirm");
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={compact ? "btn-lime" : "btn-lime connect-cta-btn"}
        style={
          compact
            ? { padding: "8px 16px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 800, border: "none", cursor: "pointer" }
            : { padding: "10px 28px", borderRadius: "999px", fontSize: "0.82rem", fontWeight: 800, border: "none", cursor: "pointer" }
        }
      >
        {label}
      </button>

      {gate === "login" && (
        <ConnectGateModal
          variant="login"
          onPrimary={() => router.push(`/auth?redirect=${encodeURIComponent(currentPath)}`)}
          onSecondary={() => setGate(null)}
        />
      )}
      {gate === "register" && (
        <ConnectGateModal
          variant="register"
          onPrimary={() => router.push("/onboarding")}
          onSecondary={() => setGate(null)}
        />
      )}
      {gate === "confirm" && (
        <ConnectGateModal
          variant="confirm"
          onPrimary={() => {
            setGate(null);
            setSendModalOpen(true);
          }}
          onSecondary={() => setGate(null)}
        />
      )}

      {sendModalOpen && viewerState.artist && (
        <SendPortfolioModal
          target={target}
          senderArtist={viewerState.artist}
          onClose={() => setSendModalOpen(false)}
          onSent={() => {
            setStatus("pending");
            setSendModalOpen(false);
            onToast("포퐄을 보냈습니다.");
          }}
          onError={(msg) => {
            setSendModalOpen(false);
            onToast(msg);
          }}
        />
      )}
    </>
  );
}
