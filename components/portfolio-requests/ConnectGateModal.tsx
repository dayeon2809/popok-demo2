"use client";

import React from "react";
import { useMobileBodyScrollLock } from "@/hooks/useMobileBodyScrollLock";

export type ConnectGateVariant = "confirm" | "register" | "login";

interface ConnectGateModalProps {
  variant: ConnectGateVariant;
  onPrimary: () => void;
  onSecondary: () => void;
}

const VARIANT_COPY: Record<ConnectGateVariant, { title: string; body?: string; primaryLabel: string; secondaryLabel: string }> = {
  confirm: {
    title: "이 아티스트에게\n내 포퐄을 보낼까요?",
    body: "내 작업과 간단한 협업 제안을 함께 전달할 수 있어요.",
    primaryLabel: "내 포퐄 보내기",
    secondaryLabel: "다음에 할게요",
  },
  register: {
    title: "이 아티스트에게 내 포퐄을 보내려면\n먼저 작품을 등록해주세요.",
    body: "사진과 작품명만 올리면 시작할 수 있어요.",
    primaryLabel: "내 포퐄 등록하기",
    secondaryLabel: "둘러보기 계속",
  },
  login: {
    title: "내 포퐄을 보내려면\n로그인이 필요해요.",
    primaryLabel: "로그인하고 연결하기",
    secondaryLabel: "취소",
  },
};

// Confirm/gate step shown before ever touching SendPortfolioModal — same
// hand-rolled overlay convention as SendPortfolioModal.tsx (no shared Modal
// component exists in this repo).
export default function ConnectGateModal({ variant, onPrimary, onSecondary }: ConnectGateModalProps) {
  useMobileBodyScrollLock();
  const copy = VARIANT_COPY[variant];

  return (
    <div
      onClick={onSecondary}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1500,
        background: "rgba(23, 20, 17, 0.5)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "440px",
          maxWidth: "100%",
          background: "#FFFFFF",
          borderRadius: "20px 20px 0 0",
          border: "1px solid var(--border)",
          borderBottom: "none",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
          padding: "32px 28px 28px",
          textAlign: "center",
        }}
      >
        <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--navy)", margin: "0 0 10px", whiteSpace: "pre-line", lineHeight: 1.4 }}>
          {copy.title}
        </h3>
        {copy.body && (
          <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", margin: "0 0 24px" }}>
            {copy.body}
          </p>
        )}
        {!copy.body && <div style={{ marginBottom: "24px" }} />}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            onClick={onPrimary}
            style={{
              padding: "14px", fontSize: "0.9rem", fontWeight: 800, color: "#FFFFFF",
              background: "var(--navy)", border: "none", borderRadius: "999px", cursor: "pointer",
            }}
          >
            {copy.primaryLabel}
          </button>
          <button
            type="button"
            onClick={onSecondary}
            style={{
              padding: "14px", fontSize: "0.9rem", fontWeight: 700, color: "var(--ink-muted)",
              background: "none", border: "none", cursor: "pointer",
            }}
          >
            {copy.secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
