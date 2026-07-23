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
  featured?: boolean;
}

// The only piece of this feature that needs to be a client component (image
// load-error fallback needs local state) — kept small on purpose so
// WeeklyStories.tsx itself stays a plain presentational mapper.
export default function InstagramStoryCard({ story, featured = false }: InstagramStoryCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <a
      href={story.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className={featured ? "weekly-story-card weekly-story-card--featured" : "weekly-story-card"}
    >
      <div className="weekly-story-thumb">
        <img
          src={imageFailed ? FALLBACK_IMAGE : story.imageUrl}
          alt={story.title}
          onError={() => setImageFailed(true)}
        />
        {(story.mediaType === "VIDEO" || story.mediaType === "REELS") && (
          <span className="weekly-story-play-badge" aria-hidden="true">▶</span>
        )}
      </div>

      <div className="weekly-story-info">
        <span className="mono weekly-story-category">{story.category}</span>
        <h4 className="weekly-story-title">{story.title}</h4>
        {story.excerpt && <p className="weekly-story-excerpt">{story.excerpt}</p>}
        <div className="weekly-story-meta">
          <span className="mono weekly-story-date">{formatStoryDate(story.publishedAt)}</span>
          <span className="weekly-story-ig">Instagram ↗</span>
        </div>
      </div>
    </a>
  );
}
