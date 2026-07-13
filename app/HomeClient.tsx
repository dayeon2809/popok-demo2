"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Artist, Performance } from "@/types";
import { useLanguage } from "@/lib/useLanguage";
import PopokCard from "@/components/PopokCard";
import ArtistCarousel from "@/components/home/ArtistCarousel";
import PerformanceCarousel from "@/components/home/PerformanceCarousel";
import TestimonialsPreview from "@/components/home/TestimonialsPreview";
import FAQSection from "@/components/FAQSection";
import FooterCTA from "@/components/home/FooterCTA";
import StatsCTA from "@/components/home/StatsCTA";

const HOME_COPY = {
  ko: {
    eyebrow: "POPOK FOR CREATORS",
    heroSubhead: "당신의 작업이 하나로 연결됩니다.",
    heroBody:
      "POPOK은 아티스트와 크리에이터를 위한 디지털 명함이자 포트폴리오입니다. 프로필, 프로젝트, 경력, 링크를 하나의 주소에 모아 당신의 작업을 더 쉽게 보여주세요.",
    getMyPopok: "내 포퐄 만들기",
    seeExamples: "예시 보기",
    backCardTitle: "당신의 작업이\n연결됩니다.",
    sampleBio: "몸의 언어와 공간을 통해 감정의 구조를 탐구합니다.",
    viewWorks: "작품 보기"
  },
  en: {
    eyebrow: "POPOK FOR CREATORS",
    heroSubhead: "Your work, connected.",
    heroBody:
      "POPOK is a digital business card and portfolio platform for artists and creators. Gather your profile, projects, experiences, and links into one single link. Showcase yourself instantly.",
    getMyPopok: "Get my POPOK",
    seeExamples: "See examples",
    backCardTitle: "Your work,\nconnected.",
    sampleBio: "Exploring human emotions through fluid body language and architecture space.",
    viewWorks: "View Works"
  }
};

interface HomeClientProps {
  initialArtists: Artist[];
  initialPerformances: Performance[];
}

export default function HomeClient({ initialArtists, initialPerformances }: HomeClientProps) {
  const { language } = useLanguage();
  const t = HOME_COPY[language];
  const artists = initialArtists;

  // Filter artists who have valid profile images for carousels
  const showDraft = process.env.NEXT_PUBLIC_SHOW_DRAFT_ARTISTS === "true";
  const baseArtists = useMemo(() => {
    return artists.filter(
      (a) => a.profileImage && a.profileImage !== "" && (showDraft || a.status === "published" || !a.status)
    );
  }, [artists, showDraft]);

  // 1. 지금 만나볼 예술가: Shuffled or base subset
  const featuredArtists = useMemo(() => {
    return baseArtists.slice(0, 6);
  }, [baseArtists]);

  // Hero card visual: first featured artist, deterministic (never random —
  // a random pick would differ between the server render and the client's
  // first render and cause a hydration mismatch, same class of bug as the
  // PopokCard href issue fixed earlier).
  const heroArtist = featuredArtists[0] || null;

  // 2. 새롭게 등록된 예술가: Sorted by createdAt descending
  const newArtists = useMemo(() => {
    return [...baseArtists]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 6);
  }, [baseArtists]);

  // 3. 주목받는 예술가: Sorted by updatedAt descending
  const trendingArtists = useMemo(() => {
    return [...baseArtists]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 6);
  }, [baseArtists]);

  return (
    <div style={{ background: "var(--bg-warm)", minHeight: "100vh", overflowX: "hidden" }}>
      {/* ── 1. HERO SECTION (RETAINED) ── */}
      <section id="about" className="home-section" style={{
        maxWidth: "1120px",
        margin: "0 auto",
        padding: "80px 32px 100px",
      }}>
        <div className="responsive-stack-320" style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: "48px",
          alignItems: "center"
        }}>
          {/* Hero Left Content */}
          <div className="fade-up">
            {/* Tagline */}
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
                {t.eyebrow}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="display" style={{
              fontSize: "clamp(2.4rem, 5.5vw, 3.8rem)",
              color: "var(--navy)",
              lineHeight: 1.1,
              marginBottom: "24px",
              fontWeight: 900,
              letterSpacing: "-0.04em"
            }}>
              {language === "ko" ? (
                <>
                  당신의 포트폴리오를,<br />
                  더 가볍게. <span className="seen-highlight">포퐄.</span>
                </>
              ) : (
                <>
                  A new way for artists<br />
                  to be <span className="seen-highlight">seen</span> and remembered.
                </>
              )}
            </h1>

            {/* Secondary Headline / Subtext */}
            <p style={{
              fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
              color: "var(--navy)",
              fontWeight: 700,
              lineHeight: 1.4,
              marginBottom: "12px",
              letterSpacing: "-0.02em"
            }}>
              {t.heroSubhead}
            </p>

            <p style={{
              fontSize: "0.95rem",
              color: "var(--ink-muted)",
              lineHeight: 1.7,
              maxWidth: "520px",
              marginBottom: "40px",
            }}>
              {t.heroBody}
            </p>

            {/* CTA Buttons */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/auth" className="btn-lime" style={{
                textDecoration: "none",
                padding: "16px 32px",
                borderRadius: "12px",
                fontSize: "0.95rem",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(200, 238, 82, 0.2)"
              }}>
                {t.getMyPopok} <span style={{ fontSize: "1.1rem" }}>→</span>
              </Link>
              <Link href="/about" className="btn-outline" style={{
                textDecoration: "none",
                padding: "16px 32px",
                borderRadius: "12px",
                fontSize: "0.95rem",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center"
              }}>
                POPOK 소개 보기
              </Link>
            </div>
          </div>

          {/* Hero Right Visuals */}
          <div className="hero-visual-stage" style={{
            position: "relative",
            height: "480px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              top: 0,
              left: 0,
              zIndex: 0,
              pointerEvents: "none"
            }}>
              <circle cx="50%" cy="50%" r="180" fill="none" stroke="rgba(200, 238, 82, 0.4)" strokeWidth="1" />
              <line x1="10%" y1="20%" x2="90%" y2="80%" stroke="rgba(200, 238, 82, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="90%" y1="20%" x2="10%" y2="80%" stroke="rgba(200, 238, 82, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
            </svg>

            {heroArtist ? (
              /* Real POPOK artist card — first of "지금 만나볼 예술가" (featuredArtists),
                 picked deterministically (never random) so SSR and the client's first
                 render always agree. */
              <div className="float-card-1 hero-artist-card" style={{ width: "270px", zIndex: 2 }}>
                {/* Fixed 270px design-width inner box — on mobile this is shrunk via
                    CSS transform: scale() (see globals.css .hero-card-scale), same
                    technique as the artist carousel cards, so every bit of the card's
                    internal content (fonts, barcode, portfolio URL) scales down
                    uniformly instead of wrapping/clipping at a narrower width. */}
                <div className="hero-card-scale">
                  <PopokCard
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
              <>
                {/* Fallback mockup — shown only when there are no published artists yet */}
                {/* Back Card */}
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
                  transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  cursor: "pointer",
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "rotate(2deg) scale(1.03) translateX(30px)";
                    e.currentTarget.style.zIndex = "3";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "rotate(6deg) translateX(40px)";
                    e.currentTarget.style.zIndex = "1";
                  }}>
                  <div>
                    <div style={{ fontWeight: 950, fontSize: "1.2rem", color: "var(--navy)", letterSpacing: "-0.04em", display: "flex", alignItems: "center", gap: "2px" }}>
                      POPOK
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "var(--navy)" }} />
                    </div>
                  </div>
                  <div>
                    <p style={{
                      fontSize: "1.6rem",
                      fontWeight: 900,
                      color: "var(--navy)",
                      lineHeight: 1.25,
                      letterSpacing: "-0.03em"
                    }}>
                      {t.backCardTitle.split("\n").map((line, index) => (
                        <span key={line}>
                          {line}
                          {index === 0 && <br />}
                        </span>
                      ))}
                    </p>
                  </div>
                  <div style={{
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    color: "var(--navy)",
                    fontWeight: 700,
                    letterSpacing: "-0.01em"
                  }}>
                    popok.kr/jianchoi
                  </div>
                </div>

                {/* Front Card */}
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
                  transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  cursor: "pointer",
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "rotate(0deg) scale(1.03) translateX(-30px)";
                    e.currentTarget.style.zIndex = "3";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "rotate(-3deg) translateX(-40px)";
                    e.currentTarget.style.zIndex = "2";
                  }}>
                  <div style={{
                    width: "100%",
                    height: "200px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    marginBottom: "16px",
                    background: "#EAE6DD",
                    position: "relative"
                  }}>
                    <img
                      src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800"
                      alt="JIAN CHOI"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: "contrast(1.1)"
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                        <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.02em" }}>JIAN CHOI</h3>
                        <span className="mono" style={{ fontSize: "0.62rem", color: "var(--accent-dark)", fontWeight: 700 }}>Choreographer</span>
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.4 }}>
                        {t.sampleBio}
                      </p>
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "8px",
                      borderTop: "1px solid var(--border)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--navy)"
                    }}>
                      <span>{t.viewWorks}</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>

                {/* Circular QR Badge */}
                <div style={{
                  position: "absolute",
                  bottom: "40px",
                  right: "20px",
                  width: "74px",
                  height: "74px",
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  border: "1.5px solid var(--navy)",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 3,
                  transform: "rotate(-12deg)"
                }}>
                  <span style={{ fontSize: "0.45rem", fontWeight: 900, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>SCAN</span>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--navy)" }}>
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  <span style={{ fontSize: "0.45rem", fontWeight: 900, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "3px" }}>SAVE CARD</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. 지금 만나볼 예술가 (FEATURED) ── */}
      <ArtistCarousel
        title="👤 지금 만나볼 예술가"
        subtitle="POPOK 추천 아티스트들을 소개합니다."
        artists={featuredArtists}
      />

      {/* ── 3. 이번 주 공연 (PERFORMANCE CAROUSEL) ── */}
      <PerformanceCarousel
        title="🎭 이번 주 공연"
        subtitle="공연 현장에서 아티스트들의 에너지를 생생하게 느껴보세요."
        performances={initialPerformances}
      />

      {/* ── 4. 새롭게 등록된 예술가 (NEW ARTISTS) ── */}
      <ArtistCarousel
        title="✨ 새롭게 등록된 예술가"
        subtitle="새로운 아이디어를 확장해나가는 신진 크리에이터입니다."
        artists={newArtists}
        showNewBadge={true}
      />

      {/* ── 5. Artist DB 현황 (STATS CTA) ── */}
      <StatsCTA />

      {/* ── 6. FOOTER CTA ── */}
      <FooterCTA />

      {/* ── 7. 이용후기 (TESTIMONIALS) ── */}
      <TestimonialsPreview />

      {/* ── 8. FAQ ── */}
      <FAQSection />
    </div>
  );
}
