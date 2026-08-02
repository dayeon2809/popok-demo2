"use client";

import { useEffect, useRef, useState } from "react";
import YouTubeMotionPreview from "@/components/YouTubeMotionPreview";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { extractVimeoVideoId, getVimeoEmbedUrl } from "@/lib/videoLinks";
import { isDirectVideoUrl } from "@/lib/video";

import { getListImageUrl } from "@/lib/imageUrls";
const FALLBACK_IMAGE = "/images/placeholders/cake-placeholder.png";

interface FeedVideoTileProps {
  videoUrl: string;
  poster?: string | null;
  title?: string | null;
  /** "9 / 16" (default) for the vertical masonry feed tiles, "16 / 9" for the artist page's horizontal main-video section. */
  aspectRatio?: "9 / 16" | "16 / 9";
}

// Motion-profile-style video embed — mirrors components/MotionProfile.tsx's
// YouTube/Vimeo/direct-file handling, but as a plain tile (no name/quote
// overlay chrome) and gated by IntersectionObserver so it only plays once
// actually on screen. Used by the home/companies masonry feed
// (components/home/VisualFeedCard.tsx, vertical) and the artist detail
// page's "main video" section (horizontal).
export default function FeedVideoTile({ videoUrl, poster, title, aspectRatio = "9 / 16" }: FeedVideoTileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio > 0.3),
      { threshold: [0, 0.3, 0.6] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const youtubeVideoId = extractYouTubeVideoId(videoUrl);
  const vimeoVideoId = extractVimeoVideoId(videoUrl);
  const isYoutube = Boolean(youtubeVideoId);
  const isVimeo = !isYoutube && Boolean(vimeoVideoId);
  const isDirect = !isYoutube && !isVimeo && isDirectVideoUrl(videoUrl);
  const posterSrc = posterFailed || !poster ? FALLBACK_IMAGE : poster;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio,
        overflow: "hidden",
        background: "#171411",
      }}
    >
      {isYoutube ? (
        <YouTubeMotionPreview
          videoId={youtubeVideoId}
          title={title || "POPOK motion preview"}
          aspectRatio={aspectRatio}
          playMode="in-view"
          fill
          previewStart={0}
          previewEnd={15}
        />
      ) : isVimeo && inView ? (
        <iframe
          src={getVimeoEmbedUrl(videoUrl, true) || ""}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={title || "POPOK motion preview"}
        />
      ) : isDirect && inView ? (
        <video
          src={videoUrl}
          poster={poster || undefined}
          muted
          loop
          autoPlay
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <img
          src={getListImageUrl(posterSrc, 600)}
          alt={title || ""}
          loading="lazy"
          onError={() => setPosterFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
    </div>
  );
}
