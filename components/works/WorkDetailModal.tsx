"use client";

import React, { useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { normalizeWorkImages, normalizeWorkCredits } from "@/lib/works";
import { useMobileBodyScrollLock } from "@/hooks/useMobileBodyScrollLock";

interface WorkDetailModalProps {
  work: any;
  /** Brand/accent color for the genre label, active thumbnail border, and
   *  reference links — a company's brand_color, or a fixed accent for
   *  contexts (like the individual artist page) with no per-entity color. */
  accentColor?: string;
  onClose: () => void;
  /** Analytics hooks — all optional/no-ops when omitted, so callers that
   *  don't need tracking (e.g. the company page) are unaffected. */
  onExternalLinkClick?: () => void;
  onVideoPlay?: () => void;
  onImageChanged?: () => void;
}

const WorkImagePlaceholder = ({ accentColor }: { accentColor: string }) => (
  <div
    style={{
      width: "100%",
      aspectRatio: "1.6",
      backgroundColor: "#FAF9F5",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid var(--border)",
      borderRadius: "8px",
      color: "var(--navy)",
      gap: "8px",
    }}
  >
    <span style={{ fontWeight: 950, fontSize: "1.1rem", letterSpacing: "-0.04em", display: "flex", alignItems: "center", gap: "2px" }}>
      POPOK
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: accentColor }} />
    </span>
    <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      No Image Archive
    </span>
  </div>
);

const AnimatedArchiveImage = ({ src, alt, eager }: { src: string; alt: string; eager: boolean }) => {
  const [loaded, setLoaded] = useState(false);
  const reduceMotion = useReducedMotion();
  return (
    <motion.img
      className="work-archive-image"
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      onLoad={() => setLoaded(true)}
      initial={reduceMotion ? false : { opacity: 0, scale: 1.025, filter: "blur(10px)" }}
      animate={loaded ? { opacity: 1, scale: 1, filter: "blur(0px)" } : { opacity: 0, scale: 1.025, filter: "blur(10px)" }}
      transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
    />
  );
};

// Shared work-detail modal — used by both the company page
// (components/company/CompanyPortfolio.tsx) and the individual artist page
// (app/artists/[id]/page.tsx) so the two never visually drift apart again.
// Single source of truth for the backdrop/panel chrome, image archive,
// description, performance info, video, credits, and references sections;
// every section is purely data-driven (rendered only when the relevant
// field exists on `work`), so the same component works for both entities'
// slightly different work shapes without any per-context branching.
export default function WorkDetailModal({ work, accentColor = "#171411", onClose, onExternalLinkClick, onVideoPlay, onImageChanged }: WorkDetailModalProps) {
  useMobileBodyScrollLock();
  const hasTrackedVideoPlay = useRef(false);
  const reduceMotion = useReducedMotion();

  // Collect and deduplicate up to 4 images — same contract the CMS and
  // admin editors save to, so what's saved is exactly what's shown here.
  const images = useMemo(() => normalizeWorkImages(work), [work]);

  // Group credits by role for structured layout — falls back to a single
  // "안무/역할" entry from `work.role` when no structured credits exist, so
  // an individual artist's simple role string still renders sensibly here.
  const groupedCredits = useMemo(
    () => normalizeWorkCredits(work).map((c): [string, string[]] => [c.role, c.names]),
    [work]
  );

  // Video renderer — checks both DB-column (video_url) and camelCase
  // (videoUrl) field names since the artist page's WorkItem shape uses the
  // latter.
  const renderVideo = () => {
    const videoUrl = work.video_url || work.videoUrl || work.video || (work.media && work.media.url) || "";
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
          onPlay={() => {
            if (hasTrackedVideoPlay.current) return;
            hasTrackedVideoPlay.current = true;
            onVideoPlay?.();
          }}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      );
    }

    return (
      <div style={{ padding: "16px", background: "var(--bg-warm)", fontSize: "0.8rem", textAlign: "center" }}>
        재생 주소: <a href={videoUrl} target="_blank" rel="noreferrer" style={{ color: accentColor }}>{videoUrl}</a>
      </div>
    );
  };

  const hasVideo = Boolean(work.video_url || work.videoUrl || work.video || (work.media && work.media.url));
  const referenceLink = work.externalLink || work.url || work.link || "";
  const hasReferences = Boolean(work.links || referenceLink);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
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
          background-color: rgba(23, 20, 17, 0.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          padding: 40px 20px;
        }
        .drawer-main {
          width: 640px;
          max-width: 100%;
          height: auto;
          max-height: 88vh;
          background-color: #FFFFFF;
          box-shadow: 0 20px 50px rgba(23, 20, 17, 0.2);
          border-radius: 10px;
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          position: relative;
        }
        .drag-handle {
          display: none;
        }
        .credits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 20px 16px;
        }
        .work-archive {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .work-archive-item { margin: 0; }
        .work-archive-image {
          display: block;
          width: 100%;
          height: auto;
          border: 1px solid var(--border);
          border-radius: 4px;
          background: #f3f1eb;
        }
        .work-archive-caption {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding-top: 8px;
          color: var(--ink-faint);
          font-size: 0.64rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        @media (prefers-reduced-motion: reduce) {
          .work-archive-item, .work-archive-image { transition: none !important; animation: none !important; }
        }
        @media (max-width: 768px) {
          .work-modal-backdrop {
            padding: 0 !important;
            align-items: flex-end !important;
          }
          .drawer-main {
            width: 100% !important;
            max-width: 100% !important;
            height: 90vh !important;
            max-height: 90vh !important;
            border-radius: 16px 16px 0 0 !important;
          }
          .drag-handle {
            display: block !important;
            width: 40px;
            height: 4px;
            border-radius: 2px;
            background-color: var(--border-dark);
            margin: 12px auto 4px auto;
            opacity: 0.7;
          }
          .credits-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
      `}</style>

      {/* Drawer Container */}
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
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
            backgroundColor: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(8px)",
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
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
                color: accentColor,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "2px",
              }}
            >
              {work.genre || work.category || "PERFORMANCE"}
            </span>
            <h3
              style={{
                fontSize: "1.15rem",
                fontWeight: 950,
                color: "var(--navy)",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                letterSpacing: "-0.02em",
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
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{ padding: "24px" }}>

          {/* 1. Description ("About this project") */}
          <div style={{ marginBottom: "28px" }}>
            <span className="mono" style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.08em" }}>
              About this project
            </span>
            <p style={{ fontSize: "0.88rem", color: "var(--navy)", lineHeight: 1.65, margin: 0, whiteSpace: "pre-line", wordBreak: "keep-all" }}>
              {work.description || "작품에 대한 상세 설명이 등록되어 있지 않습니다."}
            </p>
          </div>


          {/* 2. Vertical image archive (Max 4 images) */}
          <div style={{ marginBottom: "28px" }}>
            {images.length === 0 ? (
              <WorkImagePlaceholder accentColor={accentColor} />
            ) : (
              <div className="work-archive" aria-label={`${work.title} 작품 이미지 아카이브`}>
                {images.map((imgUrl, idx) => (
                  <motion.figure
                    key={imgUrl}
                    className="work-archive-item"
                    initial={reduceMotion ? false : { opacity: 0, y: 36, scale: 0.985 }}
                    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.08, margin: "0px 0px -6% 0px" }}
                    transition={{ duration: reduceMotion ? 0 : 0.58, delay: reduceMotion ? 0 : Math.min(idx * 0.07, 0.28), ease: [0.22, 1, 0.36, 1] }}
                    onViewportEnter={idx > 0 ? () => onImageChanged?.() : undefined}
                  >
                    <AnimatedArchiveImage
                      src={imgUrl}
                      alt={`${work.title} 작품 기록 이미지 ${idx + 1}`}
                      eager={idx === 0}
                    />
                    <figcaption className="work-archive-caption mono">
                      <span>Archive {String(idx + 1).padStart(2, "0")}</span>
                      <span>{String(idx + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>
                    </figcaption>
                  </motion.figure>
                ))}
              </div>
            )}
          </div>
          {/* 3. Performance Information */}
          {(work.venue || work.festival || work.year || work.role) && (
            <div style={{ marginBottom: "28px" }}>
              <span className="mono" style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.08em" }}>
                Performance Info
              </span>
              <div style={{
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "14px 18px",
                background: "#FAF9F5",
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "8px",
                fontSize: "0.82rem",
                color: "var(--navy)"
              }}>
                {work.year && <div><strong style={{ fontWeight: 800 }}>일시/연도:</strong> {work.year}</div>}
                {work.venue && <div><strong style={{ fontWeight: 800 }}>장소:</strong> {work.venue}</div>}
                {work.festival && <div><strong style={{ fontWeight: 800 }}>축제/행사:</strong> {work.festival}</div>}
                {work.role && <div><strong style={{ fontWeight: 800 }}>참여/역할:</strong> {work.role}</div>}
              </div>
            </div>
          )}

          {/* 4. Video Archive (Displayed below images & description if exists) */}
          {hasVideo && (
            <div style={{ marginBottom: "28px" }}>
              <span className="mono" style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.08em" }}>
                Video Archive
              </span>
              <div
                onClick={() => {
                  if (hasTrackedVideoPlay.current) return;
                  hasTrackedVideoPlay.current = true;
                  onVideoPlay?.();
                }}
                style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: "6px", overflow: "hidden", background: "#171411", border: "1px solid var(--border)" }}
              >
                {renderVideo()}
              </div>
            </div>
          )}

          {/* Program Book Section (Conditional) */}
          {(work.program_book_url || (work.program_book_images && work.program_book_images.length > 0)) && (
            <div style={{ marginBottom: "28px" }}>
              <span className="mono" style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.08em" }}>
                Program Book
              </span>
              <div style={{
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "20px",
                background: "#FAF9F5",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                alignItems: "center"
              }}>
                <div style={{ fontSize: "1.8rem" }}>📄</div>
                <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--navy)" }}>
                  공연 팜플렛 / 프로그램북 아카이브
                </div>
                {work.program_book_url && (
                  <a
                    href={work.program_book_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      color: "#FFFFFF",
                      backgroundColor: "var(--navy)",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      textDecoration: "none",
                      display: "inline-block",
                      marginTop: "4px",
                    }}
                  >
                    PDF로 보기 ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* 5. Visually Separated Structured Credits (Grouped by Role) */}
          <div style={{ marginBottom: "28px" }}>
            <span className="mono" style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.08em" }}>
              Credits
            </span>
            <div
              style={{
                border: "1.5px solid var(--border)",
                borderRadius: "8px",
                padding: "20px 24px",
                background: "#FAF9F5",
              }}
            >
              {groupedCredits.length === 0 ? (
                <span style={{ fontSize: "0.82rem", color: "var(--ink-faint)" }}>
                  등록된 크레딧 정보가 없습니다.
                </span>
              ) : (
                <div className="credits-grid">
                  {groupedCredits.map(([roleName, peopleNames]) => (
                    <div key={roleName} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 850,
                          color: "var(--ink-muted)",
                          borderBottom: "1.5px solid var(--border-dark)",
                          paddingBottom: "4px",
                          marginBottom: "4px",
                        }}
                      >
                        {roleName}
                      </div>
                      {peopleNames.map((nameStr, nidx) => (
                        <div
                          key={nidx}
                          style={{
                            fontSize: "0.92rem",
                            fontWeight: 800,
                            color: "var(--navy)",
                            lineHeight: 1.4,
                          }}
                        >
                          {nameStr}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* References & Links */}
          {hasReferences && (
            <div>
              <span className="mono" style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.08em" }}>
                References
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Array.isArray(work.links) ? (
                  work.links.map((lnk: any, idx: number) => (
                    <a
                      key={idx}
                      href={lnk.url || lnk}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onExternalLinkClick?.()}
                      style={{
                        fontSize: "0.82rem",
                        color: accentColor,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      {lnk.label || `관련 정보 링크 ${idx + 1}`} ↗
                    </a>
                  ))
                ) : (
                  <a
                    href={referenceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onExternalLinkClick?.()}
                    style={{
                      fontSize: "0.82rem",
                      color: accentColor,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    관련 링크 ↗
                  </a>
                )}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </motion.div>
  );
}
