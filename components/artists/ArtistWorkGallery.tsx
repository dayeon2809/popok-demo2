"use client";

import { useState } from "react";
import { getListImageUrl } from "@/lib/imageUrls";

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

// One tile per work (its representative/first image) in a dashboard-style
// grid — the home feed already shows every individual photo flattened
// together (components/home/VisualFeedCard.tsx), so this page keeps the
// distinct "one tile per work" gallery format instead of duplicating that.
// Opening a work still goes through the page's existing
// activeWork/WorkDetailModal state — no new detail UI.
//
// Uses a fixed-aspect-ratio CSS grid (not the Home feed's masonry columns)
// so it reads as one bounded dashboard panel — square tiles, even rows —
// rather than a tall, uneven scroll. Also height-capped by default (fade +
// "더 보기" toggle) for the same reason.
export default function ArtistWorkGallery({ works, onSelectWork }: ArtistWorkGalleryProps) {
  const [expanded, setExpanded] = useState(false);
  const items: GalleryItem[] = works.flatMap((work) =>
    work.images
      .filter(Boolean)
      .map((src, imageIndex) => ({ key: `${work.id}-${imageIndex}`, src, work }))
  );

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
        src={failed ? FALLBACK_IMAGE : getListImageUrl(item.src, 384)}
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
