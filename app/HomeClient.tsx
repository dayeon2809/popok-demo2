"use client";

import { useMemo } from "react";
import type { Artist, Performance, Company } from "@/types";
import type { InstagramStory } from "@/lib/instagram";
import { useLanguage } from "@/lib/useLanguage";
import { getHeroCta } from "@/lib/heroCta";
import HeroSection from "@/components/home/HeroSection";
import ServiceValueSection from "@/components/home/ServiceValueSection";
import ArtistSupportSection from "@/components/home/ArtistSupportSection";
import ComparisonSection from "@/components/home/ComparisonSection";
import ArtistPreviewCarousel from "@/components/home/ArtistPreviewCarousel";
import PerformanceCarousel from "@/components/home/PerformanceCarousel";
import ContentCarousel from "@/components/home/ContentCarousel";
import FooterCTA from "@/components/home/FooterCTA";
import FAQSection from "@/components/FAQSection";

interface HomeClientProps {
  initialArtists: Artist[];
  initialPerformances: Performance[];
  initialCompanies: Company[];
  initialWeeklyStories: InstagramStory[];
  isLoggedIn: boolean;
  myArtistSlug: string | null;
}

export default function HomeClient({
  initialArtists,
  initialPerformances,
  initialWeeklyStories,
  isLoggedIn,
  myArtistSlug,
}: HomeClientProps) {
  const { language } = useLanguage();
  const showDraft = process.env.NEXT_PUBLIC_SHOW_DRAFT_ARTISTS === "true";
  const baseArtists = useMemo(() => {
    return initialArtists.filter(
      (artist) => artist.profileImage && artist.profileImage !== "" && (showDraft || artist.status === "published" || !artist.status)
    );
  }, [initialArtists, showDraft]);

  // The Hero is intentionally deterministic: prefer Choi Jian, then fall back
  // to the first eligible published artist if that profile is unavailable.
  const heroArtist = baseArtists.find((artist) => artist.name.replace(/\s/g, "") === "최지안") || baseArtists[0] || null;

  const activeArtists = useMemo(() => {
    return baseArtists
      .filter((artist) => artist.id !== heroArtist?.id)
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 6);
  }, [baseArtists, heroArtist]);

  const heroCta = getHeroCta(isLoggedIn, myArtistSlug);

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh", overflowX: "hidden" }}>
      <HeroSection language={language} heroArtist={heroArtist} ctaHref={heroCta.href} ctaLabel={heroCta.label} />
      <ServiceValueSection />
      <ArtistSupportSection />
      <ArtistPreviewCarousel
        title="POPOK에서 활동을 이어가는 예술가들"
        subtitle="작품과 이력을 꾸준히 기록하는 POPOK 아티스트를 만나보세요."
        artists={activeArtists}
        moreLink={{ label: "아티스트 전체 보기", href: "/artists" }}
      />
      <ComparisonSection />
      <PerformanceCarousel
        title="POPOK 아티스트의 다가오는 공연"
        subtitle="이번 주 이어지는 공연과 다음 활동을 확인해보세요."
        performances={initialPerformances.slice(2)}
        titleLink={{ label: "월간 공연 일정", href: "/calendar" }}
      />
      <ContentCarousel stories={initialWeeklyStories} />
      <FooterCTA
        title={
          <span className="home-footer-title-copy">
            <span>당신의 활동을</span>
            <span>하나의 포퐄으로.</span>
          </span>
        }
        description={<>작품과 이력을 기록하고,<br />다음 활동까지 계속 이어가세요.</>}
        primaryLabel="내 포퐄 만들기"
        secondaryLabel="아티스트 둘러보기"
      />
      <FAQSection />
    </div>
  );
}