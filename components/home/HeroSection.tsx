"use client";

import Link from "next/link";
import type { Artist } from "@/types";
import type { Language } from "@/lib/useLanguage";
import FlippingArtistCard from "./FlippingArtistCard";

interface HeroSectionProps {
  language: Language;
  heroArtist: Artist | null;
  ctaHref: string;
  ctaLabel: string;
}

const COPY = {
  ko: {
    badge: "공연예술인을 위한 POPOK 에이전시",
    titleLine1: "창작은 당신이.",
    titleLine2: "나머지는 POPOK이.",
    body: "포트폴리오 제작부터 공연 홍보, 콘텐츠 제작, 활동 관리까지.\n예술인의 활동을 더 많은 기회로 연결합니다.",
    secondaryCta: "아티스트 둘러보기",
  },
  en: {
    badge: "A portfolio & activity platform for performing artists",
    titleLine1: "You focus on creating.",
    titleLine2: "POPOK takes care of the rest.",
    body: "From portfolios to performance promotion, content, and ongoing updates —\nwe connect your work to more opportunities.",
    secondaryCta: "Explore Artists",
  },
};

// Hero visual when there's no published artist yet to feature (should be rare
// in production) — a static mockup so the hero never renders empty.
function HeroFallbackVisual() {
  return (
    <>
      <div className="float-card-2 hero-float-card" style={{
        position: "absolute",
        width: "250px",
        height: "360px",
        background: "var(--accent)",
        border: "1.5px solid var(--navy)",
        borderRadius: "18px",
        padding: "24px",
        boxShadow: "0 8px 32px rgba(23, 20, 17, 0.08)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        zIndex: 1,
        transform: "rotate(6deg) translateX(40px)",
      }}>
        <div style={{ fontWeight: 950, fontSize: "1.2rem", color: "var(--navy)", letterSpacing: "-0.04em", display: "flex", alignItems: "center", gap: "2px" }}>
          POPOK
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "var(--navy)" }} />
        </div>
        <p style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--navy)", lineHeight: 1.25, letterSpacing: "-0.03em" }}>
          당신의 활동이<br />기록됩니다.
        </p>
        <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--navy)", fontWeight: 700 }}>
          popok.kr
        </div>
      </div>

      <div className="float-card-1 hero-float-card" style={{
        position: "absolute",
        width: "250px",
        height: "360px",
        background: "#FFFFFF",
        border: "1.5px solid var(--border)",
        borderRadius: "18px",
        padding: "16px",
        boxShadow: "0 16px 40px rgba(23, 20, 17, 0.08)",
        display: "flex",
        flexDirection: "column",
        zIndex: 2,
        transform: "rotate(-3deg) translateX(-40px)",
      }}>
        <div style={{ width: "100%", height: "200px", borderRadius: "12px", overflow: "hidden", marginBottom: "16px", background: "#EAE6DD" }} />
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.02em" }}>POPOK ARTIST</h3>
              <span className="mono" style={{ fontSize: "0.62rem", color: "var(--accent-dark)", fontWeight: 700 }}>CREATIVE</span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.4 }}>
              작품, 공연, 이력이 하나의 포트폴리오로 정리됩니다.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--border)", fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)" }}>
            <span>포트폴리오 보기</span>
            <span>→</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default function HeroSection({ language, heroArtist, ctaHref, ctaLabel }: HeroSectionProps) {
  const t = COPY[language];

  return (
    <section id="about" className="home-section home-hero-section" style={{
      maxWidth: "1120px",
      margin: "0 auto",
      padding: "72px 32px 96px",
    }}>
      <div className="responsive-stack-320" style={{
        display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr",
        gap: "48px",
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
            marginBottom: "24px",
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-dark)", display: "inline-block" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)", letterSpacing: "0.02em" }}>
              {t.badge}
            </span>
          </div>

          <h1 className="display" style={{
            fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
            color: "var(--navy)",
            lineHeight: 1.18,
            marginBottom: "24px",
            fontWeight: 900,
            letterSpacing: "-0.04em",
          }}>
            {t.titleLine1}<br />
            <span className="seen-highlight">{t.titleLine2}</span>
          </h1>

          <p style={{
            fontSize: "clamp(1rem, 2vw, 1.15rem)",
            color: "var(--ink-muted)",
            fontWeight: 600,
            lineHeight: 1.65,
            maxWidth: "520px",
            marginBottom: "40px",
            whiteSpace: "pre-line",
          }}>
            {t.body}
          </p>

          <div className="hero-cta-actions cta-row" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href={ctaHref} className="btn-lime" style={{
              textDecoration: "none",
              padding: "16px 32px",
              borderRadius: "999px",
              fontSize: "0.95rem",
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}>
              {ctaLabel} <span style={{ fontSize: "1.1rem" }}>→</span>
            </Link>
            <Link href="/artists" className="btn-outline" style={{
              textDecoration: "none",
              padding: "16px 32px",
              borderRadius: "999px",
              fontSize: "0.95rem",
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
            }}>
              {t.secondaryCta}
            </Link>
          </div>
        </div>

        {/* Right: visual — a real POPOK artist card when one exists, otherwise a mockup */}
        <div className="hero-visual-stage" style={{
          position: "relative",
          height: "480px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg style={{ position: "absolute", width: "100%", height: "100%", top: 0, left: 0, zIndex: 0, pointerEvents: "none" }}>
            <circle cx="50%" cy="50%" r="180" fill="none" stroke="rgba(200, 238, 82, 0.4)" strokeWidth="1" />
            <line x1="10%" y1="20%" x2="90%" y2="80%" stroke="rgba(200, 238, 82, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="90%" y1="20%" x2="10%" y2="80%" stroke="rgba(200, 238, 82, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
          </svg>

          {heroArtist ? (
            <div className="float-card-1 hero-artist-card" style={{ width: "270px", zIndex: 2 }}>
              <div className="hero-card-scale">
                <FlippingArtistCard
                  name={heroArtist.name}
                  nameEn={heroArtist.name_en || undefined}
                  genre={heroArtist.genre || "CREATIVE"}
                  instagram={heroArtist.instagram || ""}
                  id={heroArtist.id}
                  slug={heroArtist.slug || heroArtist.id}
                  profileImage={heroArtist.profileImage || undefined}
                />
              </div>
            </div>
          ) : (
            <HeroFallbackVisual />
          )}
        </div>
      </div>
    </section>
  );
}
