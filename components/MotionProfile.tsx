"use client";

import { useState, useEffect, useRef } from "react";
import YouTubeMotionPreview from "./YouTubeMotionPreview";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { extractVimeoVideoId, getVimeoEmbedUrl } from "@/lib/videoLinks";
import { isDirectVideoUrl } from "@/lib/video";

interface MotionProfileProps {
  name: string;
  genre: string | null;
  image: string;
  quote?: string;
  videoUrl?: string;
}

export default function MotionProfile({ name, genre, image, quote, videoUrl }: MotionProfileProps) {
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const youtubeVideoId = extractYouTubeVideoId(videoUrl);
  const vimeoVideoId = extractVimeoVideoId(videoUrl);

  const isYoutube = Boolean(youtubeVideoId);
  const isVimeo = Boolean(vimeoVideoId);
  const isDirect = isDirectVideoUrl(videoUrl) && !videoError;

  // Time progress bar loops automatically for static images / youtube embeds / vimeo
  useEffect(() => {
    if (isDirect) return; // handled by HTML5 onTimeUpdate
    if (!playing) return;

    const intervalTime = 100; // update every 100ms
    const totalDuration = 15000; // 15 seconds
    const increment = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [playing, isDirect]);

  // Video playhead play/pause synchronization for direct MP4 videos
  useEffect(() => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.play().catch((e) => console.log("Muted autoplay blocked or interrupted", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [playing, isDirect]);

  const togglePlay = () => {
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(pct);
    }
  };

  const displayQuote = quote || "예술을 통해 세상과 소통하고 나만의 움직임을 연결합니다.";
  const pausedYoutubePoster = youtubeVideoId ? `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg` : image;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      {/* 9:16 Container Card */}
      <div 
        onClick={togglePlay}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "320px",
          aspectRatio: "9 / 16",
          background: "var(--navy)",
          borderRadius: "20px",
          border: "2px solid var(--navy)",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(23, 20, 17, 0.15)",
          cursor: "pointer",
          userSelect: "none"
        }}
      >
        
        {/* Background Visual Container */}
        <div style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          background: "#171411"
        }}>
          {isYoutube ? (
            playing ? (
              <div style={{ width: "100%", height: "100%", filter: "contrast(1.1) brightness(0.95)" }}>
                <YouTubeMotionPreview
                  videoId={youtubeVideoId!}
                  title={`${name} representative video`}
                  aspectRatio="9 / 16"
                  playMode="always"
                  fill
                  previewStart={0}
                  previewEnd={15}
                />
              </div>
            ) : (
              <img
                src={pausedYoutubePoster}
                alt={`${name} Motion Profile`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "contrast(1.15) brightness(0.95)",
                }}
              />
            )
          ) : isVimeo ? (
            playing ? (
              <div style={{ width: "100%", height: "100%", filter: "contrast(1.1) brightness(0.95)" }}>
                <iframe
                  src={getVimeoEmbedUrl(videoUrl, true) || ""}
                  style={{ width: "100%", height: "100%", border: 0 }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={`${name} representative video`}
                />
              </div>
            ) : (
              <div style={{ width: "100%", height: "100%", background: "#171411", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={image}
                  alt={`${name} Motion Profile`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "contrast(1.15) brightness(0.95)",
                  }}
                />
              </div>
            )
          ) : isDirect ? (
            <video
              ref={videoRef}
              src={videoUrl}
              poster={image}
              muted
              loop
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.1) brightness(0.95)",
              }}
              onTimeUpdate={handleTimeUpdate}
              onError={() => {
                console.log("Motion Profile Video failed to load, falling back to image preview.");
                setVideoError(true);
              }}
            />
          ) : (
            <img
              src={image}
              alt={`${name} Motion Profile`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "contrast(1.15) brightness(0.95)",
                transform: playing ? "scale(1.15) translate(10px, -5px)" : "scale(1) translate(0, 0)",
                transition: "transform 15s linear infinite alternate",
                animation: playing ? "slowZoomMotion 15s linear infinite alternate" : "none"
              }}
            />
          )}
        </div>

        {/* CSS Keyframes for slow zoom animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes slowZoomMotion {
            0% { transform: scale(1.05) translate(0px, 0px); }
            50% { transform: scale(1.18) translate(-10px, 8px); }
            100% { transform: scale(1.1) translate(5px, -5px); }
          }
          @keyframes soundWaveMove {
            0%, 100% { height: 6px; }
            50% { height: 18px; }
          }
          @keyframes badgeRotate {
            to { transform: rotate(360deg); }
          }
        `}} />

        {/* Dark Vignette Overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(23, 20, 17, 0.1) 0%, rgba(23, 20, 17, 0.4) 60%, rgba(23, 20, 17, 0.85) 100%)",
          zIndex: 1
        }} />

        {/* Top Info Strip */}
        <div style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          right: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 2
        }}>
          <span style={{
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            borderRadius: "6px",
            padding: "4px 8px",
            fontSize: "0.62rem",
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "0.08em",
            textTransform: "uppercase"
          }}>
            {genre || "Artist"}
          </span>
          <span style={{ fontSize: "0.85rem", color: "#FFFFFF", opacity: 0.8 }}>
            {playing ? "⏸" : "▶"}
          </span>
        </div>

        {/* Bottom Info Section */}
        <div style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          right: "20px",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          <div>
            <h4 style={{
              fontSize: "1.35rem",
              fontWeight: 950,
              color: "#FFFFFF",
              margin: "0 0 4px",
              letterSpacing: "-0.02em",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)"
            }}>
              {name}
            </h4>
            <p style={{
              fontSize: "0.78rem",
              color: "rgba(255, 255, 255, 0.85)",
              lineHeight: 1.4,
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: "3",
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textShadow: "0 1px 2px rgba(0,0,0,0.2)"
            }}>
              {displayQuote}
            </p>
          </div>

          {/* Sound wave / play indicator decoration */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "10px",
            borderTop: "1px solid rgba(255, 255, 255, 0.2)"
          }}>
            <span style={{ fontSize: "0.62rem", color: "#FFFFFF", opacity: 0.6, fontWeight: 700, fontFamily: "monospace" }}>
              POPOK MOTION PREVIEW
            </span>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "18px" }}>
              {[1, 2, 3, 4, 5].map((bar) => (
                <div
                  key={bar}
                  style={{
                    width: "2px",
                    background: "var(--accent)",
                    borderRadius: "1px",
                    height: "6px",
                    animation: playing ? `soundWaveMove ${0.6 + bar * 0.15}s ease-in-out infinite alternate` : "none"
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bar Loader (Loops 15s) */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "rgba(255, 255, 255, 0.2)",
          zIndex: 3
        }}>
          <div style={{
            width: `${progress}%`,
            height: "100%",
            background: "var(--accent)",
            transition: isDirect ? "none" : "width 0.1s linear"
          }} />
        </div>
      </div>
    </div>
  );
}
