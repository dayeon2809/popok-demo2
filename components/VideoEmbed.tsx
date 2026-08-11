"use client";

import { extractYouTubeVideoId } from "@/lib/youtube";
import { extractVimeoVideoId, getVimeoEmbedUrl } from "@/lib/videoLinks";
import { getYouTubeEmbedUrl, isDirectVideoUrl } from "@/lib/video";

interface VideoEmbedProps {
  videoUrl: string;
  title?: string;
}

// Plain, full-length video embed with native controls — no autoplay/loop
// preview cropping (unlike components/FeedVideoTile.tsx's motion-profile-
// style silent loop). Used where the video itself is the content being
// watched, e.g. an artist's own intro video, rather than a feed preview.
export default function VideoEmbed({ videoUrl, title = "POPOK video" }: VideoEmbedProps) {
  const youtubeVideoId = extractYouTubeVideoId(videoUrl);
  const vimeoVideoId = extractVimeoVideoId(videoUrl);

  if (youtubeVideoId) {
    return (
      <iframe
        src={getYouTubeEmbedUrl(videoUrl) || `https://www.youtube.com/embed/${youtubeVideoId}`}
        title={title}
        style={{ width: "100%", height: "100%", border: 0 }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (vimeoVideoId) {
    return (
      <iframe
        src={getVimeoEmbedUrl(videoUrl, false) || ""}
        title={title}
        style={{ width: "100%", height: "100%", border: 0 }}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (isDirectVideoUrl(videoUrl)) {
    return <video src={videoUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  }

  return (
    <div style={{ padding: "16px", color: "#FFFFFF", fontSize: "0.8rem", textAlign: "center" }}>
      <a href={videoUrl} target="_blank" rel="noreferrer" style={{ color: "#FFFFFF" }}>
        {videoUrl}
      </a>
    </div>
  );
}
