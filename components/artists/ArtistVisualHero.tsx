"use client";

import { getListImageUrl } from "@/lib/imageUrls";

interface HeroWork {
  id: string;
  title: string;
  year: string;
  role: string;
  image: string;
}

interface ArtistVisualHeroProps {
  work: HeroWork | null;
  fallbackImage: string;
  artistName: string;
  onOpenDetail: () => void;
}

// The first thing a visitor sees on the V2 artist page (feature/home-feed-v2):
// one large representative work image, not a profile photo or a paragraph of
// bio. Caption is minimal and only for the linked work — title/year/role +
// a "상세 보기" button that opens the existing work-detail modal
// (WorkDetailModal via the page's activeWork state) — no new detail UI here.
export default function ArtistVisualHero({ work, fallbackImage, artistName, onOpenDetail }: ArtistVisualHeroProps) {
  const image = work?.image || fallbackImage;
  if (!image) return null;

  return (
    <div
      className="artist-visual-hero"
      style={{
        position: "relative", width: "100%", borderRadius: "6px", overflow: "hidden",
        background: "#EAE6DD", border: "1px solid var(--border)",
      }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          .artist-visual-hero-img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .artist-visual-hero { aspect-ratio: 16 / 8; }
          @media (max-width: 640px) {
            .artist-visual-hero { aspect-ratio: 3 / 4; }
          }
        `,
      }} />
      {/* Above the fold — stays eager so the hero is not delayed, but still
          goes through the resize proxy instead of pulling the full original. */}
      <img
        src={getListImageUrl(image, 600)}
        alt={work?.title || artistName}
        className="artist-visual-hero-img"
        decoding="async"
      />

      {work && (work.title || work.year || work.role) && (
        <div
          style={{
            position: "absolute", left: 0, right: 0, bottom: 0,
            padding: "40px 20px 16px",
            background: "linear-gradient(to top, rgba(23,20,17,0.65) 0%, rgba(23,20,17,0) 70%)",
            display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px",
          }}
        >
          <div style={{ minWidth: 0 }}>
            {work.title && (
              <h2 style={{ fontSize: "1.15rem", fontWeight: 900, color: "#FFFFFF", margin: 0, letterSpacing: "-0.01em" }}>
                {work.title}
              </h2>
            )}
            <span className="mono" style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>
              {[work.year, work.role].filter(Boolean).join(" · ")}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenDetail}
            style={{
              flexShrink: 0, background: "rgba(255,255,255,0.9)", color: "var(--navy)", border: "none",
              borderRadius: "999px", padding: "7px 14px", fontSize: "0.72rem", fontWeight: 800, cursor: "pointer",
            }}
          >
            상세 보기
          </button>
        </div>
      )}
    </div>
  );
}
