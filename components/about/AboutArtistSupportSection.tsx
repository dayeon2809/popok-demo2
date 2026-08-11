"use client";

import Link from "next/link";
import { PREMIUM_PLAN, PREMIUM_PLANS } from "@/lib/premiumPlans";

const STUDENT_PLAN = PREMIUM_PLANS.find((p) => p.id === "student")!;

// Free-tier items mirror the Home ArtistSupportSection's non-Premium items
// (kept in sync by hand — see components/home/ArtistSupportSection.tsx) plus
// the artist-directory listing, which isn't gated behind any plan.
const FREE_ITEMS = [
  "나만의 포트폴리오 페이지",
  "작품과 활동 이력 기록",
  "하나의 링크로 포트폴리오 공유",
  "아티스트 및 단체 페이지 연결",
  "POPOK 내 아티스트 탐색 노출",
];

// Premium column is pulled directly from lib/premiumPlans.ts so it can never
// drift from what the actual /premium page and homepage Premium section say.
const PREMIUM_ITEMS = [
  `${STUDENT_PLAN.name} 기능 포함 (${STUDENT_PLAN.features.join(" · ")})`,
  ...PREMIUM_PLAN.features.filter((f) => !f.includes("Student")),
];

export default function AboutArtistSupportSection() {
  return (
    <section className="home-section" style={{
      maxWidth: "1120px",
      margin: "0 auto",
      padding: "80px 32px",
      borderTop: "1px solid var(--border)",
    }}>
      <div style={{ marginBottom: "40px", maxWidth: "640px" }}>
        <h2 className="display" style={{
          fontSize: "clamp(1.7rem, 3.8vw, 2.4rem)",
          color: "var(--navy)",
          fontWeight: 950,
          letterSpacing: "-0.03em",
          margin: "0 0 14px",
        }}>
          POPOK 아티스트 지원
        </h2>
        <p style={{ fontSize: "0.95rem", color: "var(--ink-muted)", fontWeight: 600, lineHeight: 1.65, margin: 0 }}>
          기본 등록만으로도 활동을 기록하고 공유할 수 있어요.
          POPOK Artist는 그 관리를 POPOK 팀이 함께합니다.
        </p>
      </div>

      <div className="responsive-stack-320" style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        alignItems: "stretch",
      }}>
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid var(--border)",
          borderRadius: "18px",
          padding: "28px 26px",
          display: "flex",
          flexDirection: "column",
        }}>
          <span className="mono" style={{ display: "block", marginBottom: "16px", color: "var(--ink-muted)" }}>
            기본 등록 · 무료
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", flexGrow: 1 }}>
            {FREE_ITEMS.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{
                  flexShrink: 0, width: "18px", height: "18px", borderRadius: "50%",
                  border: "1.5px solid var(--border-dark)", marginTop: "1px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.6rem", fontWeight: 900, color: "var(--ink-muted)",
                }}>
                  ✓
                </span>
                <span style={{ fontSize: "0.88rem", color: "var(--navy)", fontWeight: 700, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: "var(--navy)",
          border: "1.5px solid var(--navy)",
          borderRadius: "18px",
          padding: "28px 26px",
          display: "flex",
          flexDirection: "column",
        }}>
          <span className="mono" style={{ display: "block", marginBottom: "16px", color: "var(--accent)" }}>
            POPOK Artist
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", flexGrow: 1 }}>
            {PREMIUM_ITEMS.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{
                  flexShrink: 0, width: "18px", height: "18px", borderRadius: "50%",
                  background: "var(--accent)", marginTop: "1px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.6rem", fontWeight: 900, color: "var(--navy)",
                }}>
                  ✓
                </span>
                <span style={{ fontSize: "0.88rem", color: "#FFFFFF", fontWeight: 700, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
          <Link href="/popok-artist" style={{
            marginTop: "22px",
            textDecoration: "none",
            alignSelf: "flex-start",
            fontSize: "0.85rem",
            fontWeight: 800,
            color: "var(--accent)",
            borderBottom: "1.5px solid var(--accent)",
            paddingBottom: "2px",
          }}>
            POPOK Artist 알아보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}
