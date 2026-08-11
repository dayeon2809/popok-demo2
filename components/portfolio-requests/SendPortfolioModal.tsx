"use client";

import React, { useState } from "react";
import { portfolioRequestCreateEndpoint, PORTFOLIO_REQUEST_COPY, type PortfolioRequestTarget } from "@/lib/portfolioRequests";
import { useMobileBodyScrollLock } from "@/hooks/useMobileBodyScrollLock";

interface SendPortfolioModalProps {
  target: PortfolioRequestTarget;
  senderArtist: {
    id: string;
    name: string;
    role: string | null;
    profile_image_url: string | null;
    slug: string | null;
  };
  onClose: () => void;
  onSent: () => void;
  onError: (message: string) => void;
}

const MESSAGE_MAX = 500;

// Shared by both the company detail page and the artist detail page — only
// `target.type` changes wording/endpoint/recipient display. No shared Modal
// component exists anywhere in this repo (every modal hand-rolls its own
// overlay — CompanyClaimModal.tsx, WorkDrawer.tsx), so this matches that
// same visual convention rather than inventing a new one.
export default function SendPortfolioModal({ target, senderArtist, onClose, onSent, onError }: SendPortfolioModalProps) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useMobileBodyScrollLock();
  const copy = PORTFOLIO_REQUEST_COPY[target.type];

  const senderPortfolioLink = `/artists/${senderArtist.slug || senderArtist.id}`;

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(portfolioRequestCreateEndpoint(target), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();

      if (res.status === 401) {
        onError("로그인이 필요합니다.");
        return;
      }
      if (!data.success) {
        onError(data.error || "포퐄 전송에 실패했습니다.");
        return;
      }

      onSent();
    } catch {
      onError("서버 통신 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1500,
        background: "rgba(23, 20, 17, 0.5)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "440px",
          maxWidth: "100%",
          maxHeight: "88vh",
          overflowY: "auto",
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          padding: "28px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--navy)", margin: 0 }}>
            포퐄 보내기
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{ background: "none", border: "none", fontSize: "1.4rem", fontWeight: 300, color: "var(--ink-muted)", cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}
          >
            ×
          </button>
        </div>

        {/* Sender */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", background: "#FAF9F5", borderRadius: "10px", border: "1px solid var(--border)", marginBottom: "12px" }}>
          {senderArtist.profile_image_url ? (
            <img src={senderArtist.profile_image_url} alt="" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
          ) : (
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
              🎭
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--navy)" }}>{senderArtist.name}</div>
            {senderArtist.role && <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>{senderArtist.role}</div>}
            <a href={senderPortfolioLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: "var(--navy)", fontWeight: 700, textDecoration: "underline" }}>
              내 포퐄 보기 ↗
            </a>
          </div>
        </div>

        {/* Recipient */}
        <div style={{ marginBottom: "20px" }}>
          <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "8px" }}>
            {copy.recipientFieldLabel}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {target.imageUrl ? (
              <img src={target.imageUrl} alt="" style={{ width: "36px", height: "36px", borderRadius: target.type === "artist" ? "50%" : "8px", objectFit: "cover", border: "1px solid var(--border)" }} />
            ) : (
              <div style={{ width: "36px", height: "36px", borderRadius: target.type === "artist" ? "50%" : "8px", background: "#FAF9F5", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>
                {copy.fallbackIcon}
              </div>
            )}
            <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--navy)" }}>{target.name}</span>
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
            메시지 (선택)
          </label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
            placeholder={copy.messagePlaceholder}
            style={{ width: "100%", padding: "10px 12px", fontSize: "0.85rem", borderRadius: "8px", border: "1.5px solid var(--border)", resize: "vertical", fontFamily: "inherit" }}
          />
          <div style={{ textAlign: "right", fontSize: "0.7rem", color: "var(--ink-faint)", marginTop: "4px" }}>
            {message.length} / {MESSAGE_MAX}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: "100%",
            padding: "13px",
            fontSize: "0.9rem",
            fontWeight: 800,
            color: "#FFFFFF",
            background: "var(--navy)",
            border: "none",
            borderRadius: "8px",
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "전송 중..." : "요청 보내기"}
        </button>
      </div>
    </div>
  );
}
