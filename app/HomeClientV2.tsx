"use client";

import { useEffect, useMemo, useState } from "react";
import CompanyDiscoveryPrototype from "@/components/company/CompanyDiscoveryPrototype";
import { useRouter } from "next/navigation";
import type { Artist, Company } from "@/types";
import type { InstagramStory } from "@/lib/instagram";
import { buildRealFeedItems, padWithPlaceholders, insertFeedCta } from "@/lib/homeFeedPrototype";
import HomeVisualFeed from "@/components/home/HomeVisualFeed";
import AiDiscoveryPrototype from "@/components/ai/AiDiscoveryPrototype";
import FAQSection from "@/components/FAQSection";
import HomeHeroV2 from "@/components/home/HomeHeroV2";
import ServiceValueSection from "@/components/home/ServiceValueSection";
import HomeUseCasesSection from "@/components/home/HomeUseCasesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FooterCTA from "@/components/home/FooterCTA";
import { getHeroCta } from "@/lib/heroCta";
import { analytics } from "@/lib/analytics";
import { useLanguage } from "@/lib/useLanguage";
import { localizePath } from "@/lib/i18n/locale";

// V2 Home — PROTOTYPE (feature/home-feed-v2 only). Replaces the sectioned
// landing page (Hero / service intro / artist carousel / company carousel /
// performance carousel) with a single Pinterest-style image feed, per the
// home-feed-v2 brief. app/HomeClient.tsx (the original) is left completely
// untouched — swap the import back in app/page.tsx to restore it.
//
// Every real feed image already existed in the props the V1 homepage used
// (see app/page.tsx) — no new data fetching, no schema/API changes. When
// there isn't enough real content to fill a dense grid, prototype-only
// placeholder graphics are appended (see lib/homeFeedPrototype.ts).
const FEED_DENSITY_TARGET = 48;

// Top-level field categories — matches the original /artists directory's
// CATEGORIES (ALL/DANCE/MUSIC/VISUAL). artist.field is already normalized to
// one of these three by lib/artists.ts's mapArtistRowToArtist, so this is a
// plain field match rather than the finer-grained (and much noisier)
// per-artist genre string.
const FIELD_OPTIONS = [
  { key: "dance", label: "DANCE" },
  { key: "music", label: "MUSIC" },
  { key: "visual", label: "VISUAL" },
  { key: "actor", label: "ACTOR" },
];

interface HomeClientV2Props {
  initialArtists: Artist[];
  initialCompanies: Company[];
  initialWeeklyStories: InstagramStory[];
  isLoggedIn: boolean;
  myArtistSlug: string | null;
}

export default function HomeClientV2({
  initialArtists,
  initialCompanies,
  isLoggedIn,
  myArtistSlug,
}: HomeClientV2Props) {
  const router = useRouter();
  const { language } = useLanguage();
  const en = language === "en";
  const [selectedField, setSelectedField] = useState("all");
  const [feedSeed, setFeedSeed] = useState(0);

  useEffect(() => {
    setFeedSeed(Date.now() + Math.floor(Math.random() * 100000));
  }, []);
  const [exploreMode, setExploreMode] = useState<"artists" | "companies">("artists");

  // Single source of truth for "where does the primary create-a-POPOK CTA
  // go" — logged out -> /auth, logged in without a profile -> /onboarding,
  // logged in with one -> /my-popok. Same helper the V1 landing page and
  // About page Hero use (lib/heroCta.ts), just with the conversion-focused
  // copy below overriding the label.
  const heroCta = getHeroCta(isLoggedIn, myArtistSlug);
  const localizedHeroCta = { ...heroCta, href: localizePath(heroCta.href, language) };

  // "작업 올리기" — checks login before anything else (section 3 of the
  // upload-first brief). Logged out: through /auth's existing safe-redirect
  // plumbing (lib/safeRedirect.ts) so the user lands back in upload mode
  // right after signing in/up. Logged in: straight to the dashboard's Quick
  // Upload panel.
  const handleUploadClick = () => {
    const uploadPath = "/my-popok?upload=1";
    router.push(isLoggedIn ? uploadPath : `/auth?redirect=${encodeURIComponent(uploadPath)}`);
  };

  const handleScrollToFeed = () => {
    document.getElementById("home-explore")?.scrollIntoView({ behavior: "smooth" });
  };

  const publishedArtists = useMemo(
    () => initialArtists.filter((artist) => artist.status === "published" || !artist.status),
    [initialArtists]
  );

  // Real, published artist used by the homepage hero card.
  const heroArtist = useMemo(() => {
    const withImage = publishedArtists.filter((artist) => artist.profile_image_url || artist.profileImage || artist.profile_image_urls?.[0]);
    return withImage.find((artist) => artist.name.replace(/\s/g, "") === "최지안") || withImage[0] || null;
  }, [publishedArtists]);

  const publishedCompanies = useMemo(
    () => initialCompanies.filter((company) => company.status === "published" || !company.status),
    [initialCompanies]
  );

  const feedItems = useMemo(() => {
    if (exploreMode === "companies") {
      const filtered = selectedField === "all" ? publishedCompanies : publishedCompanies.filter((company) => {
        const text = `${company.genre || ""} ${company.category || ""}`.toLowerCase();
        if (selectedField === "dance") return /무용|발레|ballet|dance|안무/.test(text);
        if (selectedField === "music") return /음악|연주|오케스트라|orchestra|밴드|band|music/.test(text);
        if (selectedField === "actor") return /배우|연기|연극|뮤지컬|극단|actor|acting|theatre|theater|musical/.test(text);
        return /미술|시각|설치|사진|media|visual|art|photo/.test(text);
      });
      return insertFeedCta(padWithPlaceholders(buildRealFeedItems([], filtered), FEED_DENSITY_TARGET), 5);
    }
    const isActor = (artist: Artist) => /배우|연기|연극|뮤지컬|actor|acting|theatre|theater/i.test(
      `${artist.field || ""} ${artist.genre || ""} ${artist.role || ""}`
    );
    const filtered = selectedField === "all"
      ? publishedArtists
      : publishedArtists.filter((artist) => selectedField === "actor"
        ? isActor(artist)
        : (artist.field || "dance") === selectedField);
    const randomized = feedSeed === 0 ? filtered : [...filtered].sort((a, b) => {
      const score = (value: string) => {
        let hash = feedSeed;
        for (let i = 0; i < value.length; i += 1) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
        return hash >>> 0;
      };
      return score(String(a.id)) - score(String(b.id));
    });
    return insertFeedCta(padWithPlaceholders(buildRealFeedItems(randomized, []), FEED_DENSITY_TARGET), 5);
  }, [exploreMode, publishedArtists, publishedCompanies, selectedField, feedSeed]);

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh" }}>
      <HomeHeroV2 ctaHref={localizedHeroCta.href} isLoggedIn={isLoggedIn} onSecondaryClick={handleScrollToFeed} heroArtist={heroArtist} />

      <ServiceValueSection />

      <div id="home-explore" style={{ padding: "28px 16px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* 아티스트 / 단체 토글 버튼 */}
        <div className="discovery-toggle-container" role="tablist" aria-label="탐색 대상">
          <button type="button" role="tab" aria-selected={exploreMode === "artists"} className={`discovery-toggle-btn ${exploreMode === "artists" ? "active" : ""}`} onClick={() => { setExploreMode("artists"); setSelectedField("all"); }}>{en ? "Artists" : "아티스트"}</button>
          <button type="button" role="tab" aria-selected={exploreMode === "companies"} className={`discovery-toggle-btn ${exploreMode === "companies" ? "active" : ""}`} onClick={() => { setExploreMode("companies"); setSelectedField("all"); }}>{en ? "Companies" : "단체"}</button>
        </div>


        {exploreMode === "artists" ? <AiDiscoveryPrototype variant="bar" placeholder={en ? "What kind of work or artist are you looking for?" : "어떤 작업이나 아티스트를 찾고 있나요?"} /> : <CompanyDiscoveryPrototype companies={publishedCompanies} placeholder={en ? "What kind of company are you looking for?" : "어떤 작업이나 단체를 찾고 있나요?"} />}

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginTop: "16px" }}>
          <button
            type="button"
            onClick={() => setSelectedField("all")}
            style={{
              padding: "7px 14px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
              border: selectedField === "all" ? "1.5px solid var(--navy)" : "1.5px solid var(--border)",
              background: selectedField === "all" ? "var(--navy)" : "#FFFFFF",
              color: selectedField === "all" ? "#FFFFFF" : "var(--ink-muted)",
            }}
          >
            ALL
          </button>
          {FIELD_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSelectedField(opt.key)}
              style={{
                padding: "7px 14px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                border: selectedField === opt.key ? "1.5px solid var(--navy)" : "1.5px solid var(--border)",
                background: selectedField === opt.key ? "var(--navy)" : "#FFFFFF",
                color: selectedField === opt.key ? "#FFFFFF" : "var(--ink-muted)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <HomeVisualFeed
        items={feedItems.map((item) => ({ ...item, href: item.href ? localizePath(item.href, language) : null }))}
        ctaHref={localizedHeroCta.href}
        onCtaClick={() => analytics.homeCreatePopokClicked("feed_inline", isLoggedIn)}
      />

      {/* "작업 올리기" — floating, doesn't sit inside the feed grid so it never
          disturbs the masonry layout. See handleUploadClick for the
          login-redirect flow. */}
      <button
        type="button"
        onClick={handleUploadClick}
        className="btn-lime"
        style={{
          position: "fixed", right: "20px", bottom: "20px", zIndex: 50,
          padding: "14px 22px", borderRadius: "999px", border: "none",
          fontSize: "0.88rem", fontWeight: 850, cursor: "pointer",
          boxShadow: "0 8px 24px rgba(23,20,17,0.2)",
        }}
      >
        {en ? "Create my POPOK" : "내 포퐄 만들기"}
      </button>

      <HomeUseCasesSection />

      <TestimonialsSection />

      <FooterCTA
        freeBadge={en ? "Creating works, organizing your profile, and sharing your portfolio are currently free." : "현재 작품 등록, AI 이력 정리, 포트폴리오 공유까지 모든 기능을 무료로 사용할 수 있어요."}
        title={en ? <>Bring your artistic practice<br />into one portfolio.</> : <>흩어진 예술 활동을<br />하나의 포트폴리오로.</>}
        description={en ? "Upload your CV to organize your practice and create your own POPOK page." : "이력서만 올리면 AI가 활동 이력을 정리하고, 나만의 POPOK 페이지를 만들어드려요."}
        primaryLabel={en ? "Create my POPOK for free" : "무료로 내 POPOK 만들기"}
        primaryHref={localizedHeroCta.href}
        onPrimaryClick={() => analytics.homeCreatePopokClicked("final_cta", isLoggedIn)}
        secondaryLabel={en ? "Explore artists" : "아티스트 둘러보기"}
      />

      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <FAQSection />
      </div>
    </div>
  );
}
