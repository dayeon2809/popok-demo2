"use client";

import Link from "next/link";

interface FeedCtaCardProps {
  href: string;
  onClick?: () => void;
}

// Inline "make your own POPOK" prompt woven into the masonry feed — reuses
// the same tile shell (radius, break-inside, bottom margin) as
// VisualFeedCard's image tiles so it reads as part of the feed rather than a
// banner ad, per the "일반 배너보다 기존 피드 카드의 디자인 언어" requirement.
export default function FeedCtaCard({ href, onClick }: FeedCtaCardProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="visual-feed-card"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "14px",
        width: "100%",
        aspectRatio: "0.85",
        position: "relative",
        overflow: "hidden",
        borderRadius: "6px",
        breakInside: "avoid",
        marginBottom: "var(--feed-gap, 10px)",
        background: "var(--navy)",
        padding: "24px",
        textDecoration: "none",
        boxSizing: "border-box",
      }}
    >
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "6px", alignSelf: "flex-start",
        background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)",
        borderRadius: "20px", padding: "4px 10px", fontSize: "0.62rem", fontWeight: 800,
        color: "#FFFFFF", letterSpacing: "0.02em",
      }}>
        베타 기간 모든 기능 무료
      </span>
      <div>
        <p style={{ fontSize: "0.95rem", fontWeight: 800, color: "#FFFFFF", margin: "0 0 6px", lineHeight: 1.4 }}>
          다른 예술가의 포퐄을 보고 계신가요?
        </p>
        <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.45 }}>
          이제 내 작업도 하나의 페이지로 정리해보세요.
        </p>
      </div>
      <span
        className="btn-lime"
        style={{
          alignSelf: "flex-start",
          padding: "10px 18px",
          borderRadius: "999px",
          fontSize: "0.78rem",
          fontWeight: 800,
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        무료로 내 POPOK 만들기 <span>→</span>
      </span>
    </Link>
  );
}
