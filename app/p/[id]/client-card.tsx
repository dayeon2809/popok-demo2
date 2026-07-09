"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import PopokCard from "@/components/PopokCard";
import YouTubeMotionPreview from "@/components/YouTubeMotionPreview";
import { getVimeoEmbedUrl, isVimeoUrl } from "@/lib/videoLinks";
import { isYouTubeUrl } from "@/lib/youtube";

interface Props {
  record: {
    id: number;
    name: string;
    genre: string | null;
    instagram: string | null;
    created_at: string | null;
    profile_image_url?: string | null;
    profile_image_urls?: Array<string> | null;
    youtube_url?: string | null;
    youtube_preview_start?: number | null;
    youtube_preview_end?: number | null;
    portfolio_works?: Array<{
      kind?: string;
      profile_image_url?: string | null;
      motion_video_url?: string | null;
    }> | null;
  };
}

export default function ClientCard({ record }: Props) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(currentUrl);
    triggerToast("Link copied to clipboard!");
  };

  const cleanInstagramHandle = (url: string | null) => {
    if (!url) return "@username";
    const cleaned = url.trim();
    if (cleaned.startsWith("@")) return cleaned;
    try {
      const rawPath = cleaned
        .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, "")
        .replace(/\/$/, "");
      const username = rawPath.split("/")[0].split("?")[0];
      return username ? `@${username}` : `@${record.name}`;
    } catch (e) {
      return `@${record.name}`;
    }
  };

  const getInstagramLink = (url: string | null) => {
    if (!url) return "https://instagram.com";
    const cleaned = url.trim();
    if (cleaned.startsWith("http")) return cleaned;
    if (cleaned.startsWith("@")) {
      return `https://instagram.com/${cleaned.substring(1)}`;
    }
    return `https://instagram.com/${cleaned}`;
  };

  const registrationMedia = Array.isArray(record.portfolio_works)
    ? record.portfolio_works.find((item) => item?.kind === "popok_registration_media")
    : null;
  const legacyProfileImageUrl = registrationMedia?.profile_image_url || undefined;
  
  // Resolve image list
  const images = useMemo(() => {
    if (Array.isArray(record.profile_image_urls) && record.profile_image_urls.length > 0) {
      return record.profile_image_urls;
    }
    const single = record.profile_image_url || legacyProfileImageUrl;
    return single ? [single] : [];
  }, [record.profile_image_urls, record.profile_image_url, legacyProfileImageUrl]);

  const [selectedImage, setSelectedImage] = useState("");

  useEffect(() => {
    if (images.length > 0) {
      setSelectedImage(images[0]);
    }
  }, [images]);

  const motionVideoUrl = record.youtube_url || registrationMedia?.motion_video_url || "";
  const youtubePreviewStart = record.youtube_preview_start ?? 0;
  const youtubePreviewEnd = record.youtube_preview_end ?? 15;

  return (
    <div style={{
      flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "60px 24px", position: "relative"
    }}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: "fixed", top: "80px", left: "50%", transform: "translateX(-50%)",
          background: "var(--navy)", color: "#FFFFFF", padding: "10px 24px", borderRadius: "30px",
          fontSize: "0.85rem", fontWeight: 700, zIndex: 1000, boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          animation: "fadeIn 0.2s ease"
        }}>
          {toastMsg}
        </div>
      )}

      {/* Main Card visual stage */}
      <div style={{ maxWidth: "600px", width: "100%", textAlign: "center", marginBottom: "40px" }}>
        <h2 className="display" style={{ fontSize: "2.2rem", color: "var(--navy)", marginBottom: "8px", fontWeight: 900 }}>
          {record.name}'s POPOK
        </h2>
        <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem", fontWeight: 500 }}>
          디지털 명함을 탭하여 앞뒷면을 확인하고 공유해 보세요.
        </p>
      </div>

      {/* Enlarged Popok Card */}
      <div style={{ width: "100%", display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <PopokCard
          name={record.name}
          genre={record.genre}
          instagram={record.instagram}
          id={String(record.id)}
          cardUrl={currentUrl}
          profileImage={selectedImage || undefined}
        />
      </div>

      {/* Multi-images gallery thumbnails */}
      {images.length > 1 && (
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "40px", flexWrap: "wrap", maxWidth: "480px" }}>
          {images.map((imgUrl, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(imgUrl)}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                overflow: "hidden",
                border: selectedImage === imgUrl ? "2px solid var(--navy)" : "1px solid var(--border)",
                padding: 0,
                cursor: "pointer",
                background: "none",
                flexShrink: 0,
                transition: "all 0.2s ease"
              }}
            >
              <img src={imgUrl} alt={`gallery_${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}

      {motionVideoUrl && (isYouTubeUrl(motionVideoUrl) || isVimeoUrl(motionVideoUrl)) && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "34px" }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "0.02em" }}>
              Motion Profile Preview
            </span>
            <span style={{ display: "block", fontSize: "0.7rem", color: "var(--ink-muted)", marginTop: "2px" }}>
              {youtubePreviewStart}초 ~ {youtubePreviewEnd}초 구간 재생
            </span>
          </div>
          <div style={{
            width: "min(180px, 52vw)",
            aspectRatio: "9 / 16",
            borderRadius: "16px",
            overflow: "hidden",
            border: "1.5px solid var(--border)",
            background: "#111",
            boxShadow: "0 12px 28px rgba(23,20,17,0.08)",
          }}>
            {isYouTubeUrl(motionVideoUrl) ? (
              <YouTubeMotionPreview
                videoUrl={motionVideoUrl}
                title={`${record.name} motion profile`}
                aspectRatio="9 / 16"
                playMode="always"
                previewStart={youtubePreviewStart}
                previewEnd={youtubePreviewEnd}
                fill
              />
            ) : (
              <iframe
                src={getVimeoEmbedUrl(motionVideoUrl, true) || ""}
                title={`${record.name} motion profile`}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                style={{ width: "100%", height: "100%", border: 0, display: "block" }}
              />
            )}
          </div>
        </div>
      )}

      {/* Sharing & Details action buttons */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <button 
          onClick={handleShare}
          className="btn-lime"
          style={{
            padding: "14px 28px", borderRadius: "30px", border: "none",
            fontSize: "0.875rem", fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px"
          }}
        >
          <span>🔗</span> Share Link
        </button>

        <a 
          href={getInstagramLink(record.instagram)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline"
          style={{
            padding: "14px 28px", borderRadius: "30px", textDecoration: "none",
            fontSize: "0.875rem", fontWeight: 800,
            display: "flex", alignItems: "center", gap: "6px"
          }}
        >
          <span>📸</span> Instagram Profile
        </a>

        <Link 
          href="/"
          className="btn-outline"
          style={{
            padding: "14px 28px", borderRadius: "30px", textDecoration: "none",
            fontSize: "0.875rem", fontWeight: 800,
            display: "flex", alignItems: "center"
          }}
        >
          Back to Home
        </Link>
      </div>

    </div>
  );
}
