"use client";

import Link from "next/link";
import { analytics } from "@/lib/analytics";

interface HomeHeroV2Props {
  ctaHref: string;
  isLoggedIn: boolean;
  onSecondaryClick: () => void;
}

// New conversion-focused Hero for the V2 home feed — reuses the visual
// identity (badge pill, big headline, CTA row, floating-card visual) from
// components/home/HeroSection.tsx (the V1 landing page's Hero, currently
// unused) rather than that component directly, since the copy/CTA behavior
// here is deliberately different: fixed marketing copy instead of
// multi-language strings, and a secondary CTA that scrolls to the feed
// instead of linking to /about.
export default function HomeHeroV2({ ctaHref, isLoggedIn, onSecondaryClick }: HomeHeroV2Props) {
  return (
    <section className="home-section home-hero-section" style={{
      maxWidth: "1120px",
      margin: "0 auto",
      padding: "56px 24px 64px",
    }}>
      <div className="responsive-stack-320" style={{
        display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr",
        gap: "40px",
        alignItems: "center",
      }}>
        {/* Left: copy */}
        <div className="fade-up">
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#FFFFFF",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            padding: "6px 14px",
            marginBottom: "20px",
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-dark)", display: "inline-block" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)", letterSpacing: "0.02em" }}>
              베타 기간 모든 기능 무료
            </span>
          </div>

          <h1 className="display" style={{
            fontSize: "clamp(1.9rem, 5vw, 3rem)",
            color: "var(--navy)",
            lineHeight: 1.22,
            marginBottom: "18px",
            fontWeight: 900,
            letterSpacing: "-0.04em",
          }}>
            흩어진 예술 활동을<br />하나의 포트폴리오로.
          </h1>

          <p style={{
            fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
            color: "var(--ink-muted)",
            fontWeight: 600,
            lineHeight: 1.6,
            maxWidth: "480px",
            marginBottom: "28px",
          }}>
            이력서만 올리면 AI가 활동 이력을 정리하고, 나만의 POPOK 페이지를 만들어드려요.
          </p>

          <div className="cta-row" style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <Link
              href={ctaHref}
              onClick={() => analytics.homeCreatePopokClicked("hero", isLoggedIn)}
              className="btn-lime"
              style={{
                textDecoration: "none",
                padding: "15px 30px",
                borderRadius: "999px",
                fontSize: "0.92rem",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              무료로 내 POPOK 만들기 <span style={{ fontSize: "1.05rem" }}>→</span>
            </Link>
            <button
              type="button"
              onClick={onSecondaryClick}
              className="btn-outline"
              style={{
                padding: "15px 30px",
                borderRadius: "999px",
                fontSize: "0.92rem",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              완성된 포트폴리오 보기
            </button>
          </div>

          <p style={{ marginTop: "14px", fontSize: "0.78rem", color: "var(--ink-faint)", fontWeight: 600 }}>
            가입 무료 · 현재 모든 기능 무료 · 약 3분 소요
          </p>
        </div>

        {/* Right: decorative floating cards — same visual language as the
            V1 Hero's no-artist fallback (components/home/HeroSection.tsx). */}
        <div className="hero-visual-stage" style={{
          position: "relative",
          height: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            position: "absolute", width: "230px", height: "330px",
            background: "var(--accent)", border: "1.5px solid var(--navy)", borderRadius: "18px",
            padding: "22px", boxShadow: "0 8px 32px rgba(23, 20, 17, 0.08)",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            zIndex: 1, transform: "rotate(6deg) translateX(36px)",
          }}>
            <div style={{ fontWeight: 950, fontSize: "1.1rem", color: "var(--navy)", letterSpacing: "-0.04em", display: "flex", alignItems: "center", gap: "2px" }}>
              POPOK
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "var(--navy)" }} />
            </div>
            <p style={{ fontSize: "1.35rem", fontWeight: 900, color: "var(--navy)", lineHeight: 1.25, letterSpacing: "-0.03em" }}>
              당신의 활동이<br />기록됩니다.
            </p>
            <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--navy)", fontWeight: 700 }}>
              popok.kr
            </div>
          </div>

          <div style={{
            position: "absolute", width: "230px", height: "330px",
            background: "#FFFFFF", border: "1.5px solid var(--border)", borderRadius: "18px",
            padding: "16px", boxShadow: "0 16px 40px rgba(23, 20, 17, 0.08)",
            display: "flex", flexDirection: "column", zIndex: 2, transform: "rotate(-3deg) translateX(-36px)",
          }}>
            <div style={{ width: "100%", height: "180px", borderRadius: "12px", overflow: "hidden", marginBottom: "14px", background: "#EAE6DD" }} />
            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.02em" }}>POPOK ARTIST</h3>
                  <span className="mono" style={{ fontSize: "0.6rem", color: "var(--accent-dark)", fontWeight: 700 }}>CREATIVE</span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", lineHeight: 1.4 }}>
                  작품, 공연, 이력이 하나의 포트폴리오로 정리됩니다.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--border)", fontSize: "0.72rem", fontWeight: 700, color: "var(--navy)" }}>
                <span>포트폴리오 보기</span>
                <span>→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
