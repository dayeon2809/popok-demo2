"use client";

import Link from "next/link";
import { analytics } from "@/lib/analytics";
import type { Artist } from "@/types";
import FlippingArtistCard from "@/components/home/FlippingArtistCard";

interface HomeHeroV2Props {
  ctaHref: string;
  isLoggedIn: boolean;
  onSecondaryClick: () => void;
  heroArtist: Artist | null;
}

// New conversion-focused Hero for the V2 home feed — reuses the visual
// identity (badge pill, big headline, CTA row, floating-card visual) from
// components/home/HeroSection.tsx (the V1 landing page's Hero, currently
// unused) rather than that component directly, since the copy/CTA behavior
// here is deliberately different: fixed marketing copy instead of
// multi-language strings, and a secondary CTA that scrolls to the feed
// instead of linking to /about.
export default function HomeHeroV2({ ctaHref, isLoggedIn, onSecondaryClick, heroArtist }: HomeHeroV2Props) {
  const heroImage = heroArtist?.profile_image_url || heroArtist?.profileImage || heroArtist?.profile_image_urls?.[0] || "";
  return (
    <section className="home-section home-hero-section" style={{
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
              베타 기간 모든 기능 무료
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
            창작은 당신이.<br />
            <span className="seen-highlight">나머지는 POPOK이.</span>
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

        {/* Right: POPOK identity card visual */}
        <div className="hero-visual-stage" style={{
          position: "relative", height: "480px", display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <svg aria-hidden="true" style={{ position: "absolute", width: "100%", height: "100%", inset: 0, zIndex: 0, pointerEvents: "none" }}>
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
                  profileImage={heroImage || undefined}
                />
              </div>
            </div>
          ) : (
            <div style={{ width: "270px", aspectRatio: "0.68", borderRadius: "18px", border: "1.5px solid var(--navy)", background: "var(--accent)", boxShadow: "0 24px 50px -12px rgba(23,20,17,.15)", transform: "rotate(-3deg)", display: "grid", placeItems: "center", zIndex: 2, fontWeight: 950, fontSize: "1.5rem" }}>POPOK.</div>
          )}
        </div>
      </div>
    </section>
  );
}
