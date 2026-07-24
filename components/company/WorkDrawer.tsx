"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Company } from "@/types";
import { normalizeWorkImages, normalizeWorkCredits } from "@/lib/company-works";
import { useMobileBodyScrollLock } from "@/hooks/useMobileBodyScrollLock";

interface WorkDrawerProps {
  work: any;
  company: Company;
  onClose: () => void;
}

const WorkImagePlaceholder = ({ company }: { company: any }) => (
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
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: company.brand_color || "#171411" }} />
    </span>
    <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      No Image Archive
    </span>
  </div>
);

export default function WorkDrawer({ work, company, onClose }: WorkDrawerProps) {
  const brandAccent = company.brand_color || "#171411";
  useMobileBodyScrollLock();


  // Collect and deduplicate up to 4 images from work — same contract the CMS
  // and admin editors save to, so what's saved is exactly what's shown here.
  const images = useMemo(() => normalizeWorkImages(work), [work]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset slide index to 0 whenever work changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [work]);

  // Keyboard navigation (ArrowLeft / ArrowRight)
  useEffect(() => {
    if (images.length <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length]);

  // Touch swipe gesture handlers for mobile
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || images.length <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;
    if (Math.abs(diffX) > 35) {
      if (diffX > 0) {
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      } else {
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      }
    }
    setTouchStartX(null);
  };

  // Group credits by role for structured layout — same contract the CMS and
  // admin editors save to.
  const groupedCredits = useMemo(
    () => normalizeWorkCredits(work).map((c): [string, string[]] => [c.role, c.names]),
    [work]
  );

  // Video renderer
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
                color: brandAccent,
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

          {/* 1. Image Carousel (Max 4 images) */}
          <div style={{ marginBottom: "28px" }}>
            {images.length === 0 ? (
              <WorkImagePlaceholder company={company} />
            ) : (
              <div>
                <div
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "1.6",
                    backgroundColor: "#171411",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    userSelect: "none",
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentImageIndex}
                      src={images[currentImageIndex]}
                      alt={`${work.title} slide ${currentImageIndex + 1}`}
                      initial={{ opacity: 0.4, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0.4, scale: 0.98 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </AnimatePresence>

                  {/* Prev / Next arrows & Counter badge ONLY when images.length > 1 */}
                  {images.length > 1 && (
                    <>
                      {/* Prev Arrow */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                        }}
                        aria-label="이전 이미지"
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(23, 20, 17, 0.75)",
                          color: "#FFFFFF",
                          border: "1px solid rgba(255, 255, 255, 0.25)",
                          backdropFilter: "blur(4px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: "1.3rem",
                          lineHeight: 1,
                          zIndex: 5,
                        }}
                      >
                        ‹
                      </motion.button>

                      {/* Next Arrow */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                        }}
                        aria-label="다음 이미지"
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(23, 20, 17, 0.75)",
                          color: "#FFFFFF",
                          border: "1px solid rgba(255, 255, 255, 0.25)",
                          backdropFilter: "blur(4px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: "1.3rem",
                          lineHeight: 1,
                          zIndex: 5,
                        }}
                      >
                        ›
                      </motion.button>

                      {/* Image Counter Badge (1 / N) */}
                      <div
                        className="mono"
                        style={{
                          position: "absolute",
                          bottom: "12px",
                          right: "12px",
                          backgroundColor: "rgba(23, 20, 17, 0.8)",
                          color: "#FFFFFF",
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          padding: "4px 10px",
                          borderRadius: "12px",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          backdropFilter: "blur(4px)",
                          zIndex: 5,
                        }}
                      >
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip ONLY when images.length > 1 */}
                {images.length > 1 && (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "10px",
                      overflowX: "auto",
                      paddingBottom: "4px",
                    }}
                  >
                    {images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentImageIndex(idx)}
                        style={{
                          border: idx === currentImageIndex ? `2.5px solid ${brandAccent}` : "1px solid var(--border)",
                          borderRadius: "4px",
                          padding: 0,
                          backgroundColor: "#171411",
                          cursor: "pointer",
                          opacity: idx === currentImageIndex ? 1 : 0.5,
                          flexShrink: 0,
                          width: "64px",
                          height: "44px",
                          overflow: "hidden",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <img
                          src={imgUrl}
                          alt={`thumbnail ${idx + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Description ("About this project") */}
          <div style={{ marginBottom: "28px" }}>
            <span className="mono" style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.08em" }}>
              About this project
            </span>
            <p style={{ fontSize: "0.88rem", color: "var(--navy)", lineHeight: 1.65, margin: 0, whiteSpace: "pre-line", wordBreak: "keep-all" }}>
              {work.description || "작품에 대한 상세 설명이 등록되어 있지 않습니다."}
            </p>
          </div>

          {/* 3. Performance Information */}
          {(work.venue || work.festival || work.year) && (
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
              </div>
            </div>
          )}

          {/* 4. Video Archive (Displayed below images & description if exists) */}
          {(work.video_url || work.video || (work.media && work.media.url)) && (
            <div style={{ marginBottom: "28px" }}>
              <span className="mono" style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.08em" }}>
                Video Archive
              </span>
              <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: "6px", overflow: "hidden", background: "#171411", border: "1px solid var(--border)" }}>
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
          {(work.links || work.url || work.link) && (
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
