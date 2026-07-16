"use client";

import React, { useEffect } from "react";
import type { Company } from "@/types";

interface WorkDrawerProps {
  work: any;
  company: Company;
  onClose: () => void;
}

export default function WorkDrawer({ work, company, onClose }: WorkDrawerProps) {
  const brandAccent = company.brand_color || "#171411";

  // Prevent background scroll when open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const imageUrl =
    work.image_url ||
    work.image ||
    (work.media && work.media.src) ||
    "/images/placeholders/cake-placeholder.png";

  const renderVideo = () => {
    const videoUrl = work.video_url || work.video || (work.media && work.media.url) || "";
    if (!videoUrl) return null;

    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      const match = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      const videoId = match ? match[1] : null;
      if (videoId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
            style={{ width: "100%", height: "100%", border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      }
    }

    if (videoUrl.includes("vimeo.com")) {
      const match = videoUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]+)\/posts\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
      const videoId = match ? match[1] : null;
      if (videoId) {
        return (
          <iframe
            src={`https://player.vimeo.com/video/${videoId}`}
            style={{ width: "100%", height: "100%", border: 0 }}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        );
      }
    }

    if (videoUrl.endsWith(".mp4") || videoUrl.includes("/media/")) {
      return (
        <video
          src={videoUrl}
          controls
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      );
    }

    return (
      <div style={{ padding: "16px", background: "var(--bg-warm)", fontSize: "0.8rem", textAlign: "center" }}>
        재생 주소: <a href={videoUrl} target="_blank" rel="noreferrer" style={{ color: brandAccent }}>{videoUrl}</a>
      </div>
    );
  };

  return (
    <div
      className="work-modal-backdrop"
      onClick={onClose}
    >
      <style jsx global>{`
        .work-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(23, 20, 17, 0.45);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          padding: 40px 20px;
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUpBottom {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .drawer-main {
          width: 640px;
          max-width: 100%;
          height: auto;
          max-height: 90vh;
          background-color: #FFFFFF;
          box-shadow: 0 20px 60px rgba(23, 20, 17, 0.15);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          animation: fadeInScale 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          overflow-y: auto;
          position: relative;
        }
        .drag-handle {
          display: none;
        }
        @media (max-width: 768px) {
          .work-modal-backdrop {
            padding: 0 !important;
            align-items: flex-end !important;
          }
          .drawer-main {
            width: 100% !important;
            max-width: 100% !important;
            height: 85vh !important;
            max-height: 85vh !important;
            border-radius: 20px 20px 0 0 !important;
            animation: slideUpBottom 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .drag-handle {
            display: block !important;
            width: 36px;
            height: 4px;
            border-radius: 2px;
            background-color: var(--border-dark);
            margin: 12px auto 4px auto;
            opacity: 0.7;
          }
        }
      `}</style>
      
      {/* Drawer Container */}
      <div
        className="drawer-main"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="drag-handle" />

        {/* Drawer Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            backgroundColor: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(8px)",
            padding: "20px 24px",
            borderBottom: "1.5px solid var(--border-light)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <span
              className="mono"
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                color: brandAccent,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "2px"
              }}
            >
              {work.genre || work.category || "PERFORMANCE"}
            </span>
            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: 900,
                color: "var(--navy)",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                letterSpacing: "-0.02em"
              }}
            >
              {work.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              fontSize: "1.6rem",
              fontWeight: 300,
              cursor: "pointer",
              color: "var(--ink-muted)",
              padding: "4px 8px",
            }}
          >
            ×
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{ padding: "24px" }}>
          
          {/* Main Visual */}
          <div style={{ width: "100%", borderRadius: "10px", overflow: "hidden", border: "1.5px solid var(--border-light)", marginBottom: "24px" }}>
            <img src={imageUrl} alt={work.title} style={{ width: "100%", height: "auto", display: "block" }} />
          </div>

          {/* Description */}
          <div style={{ marginBottom: "28px" }}>
            <span className="mono" style={{ display: "block", marginBottom: "8px" }}>About this project</span>
            <p style={{ fontSize: "0.88rem", color: "var(--navy)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line", wordBreak: "keep-all" }}>
              {work.description || "이 작품에 대한 상세 설명이 등록되어 있지 않습니다. 이 공연은 창작 단체의 아카이빙 가이드라인을 준수하여 구성되었습니다."}
            </p>
          </div>

          {/* Video Section */}
          {(work.video_url || work.video || (work.media && work.media.url)) && (
            <div style={{ marginBottom: "28px" }}>
              <span className="mono" style={{ display: "block", marginBottom: "8px" }}>Video Archive</span>
              <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: "8px", overflow: "hidden", background: "#171411", border: "1.5px solid var(--border)" }}>
                {renderVideo()}
              </div>
            </div>
          )}

          {/* Credits */}
          <div style={{ marginBottom: "28px" }}>
            <span className="mono" style={{ display: "block", marginBottom: "8px" }}>Credits</span>
            <div style={{ border: "1.5px solid var(--border)", borderRadius: "10px", padding: "16px", background: "#FAF8F5" }}>
              {work.credits || work.role ? (
                <p style={{ fontSize: "0.82rem", color: "var(--navy)", lineHeight: 1.55, margin: 0, whiteSpace: "pre-line" }}>
                  {work.credits || `Role: ${work.role}`}
                </p>
              ) : (
                <span style={{ fontSize: "0.8rem", color: "var(--ink-faint)" }}>크레딧 정보가 등록되지 않았습니다.</span>
              )}
            </div>
          </div>

          {/* Additional Gallery images */}
          {work.gallery && Array.isArray(work.gallery) && work.gallery.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <span className="mono" style={{ display: "block", marginBottom: "12px" }}>Gallery</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                {work.gallery.map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${work.title} gallery ${idx}`}
                    style={{
                      width: "100%",
                      aspectRatio: "1.33",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1px solid var(--border-light)",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Related Links */}
          {(work.links || work.url || work.link) && (
            <div>
              <span className="mono" style={{ display: "block", marginBottom: "8px" }}>References</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Array.isArray(work.links) ? (
                  work.links.map((lnk: any, idx: number) => (
                    <a
                      key={idx}
                      href={lnk.url || lnk}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "0.82rem",
                        color: brandAccent,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      {lnk.label || `관련 정보 링크 ${idx + 1}`} ↗
                    </a>
                  ))
                ) : (
                  <a
                    href={work.url || work.link || work.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "0.82rem",
                      color: brandAccent,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    리뷰 / 티켓 사이트 링크 ↗
                  </a>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
