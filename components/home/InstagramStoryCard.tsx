"use client";

import { useState } from "react";
import type { InstagramStory } from "@/lib/instagram";

const FALLBACK_IMAGE = "/images/placeholders/cake-placeholder.png";

function formatStoryDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

interface InstagramStoryCardProps {
  story: InstagramStory;
}

// The only piece of this feature that needs to be a client component (image
// load-error fallback needs local state) — a full-bleed slide with the
// image as background and caption text overlaid at the bottom, matching a
// swipeable "card news" carousel rather than a small thumbnail grid.
export default function InstagramStoryCard({ story }: InstagramStoryCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <a href={story.permalink} target="_blank" rel="noopener noreferrer" className="news-slide">
      <img
        src={imageFailed ? FALLBACK_IMAGE : story.imageUrl}
        alt={story.title}
        onError={() => setImageFailed(true)}
        className="news-slide-img"
      />
      <div className="news-slide-overlay">
        <span className="news-slide-category">{story.category}</span>
        <h3 className="news-slide-title">{story.title}</h3>
        {story.excerpt && <p className="news-slide-excerpt">{story.excerpt}</p>}
        <div className="news-slide-meta">
          <span>{formatStoryDate(story.publishedAt)}</span>
          <span>Instagram ↗</span>
        </div>
      </div>
    </a>
  );
}
