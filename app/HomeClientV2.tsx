"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Artist, Performance, Company } from "@/types";
import type { InstagramStory } from "@/lib/instagram";
import { buildRealFeedItems, padWithPlaceholders } from "@/lib/homeFeedPrototype";
// Performance posters and Instagram/홈노출 posts are intentionally not fed
// into the feed builder below — see the note in lib/homeFeedPrototype.ts.
// initialPerformances/initialWeeklyStories are kept in the prop type (app/page.tsx
// still fetches them, unchanged) but are no longer read by this component.
import HomeVisualFeed from "@/components/home/HomeVisualFeed";
import AiDiscoveryPrototype from "@/components/ai/AiDiscoveryPrototype";
import FAQSection from "@/components/FAQSection";

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

interface HomeClientV2Props {
  initialArtists: Artist[];
  initialPerformances: Performance[];
  initialCompanies: Company[];
  initialWeeklyStories: InstagramStory[];
  isLoggedIn: boolean;
  myArtistSlug: string | null;
}

export default function HomeClientV2({
  initialArtists,
  initialCompanies,
  isLoggedIn,
}: HomeClientV2Props) {
  const router = useRouter();
  const showDraft = process.env.NEXT_PUBLIC_SHOW_DRAFT_ARTISTS === "true";

  // "작업 올리기" — checks login before anything else (section 3 of the
  // upload-first brief). Logged out: through /auth's existing safe-redirect
  // plumbing (lib/safeRedirect.ts) so the user lands back in upload mode
  // right after signing in/up. Logged in: straight to the dashboard's Quick
  // Upload panel.
  const handleUploadClick = () => {
    const uploadPath = "/my-popok?upload=1";
    router.push(isLoggedIn ? uploadPath : `/auth?redirect=${encodeURIComponent(uploadPath)}`);
  };

  const feedItems = useMemo(() => {
    const publishedArtists = initialArtists.filter(
      (artist) => showDraft || artist.status === "published" || !artist.status
    );
    // Show only artists on the artist explore page
    const real = buildRealFeedItems(publishedArtists, []);
    return padWithPlaceholders(real, FEED_DENSITY_TARGET);
  }, [initialArtists, showDraft]);

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh" }}>
      <div style={{ padding: "28px 16px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* 아티스트 / 단체 토글 버튼 */}
        <div className="discovery-toggle-container">
          <Link href="/" className="discovery-toggle-btn active">
            아티스트
          </Link>
          <Link href="/companies" className="discovery-toggle-btn">
            단체
          </Link>
        </div>
        <AiDiscoveryPrototype variant="bar" />
      </div>

      <HomeVisualFeed items={feedItems} />

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
        📸 작업 올리기
      </button>

      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <FAQSection />
      </div>
    </div>
  );
}
