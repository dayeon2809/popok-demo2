"use client";

import { useEffect, useRef, useState } from "react";
import type { FeedItem } from "@/lib/homeFeedPrototype";
import VisualFeedCard from "./VisualFeedCard";

const BATCH_SIZE = 24;

interface HomeVisualFeedProps {
  items: FeedItem[];
  /** Passed through to any kind:"cta" item in `items` — see lib/homeFeedPrototype.ts's insertFeedCta. */
  onCtaClick?: () => void;
  ctaHref?: string;
}

// Pinterest/Behance-style masonry via CSS columns (see .home-visual-feed in
// globals.css for the responsive column-count breakpoints) — each image
// keeps its own natural aspect ratio (no fixed-height cropping) because the
// <img> in VisualFeedCard is just width:100%/height:auto inside a
// break-inside:avoid wrapper.
//
// Items are revealed in growing batches as the user scrolls (IntersectionObserver
// on a bottom sentinel) rather than mounting the whole feed at once — this is
// the "lazy loading" requirement at the layout level, on top of each <img>'s
// native loading="lazy".
export default function HomeVisualFeed({ items, onCtaClick, ctaHref }: HomeVisualFeedProps) {
  const [visibleCount, setVisibleCount] = useState(Math.min(BATCH_SIZE, items.length));
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(Math.min(BATCH_SIZE, items.length));
  }, [items]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, items.length));
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items.length]);

  const visibleItems = items.slice(0, visibleCount);

  return (
    <div>
      <div className="home-visual-feed">
        {visibleItems.map((item) => (
          <VisualFeedCard key={item.id} item={item} onCtaClick={onCtaClick} ctaHref={ctaHref} />
        ))}
      </div>
      {visibleCount < items.length && <div ref={sentinelRef} style={{ height: "1px" }} aria-hidden="true" />}
    </div>
  );
}
