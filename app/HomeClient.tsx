"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Artist, Performance, Company } from "@/types";
import type { InstagramStory } from "@/lib/instagram";
import { useLanguage } from "@/lib/useLanguage";
import PopokCard from "@/components/PopokCard";
import ArtistCarousel from "@/components/home/ArtistCarousel";
import CompanyCarousel from "@/components/home/CompanyCarousel";
import PerformanceCarousel from "@/components/home/PerformanceCarousel";
import WeeklyStories from "@/components/home/WeeklyStories";
import TestimonialsPreview from "@/components/home/TestimonialsPreview";
import FAQSection from "@/components/FAQSection";
import FooterCTA from "@/components/home/FooterCTA";
import StatsCTA from "@/components/home/StatsCTA";

// "이주의 소식" is fully implemented (lib/instagram.ts + WeeklyStories) but
// @popok.official's Instagram API access isn't set up yet — flip this to
// true once INSTAGRAM_ACCESS_TOKEN/INSTAGRAM_USER_ID are ready in production.
const WEEKLY_STORIES_ENABLED = false;

const HOME_COPY = {
  ko: {
    eyebrow: "POPOK FOR CREATORS",
    heroSubhead: "당신의 작업이 하나로 연결됩니다.",
    heroBody:
      "POPOK은 공연예술인을 위한 디지털 명함이자 포트폴리오입니다. 프로필, 프로젝트, 경력, 링크를 하나의 주소에 모아 당신의 작업을 더 쉽게 보여주세요.",
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
      "POPOK is a digital business card and portfolio platform for performing artists. Gather your profile, projects, experiences, and links into one single link. Showcase yourself instantly.",
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
  initialCompanies: Company[];
  initialWeeklyStories: InstagramStory[];
  instagramConfigured: boolean;
}

export default function HomeClient({ initialArtists, initialPerformances, initialCompanies, initialWeeklyStories, instagramConfigured }: HomeClientProps) {
  const { language } = useLanguage();
  const t = HOME_COPY[language];

  // Calculate dynamic stats from actual dataset
  const totalArtists = initialArtists.length;
  const individualArtists = initialArtists.filter(a => a.type === "individual").length;
  const organizations = initialArtists.filter(a => a.type === "company" || a.type === "project_group").length;
  const totalWorks = initialArtists.reduce((acc, artist) => {
    const worksList = artist.works || artist.portfolio_works || [];
    return acc + (Array.isArray(worksList) ? worksList.length : 0);
  }, 0);
  
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

  // 4. 당신과 연결될 단체: Sorted by createdAt descending
  const newCompanies = useMemo(() => {
    return [...initialCompanies]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 6);
  }, [initialCompanies]);

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh", overflowX: "hidden" }}>
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
                borderRadius: "999px",
                fontSize: "0.95rem",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}>
                {t.getMyPopok} <span style={{ fontSize: "1.1rem" }}>→</span>
              </Link>
              <Link href="/about" className="btn-outline" style={{
                textDecoration: "none",
                padding: "16px 32px",
                borderRadius: "999px",
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
              /* Single static placeholder — shown only when there are no published
                 artists with a profile image yet. One dominant visual, matching the
                 real-artist branch above, instead of a two-card + QR-badge stack. */
              <div className="hero-float-card" style={{
                width: "270px",
                background: "#FFFFFF",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                overflow: "hidden",
                boxShadow: "0 16px 40px rgba(23, 20, 17, 0.06)",
                zIndex: 2,
              }}>
                <div style={{ width: "100%", aspectRatio: "4 / 5", background: "#FAF9F5" }} />
                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.02em" }}>JIAN CHOI</h3>
                    <span className="mono" style={{ fontSize: "0.6rem", color: "var(--accent-dark)", fontWeight: 700 }}>Choreographer</span>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.4, marginBottom: "12px" }}>
                    {t.sampleBio}
                  </p>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    paddingTop: "10px", borderTop: "1px solid var(--border)",
                    fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)",
                  }}>
                    <span>{t.viewWorks}</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. 새롭게 등록된 예술가 (NEW ARTISTS) ── */}
      <ArtistCarousel
        title="✨ 새롭게 등록된 예술가"
        subtitle="새로운 아이디어를 확장해나가는 신진 크리에이터입니다."
        artists={newArtists}
        showNewBadge={true}
      />

      {/* ── 3. 이번 주 공연 (PERFORMANCE CAROUSEL) ── */}
      <PerformanceCarousel
        title="🎭 POPOK 아티스트의 공연"
        subtitle="POPOK에 등록된 아티스트와 단체의 새로운 공연을 만나보세요."
        performances={initialPerformances}
      />

      {/* ── 3.5. 이주의 소식 (INSTAGRAM WEEKLY STORIES) ──
          Implementation is done (lib/instagram.ts + this component), but
          @popok.official's Instagram API access isn't set up yet — kept
          hidden on the homepage until INSTAGRAM_ACCESS_TOKEN/INSTAGRAM_USER_ID
          are ready. Flip WEEKLY_STORIES_ENABLED to true (below) to launch it;
          no other code changes needed. */}
      {WEEKLY_STORIES_ENABLED && (
        <WeeklyStories stories={initialWeeklyStories} configured={instagramConfigured} />
      )}

      {/* ── 4. 당신과 연결될 단체 (COMPANIES) ── */}
      <CompanyCarousel
        title="🏢 당신과 연결될 단체"
        subtitle="공연예술 단체와 프로젝트를 만나보세요."
        companies={newCompanies}
      />

      {/* ── 5. Artist DB 현황 (STATS CTA) ── */}
      <StatsCTA
        totalArtists={totalArtists}
        individualArtists={individualArtists}
        organizations={organizations}
        totalWorks={totalWorks}
      />

      {/* ── 6. FOOTER CTA ── */}
      <FooterCTA />

      {/* ── 7. 이용후기 (TESTIMONIALS) ── */}
      <TestimonialsPreview />

      {/* ── 8. FAQ ── */}
      <FAQSection />
    </div>
  );
}
