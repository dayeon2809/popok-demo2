"use client";

import { useState } from "react";

const FALLBACK_IMAGE = "/images/placeholders/cake-placeholder.png";
const COLLAPSED_HEIGHT = 640;

interface GalleryWork {
  id: string;
  title: string;
  year: string;
  role: string;
  images: string[];
}

interface GalleryItem {
  key: string;
  src: string;
  work: GalleryWork;
}

interface ArtistWorkGalleryProps {
  works: GalleryWork[];
  onSelectWork: (workId: string) => void;
}

// Every image of every work, flattened into one dashboard-style tile grid
// (feature/home-feed-v2) — each image stays linked to its parent work
// (hover caption + click both resolve back to that work), per the "이미지
// 피드의 모든 사진은 원본 작품 데이터와 연결되어야 합니다" requirement.
// Opening a work still goes through the page's existing
// activeWork/WorkDetailModal state — no new detail UI.
//
// Uses a fixed-aspect-ratio CSS grid (not the Home feed's masonry columns)
// so it reads as one bounded dashboard panel — square tiles, even rows —
// rather than a tall, uneven scroll. Also height-capped by default (fade +
// "더 보기" toggle) for the same reason.
export default function ArtistWorkGallery({ works, onSelectWork }: ArtistWorkGalleryProps) {
  const [expanded, setExpanded] = useState(false);
  const items: GalleryItem[] = works
    .map((work) => {
      const src = work.images[0] || "";
      return { key: work.id, src, work };
    })
    .filter((item) => item.src !== "");

  if (items.length === 0) return null;

  const collapsible = !expanded && items.length > 8;

  return (
    <div style={{ position: "relative" }}>
      <div
        className="artist-work-gallery"
        style={collapsible ? { maxHeight: `${COLLAPSED_HEIGHT}px`, overflow: "hidden" } : undefined}
      >
        {items.map((item) => (
          <GalleryTile key={item.key} item={item} onSelectWork={onSelectWork} />
        ))}
      </div>

      {collapsible && (
        <>
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 0, height: "120px",
            background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, #FFFFFF 90%)",
            pointerEvents: "none",
          }} />
          <div style={{ position: "relative", textAlign: "center", marginTop: "-8px" }}>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              style={{
                border: "1px solid var(--border-dark)", background: "#FFFFFF", color: "var(--navy)",
                borderRadius: "999px", padding: "9px 20px", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer",
              }}
            >
              작업 전체 보기 ({items.length})
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function GalleryTile({ item, onSelectWork }: { item: GalleryItem; onSelectWork: (workId: string) => void }) {
  const [failed, setFailed] = useState(false);
  const { work } = item;

  return (
    <button
      type="button"
      onClick={() => onSelectWork(work.id)}
      className="artist-work-gallery-tile"
      style={{
        display: "block", width: "100%", padding: 0, border: "none", background: "#EAE6DD",
        cursor: "pointer", position: "relative", overflow: "hidden", borderRadius: "8px",
        aspectRatio: "1", // fixed tile — see the note above on grid vs. masonry
      }}
    >
      <img
        src={failed ? FALLBACK_IMAGE : item.src}
        alt={work.title}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div className="artist-work-gallery-overlay">
        {work.title && <span className="artist-work-gallery-overlay-title">{work.title}</span>}
        <span className="artist-work-gallery-overlay-meta">{[work.year, work.role].filter(Boolean).join(" · ")}</span>
      </div>
    </button>
  );
}
