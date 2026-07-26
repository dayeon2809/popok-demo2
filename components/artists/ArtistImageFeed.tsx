"use client";

import { useState } from "react";
import Lightbox from "@/components/Lightbox";

const FALLBACK_IMAGE = "/images/placeholders/cake-placeholder.png";

interface ArtistImageFeedProps {
  images: string[];
}

// Photo/video-thumbnail-first artist page (V2 prototype, feature/home-feed-v2):
// a masonry feed of this artist's own profile + work images, each keeping its
// natural aspect ratio (same column-based approach as the Home V2 feed — see
// .artist-image-feed in globals.css). Clicking a tile opens the existing
// Lightbox component at that index rather than navigating away, since the
// viewer is already on this artist's page. No new data — `images` is derived
// from the same artist.works / profile_image_urls the V1 page already reads.
export default function ArtistImageFeed({ images }: ArtistImageFeedProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(new Set());

  if (images.length === 0) return null;

  return (
    <>
      <div className="artist-image-feed">
        {images.map((src, idx) => (
          <button
            key={`${src}-${idx}`}
            type="button"
            onClick={() => setLightboxIndex(idx)}
            style={{
              display: "block", width: "100%", padding: 0, border: "none", background: "none",
              cursor: "pointer", breakInside: "avoid", marginBottom: "10px", borderRadius: "6px", overflow: "hidden",
            }}
          >
            <img
              src={failedSrcs.has(src) ? FALLBACK_IMAGE : src}
              alt=""
              loading="lazy"
              onError={() => setFailedSrcs((prev) => new Set(prev).add(src))}
              style={{ display: "block", width: "100%", height: "auto" }}
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox images={images} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </>
  );
}
