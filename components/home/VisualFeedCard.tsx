"use client";

import { useState } from "react";
import Link from "next/link";
import type { FeedItem } from "@/lib/homeFeedPrototype";
import FeedVideoTile from "@/components/FeedVideoTile";
import FeedCtaCard from "./FeedCtaCard";

const FALLBACK_IMAGE = "/images/placeholders/cake-placeholder.png";

interface VisualFeedCardProps {
  item: FeedItem;
  /** Only used for kind:"cta" items — see FeedCtaCard. */
  onCtaClick?: () => void;
  ctaHref?: string;
}

// Image-only masonry card — no caption at rest (per the V2 prototype spec:
// the card IS the image). Desktop hover reveals a minimal name + arrow
// overlay for real items only; placeholder/prototype filler is never
// clickable and never shows an overlay, so it can't be mistaken for real
// artist/company content.
export default function VisualFeedCard({ item, onCtaClick, ctaHref }: VisualFeedCardProps) {
  const [failed, setFailed] = useState(false);

  if (item.kind === "cta") {
    return <FeedCtaCard href={ctaHref || "/auth"} onClick={onCtaClick} />;
  }
  const isReal = item.source === "real";
  const clickable = isReal && Boolean(item.href);
  const isVideo = item.kind === "artist-video" || item.kind === "company-video";

  const image = isVideo && item.videoUrl ? (
    <FeedVideoTile videoUrl={item.videoUrl} poster={item.src} title={item.name} />
  ) : (
    <img
      src={failed ? FALLBACK_IMAGE : item.src}
      alt={isReal && item.name ? item.name : ""}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ display: "block", width: "100%", height: "auto" }}
    />
  );

  const content = (
    <div
      className="visual-feed-card"
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        borderRadius: "6px",
        background: "#EAE6DD",
        breakInside: "avoid",
        marginBottom: "var(--feed-gap, 10px)",
      }}
    >
      {image}
      {clickable && item.name && (
        <div className="visual-feed-card-overlay" aria-hidden="true">
          <span className="visual-feed-card-overlay-name">{item.name}</span>
          <span className="visual-feed-card-overlay-arrow">→</span>
        </div>
      )}
    </div>
  );

  if (!clickable) {
    // Placeholder filler: intentionally inert — no href, no hover state.
    return content;
  }

  if (item.href!.startsWith("http")) {
    return (
      <a href={item.href!} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        {content}
      </a>
    );
  }

  return (
    <Link href={item.href!} style={{ textDecoration: "none" }}>
      {content}
    </Link>
  );
}
