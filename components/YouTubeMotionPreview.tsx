"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { extractYouTubeVideoId, getYouTubeEmbedUrl } from "@/lib/youtube";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeApi() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });

  return youtubeApiPromise;
}

interface YouTubeMotionPreviewProps {
  videoUrl?: string | null;
  videoId?: string | null;
  title?: string;
  previewStart?: number;
  previewEnd?: number;
  aspectRatio?: "16 / 9" | "9 / 16";
  playMode?: "always" | "hover" | "in-view";
  fallback?: React.ReactNode;
  fill?: boolean;
}

export default function YouTubeMotionPreview({
  videoUrl,
  videoId,
  title = "YouTube motion preview",
  previewStart = 0,
  previewEnd = 15,
  aspectRatio = "16 / 9",
  playMode = "in-view",
  fallback,
  fill = false,
}: YouTubeMotionPreviewProps) {
  const reactId = useId().replace(/:/g, "");
  const playerHostId = `youtube-motion-preview-${reactId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const loopTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [visible, setVisible] = useState(playMode === "always");
  const [hovered, setHovered] = useState(false);
  const resolvedVideoId = videoId || extractYouTubeVideoId(videoUrl);
  const shouldPlay = Boolean(resolvedVideoId) && (playMode === "always" || (playMode === "hover" ? hovered : visible));

  const embedUrl = useMemo(() => {
    if (!resolvedVideoId) return "";
    return getYouTubeEmbedUrl({
      videoId: resolvedVideoId,
      start: previewStart,
      end: previewEnd,
      autoplay: shouldPlay,
      mute: true,
      controls: false,
      enableJsApi: true,
    });
  }, [previewEnd, previewStart, resolvedVideoId, shouldPlay]);

  useEffect(() => {
    if (playMode !== "in-view" || !containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio > 0.35),
      { threshold: [0, 0.35, 0.75] }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [playMode]);

  useEffect(() => {
    if (!resolvedVideoId) return;
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return;
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player(playerHostId, {
        videoId: resolvedVideoId,
        playerVars: {
          autoplay: shouldPlay ? 1 : 0,
          mute: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          start: previewStart,
          end: previewEnd,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event: any) => {
            event.target.mute();
            event.target.seekTo(previewStart, true);
            if (shouldPlay) event.target.playVideo();
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT?.PlayerState?.ENDED && shouldPlay) {
              event.target.seekTo(previewStart, true);
              event.target.playVideo();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [playerHostId, previewEnd, previewStart, resolvedVideoId, shouldPlay]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player?.playVideo) return;

    if (shouldPlay) {
      player.mute?.();
      player.seekTo?.(previewStart, true);
      player.playVideo?.();
      if (loopTimerRef.current) clearInterval(loopTimerRef.current);
      loopTimerRef.current = setInterval(() => {
        const current = typeof player.getCurrentTime === "function" ? player.getCurrentTime() : previewStart;
        if (current >= previewEnd - 0.15 || current < previewStart) {
          player.seekTo(previewStart, true);
          player.playVideo();
        }
      }, 400);
    } else {
      player.pauseVideo?.();
      if (loopTimerRef.current) clearInterval(loopTimerRef.current);
      loopTimerRef.current = null;
    }

    return () => {
      if (loopTimerRef.current) clearInterval(loopTimerRef.current);
      loopTimerRef.current = null;
    };
  }, [previewEnd, previewStart, shouldPlay]);

  if (!resolvedVideoId) {
    return <>{fallback}</>;
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        height: fill ? "100%" : undefined,
        aspectRatio: fill ? undefined : aspectRatio,
        position: "relative",
        overflow: "hidden",
        background: "#111",
      }}
    >
      <iframe
        id={playerHostId}
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        style={{
          position: "absolute",
          inset: 0,
          width: aspectRatio === "9 / 16" ? "315%" : "100%",
          height: aspectRatio === "9 / 16" ? "100%" : "115%",
          left: aspectRatio === "9 / 16" ? "-107.5%" : 0,
          top: aspectRatio === "9 / 16" ? 0 : "-7.5%",
          border: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
