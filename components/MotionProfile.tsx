"use client";

import { useState, useEffect, useRef } from "react";

interface MotionProfileData {
  type: "video" | "image";
  src: string;
  poster?: string;
  title?: string;
  caption?: string;
}

interface MotionProfileProps {
  name: string;
  genre: string | null;
  image: string;
  quote?: string;
  motionProfile?: MotionProfileData | null;
}

export default function MotionProfile({ name, genre, image, quote, motionProfile }: MotionProfileProps) {
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Time progress bar loops automatically for static images
  useEffect(() => {
    const isVideo = motionProfile?.type === "video" && motionProfile.src && !videoError;
    if (isVideo) return; // handled by HTML5 onTimeUpdate
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
  }, [playing, motionProfile, videoError]);

  // Video playhead play/pause synchronization
  useEffect(() => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.play().catch((e) => console.log("Muted autoplay blocked or interrupted", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [playing]);

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
  const isVideoPlayback = motionProfile?.type === "video" && motionProfile.src && !videoError;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      {/* 9:16 Container Card */}
      <div 
        onClick={togglePlay}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "320px",
          aspectRatio: "0.5625", // 9:16
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
          {isVideoPlayback ? (
            <video
              ref={videoRef}
              src={motionProfile?.src}
              poster={motionProfile?.poster || image}
              muted
              loop
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "grayscale(0.5) contrast(1.1) brightness(0.85)",
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
                filter: "grayscale(0.6) contrast(1.15) brightness(0.85)",
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
          background: "linear-gradient(to bottom, rgba(23,20,17,0.4) 0%, rgba(23,20,17,0) 30%, rgba(23,20,17,0.85) 100%)",
          zIndex: 1
        }} />

        {/* 1. Progress Bar (15s Loop Indicator) at top */}
        <div style={{
          position: "absolute", top: "12px", left: "12px", right: "12px",
          height: "4px", background: "rgba(255,255,255,0.25)", borderRadius: "2px",
          zIndex: 2, overflow: "hidden"
        }}>
          <div style={{
            height: "100%", width: `${progress}%`, background: "var(--accent)",
            transition: "width 0.1s linear"
          }} />
        </div>

        {/* 2. Top labels */}
        <div style={{
          position: "absolute", top: "28px", left: "16px", right: "16px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          zIndex: 2
        }}>
          <span className="mono" style={{
            fontSize: "0.62rem", background: "var(--navy)", color: "#FFFFFF",
            padding: "4px 10px", borderRadius: "12px", fontWeight: 700,
            border: "1px solid rgba(255,255,255,0.2)"
          }}>
            {isVideoPlayback ? "MOTION PLAY" : "MOTION PREVIEW"}
          </span>
          <span className="mono" style={{ fontSize: "0.62rem", color: "#FFFFFF", opacity: 0.85, fontWeight: 700 }}>
            {isVideoPlayback ? "VIDEO REEL" : "15 SEC INTRO"}
          </span>
        </div>

        {/* 3. Central Pause overlay when paused */}
        {!playing && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(23, 20, 17, 0.3)", zIndex: 2
          }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%", background: "rgba(255,255,255,0.9)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
            }}>
              ▶
            </div>
          </div>
        )}

        {/* 4. Bottom Content overlay */}
        <div style={{
          position: "absolute", bottom: "20px", left: "16px", right: "16px",
          zIndex: 2, display: "flex", flexDirection: "column", gap: "10px"
        }}>
          {/* Tag labels */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span className="tag" style={{
              background: "var(--accent)", color: "var(--navy)", border: "none",
              fontSize: "0.6rem", fontWeight: 850, padding: "2px 8px"
            }}>
              {genre || "Creative Artist"}
            </span>
            <span className="tag" style={{
              background: "rgba(255,255,255,0.2)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.3)",
              fontSize: "0.6rem", fontWeight: 800, padding: "2px 8px"
            }}>
              {isVideoPlayback ? "Muted Video" : "Audio Demo"}
            </span>
          </div>

          {/* Name & English name */}
          <div>
            <h4 style={{ color: "#FFFFFF", fontSize: "1.45rem", fontWeight: 950, margin: 0, letterSpacing: "-0.02em" }}>
              {name}
            </h4>
            <span className="mono" style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem", fontWeight: 700 }}>
              {name.toUpperCase()} INTRO
            </span>
          </div>

          {/* Editorial quote */}
          <p style={{
            color: "rgba(255,255,255,0.9)", fontSize: "0.82rem", lineHeight: 1.45,
            fontWeight: 500, margin: "4px 0 8px 0"
          }}>
            “{displayQuote}”
          </p>

          {/* Progress bar + Audio Wave visualization */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "12px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {/* Rotating badge graphic */}
              <div style={{
                width: "16px", height: "16px", borderRadius: "50%", border: "2px dashed var(--accent)",
                animation: playing ? "badgeRotate 4s linear infinite" : "none"
              }} />
              <span className="mono" style={{ fontSize: "0.55rem", color: "var(--accent)", fontWeight: 800 }}>
                POPOK STUDIO CAM
              </span>
            </div>

            {/* Sound Wave Indicator lines */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "18px" }}>
              {[8, 14, 10, 16, 6].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: "2px",
                    background: "var(--accent)",
                    borderRadius: "1px",
                    height: playing ? undefined : `${h}px`,
                    animation: playing ? `soundWaveMove ${0.6 + i * 0.15}s ease-in-out infinite alternate` : "none"
                  }}
                />
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Tapping notice */}
      <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", fontWeight: 700, marginTop: "10px" }}>
        {playing ? "Tap to pause motion" : "Tap to resume motion"}
      </span>
    </div>
  );
}
