"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Artist, Performance, Company } from "@/types";
import type { InstagramStory } from "@/lib/instagram";
import { useLanguage } from "@/lib/useLanguage";
import ArtistCarousel from "@/components/home/ArtistCarousel";
import CompanyCarousel from "@/components/home/CompanyCarousel";
import PerformanceCarousel from "@/components/home/PerformanceCarousel";
import WeeklyStories from "@/components/home/WeeklyStories";
import OpportunitiesSection from "@/components/home/OpportunitiesSection";
import TestimonialsPreview from "@/components/home/TestimonialsPreview";
import FAQSection from "@/components/FAQSection";
import FooterCTA from "@/components/home/FooterCTA";
import StatsCTA from "@/components/home/StatsCTA";

// "이주의 소식" is fully implemented (lib/instagram.ts + WeeklyStories) and
// @popok.official's INSTAGRAM_ACCESS_TOKEN is now configured — only posts
// captioned with #홈노출 show up here, so the account can be run freely.
const WEEKLY_STORIES_ENABLED = true;

const HOME_COPY = {
  ko: {
    eyebrow: "POPOK FOR ARTISTS",
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
    eyebrow: "POPOK FOR ARTISTS",
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
      {/* ── 0. POPOK's NEWS (INSTAGRAM CARD CAROUSEL) ──
          Only posts on @popok.official captioned with #홈노출 show up here
          (see requireHashtag in lib/instagram.ts). Set
          WEEKLY_STORIES_ENABLED to false above to pull it off the homepage
          again without touching any other code. */}
      {WEEKLY_STORIES_ENABLED && (
        <WeeklyStories stories={initialWeeklyStories} configured={instagramConfigured} />
      )}

      {/* ── 1. HERO SECTION (RETAINED) ── */}
      <section id="about" className="home-section" style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "80px 32px 100px",
      }}>
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
      </section>

      {/* ── 2. 새롭게 등록된 예술가 (NEW ARTISTS) ── */}
      <ArtistCarousel
        title="✨ 새롭게 등록된 예술가"
        subtitle="새로운 아이디어를 확장해나가는 신진 크리에이터입니다."
        artists={newArtists}
        showNewBadge={true}
        moreLink={{ label: "더 많은 예술가 만나기", href: "/artists" }}
      />

      {/* ── 3. 당신과 연결될 단체 (COMPANIES) ── */}
      <CompanyCarousel
        title="🏢 당신과 연결될 단체"
        subtitle="공연예술 단체와 프로젝트를 만나보세요."
        companies={newCompanies}
        moreLink={{ label: "나와 맞는 단체 찾기", href: "/companies" }}
      />

      {/* ── 4. 이번 주 공연 (PERFORMANCE CAROUSEL) ── */}
      <PerformanceCarousel
        title="🎭 POPOK 아티스트의 공연"
        subtitle="POPOK에 등록된 아티스트와 단체의 새로운 공연을 만나보세요."
        performances={initialPerformances}
        titleLink={{ label: "월간 공연 일정", href: "/calendar" }}
      />

      {/* ── 4.5. 포퐄이가 주는 기회들 (OPPORTUNITIES) ── */}
      <OpportunitiesSection />

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
