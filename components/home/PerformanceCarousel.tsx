"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Performance } from "@/types";
import { getPerformanceExternalLink } from "@/lib/performanceLinks";

const FALLBACK_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Crect width='44' height='44' rx='22' fill='%2327344f'/%3E%3Ctext x='22' y='27' text-anchor='middle' font-family='Arial' font-size='11' font-weight='700' fill='white'%3EP%3C/text%3E%3C/svg%3E";

import ResponsiveImage from "@/components/ResponsiveImage";
import { getListImageUrl } from "@/lib/imageUrls";
interface PerformanceCarouselProps {
  title: string;
  subtitle?: string;
  performances: Performance[];
  /** Optional link shown next to the title, e.g. to a full performance calendar. */
  titleLink?: { label: string; href: string };
}

// Image-less and broken-hotlink performances remain visible with a branded
// CSS placeholder, without depending on a static fallback asset.
function PosterImage({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className="perf-card-poster-placeholder"
        role="img"
        aria-label={`${alt} 포스터 준비 중`}
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "8px",
          background: "linear-gradient(145deg, var(--navy) 0%, #27344f 64%, var(--accent-dark) 100%)",
          color: "#fff", textAlign: "center", padding: "20px",
        }}
      >
        <span style={{ fontSize: "0.7rem", fontWeight: 900, letterSpacing: "0.18em" }}>POPOK</span>
        <strong style={{ fontSize: "1rem", lineHeight: 1.35, maxWidth: "190px" }}>{alt}</strong>
        <span style={{ fontSize: "0.65rem", opacity: 0.72 }}>PERFORMANCE</span>
      </div>
    );
  }
  return (
    <ResponsiveImage src={src} alt={alt} className="perf-card-poster-img" sizes="(max-width: 640px) 78vw, 270px" maxWidth={600}
      loading="lazy" onError={() => setFailed(true)} />
  );
}

// "2026. 7. 18 – 7. 20" style Korean date range. Falls back gracefully on
// missing/invalid dates instead of printing "Invalid Date".
function formatDateRange(startDate?: string | null, endDate?: string | null): string {
  if (!startDate) return "";
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return "";
  const startStr = `${start.getFullYear()}. ${start.getMonth() + 1}. ${start.getDate()}`;

  if (!endDate) return startStr;
  const end = new Date(endDate);
  if (isNaN(end.getTime()) || end.getTime() === start.getTime()) return startStr;

  const sameYear = start.getFullYear() === end.getFullYear();
  const endStr = sameYear
    ? `${end.getMonth() + 1}. ${end.getDate()}`
    : `${end.getFullYear()}. ${end.getMonth() + 1}. ${end.getDate()}`;

  return `${startStr} – ${endStr}`;
}

// externalUrl > ticketUrl > sourceUrl, first valid http(s) one wins — see
// lib/performanceLinks.ts (shared with CompanyUpcomingPerformances). No
// internal detail page exists yet, so there's nothing to prefer over these.
function getPerformanceLink(perf: Performance): { href: string; external: boolean } | null {
  const href = getPerformanceExternalLink(perf);
  return href ? { href, external: true } : null;
}

export default function PerformanceCarousel({ title, subtitle, performances, titleLink }: PerformanceCarouselProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visibleCount, setVisibleCount] = useState(Math.min(8, performances.length));
  const visiblePerformances = performances.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(Math.min(8, performances.length));
  }, [performances]);

  const pauseAutoScroll = (delay = 8000) => {
    pausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, delay);
  };

  const handleScroll = (dir: "left" | "right") => {
    pauseAutoScroll();
    if (sliderRef.current) {
      const scrollAmount = dir === "left" ? -400 : 400;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (performances.length === 0) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let lastTs: number | null = null;
    let rafId: number;
    const speed = 20; // slow scroll speed

    const step = (ts: number) => {
      if (lastTs === null) lastTs = ts;
      const dt = Math.min(ts - lastTs, 50) / 1000;
      lastTs = ts;
      const node = sliderRef.current;
      if (node && !pausedRef.current && node.scrollWidth > node.clientWidth) {
        const next = node.scrollLeft + speed * dt;
        node.scrollLeft = next + node.clientWidth >= node.scrollWidth - 1 ? 0 : next;
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [performances.length]);

  // No performances yet (table empty, migration not run, or query error) — hide
  // the section entirely rather than showing an empty/broken carousel.
  if (performances.length === 0) return null;

  return (
    <section className="home-section" style={{
      padding: "80px 24px",
      maxWidth: "1120px",
      margin: "0 auto",
      borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "32px",
          gap: "16px",
          flexWrap: "wrap"
        }}
      >
        <div>
          <h2 className="display" style={{
            fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
            color: "var(--navy)",
            fontWeight: 950,
            letterSpacing: "-0.03em",
            margin: 0
          }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "6px", fontWeight: 700 }}>
              {subtitle}
            </p>
          )}
          {titleLink && (
            <div>
              <Link
                href={titleLink.href}
                style={{ display: "inline-block", marginTop: "6px", fontSize: "0.85rem", fontWeight: 800, color: "var(--accent-dark)", textDecoration: "none", whiteSpace: "nowrap" }}
              >
                → {titleLink.label}
              </Link>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => handleScroll("left")}
            aria-label="scroll left"
            className="btn-outline"
            style={{ width: "36px", height: "36px", borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", cursor: "pointer" }}
          >
            ←
          </button>
          <button
            onClick={() => handleScroll("right")}
            aria-label="scroll right"
            className="btn-outline"
            style={{ width: "36px", height: "36px", borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", cursor: "pointer" }}
          >
            →
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        ref={sliderRef}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
        onPointerDown={() => pauseAutoScroll()}
        onTouchStart={() => pauseAutoScroll()}
        onWheel={() => pauseAutoScroll()}
        className="no-scrollbar performance-carousel-track"
        style={{
          display: "flex",
          gap: "24px",
          overflowX: "auto",
          padding: "10px 4px 20px",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {visiblePerformances.map((perf) => {
          const dateLabel = formatDateRange(perf.startDate, perf.endDate);
          const genreLabel = perf.genre || perf.category || "";
          const link = getPerformanceLink(perf);
          // A linked Company takes priority over the free-text organizer.
          const organizerLabel = perf.companyName || perf.organizer;
          const relatedArtists = perf.relatedArtists || [];
          const visibleArtists = relatedArtists.slice(0, 3);
          const extraCount = relatedArtists.length - visibleArtists.length;

          return (
            <div key={perf.id} style={{
              minWidth: "270px",
              maxWidth: "270px",
              flex: "0 0 auto",
              scrollSnapAlign: "start",
            }}>
              <div style={{
                background: "#FFFFFF",
                border: "1.5px solid var(--border)",
                borderRadius: "18px",
                padding: "12px",
                minHeight: "375px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 8px 24px rgba(23, 20, 17, 0.04)",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                cursor: "default"
              }} className="perf-card">
                <div>
                  {/* Poster Area */}
                  <div className="perf-card-poster" style={{
                    width: "100%", height: "180px", borderRadius: "12px", overflow: "hidden",
                    background: "#FAF9F5", border: "1px solid var(--border)",
                    position: "relative"
                  }}>
                    <PosterImage src={perf.posterUrl} alt={perf.title} />
                    {genreLabel && (
                      <span style={{
                        position: "absolute", top: "10px", left: "10px",
                        background: "var(--navy)", color: "#FFFFFF", fontSize: "0.62rem",
                        fontWeight: 800, padding: "4px 8px", borderRadius: "4px"
                      }}>
                        {genreLabel}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div style={{ marginTop: "14px" }}>
                    {organizerLabel && (
                      <span className="mono" style={{ fontSize: "0.68rem", color: "var(--accent-dark)", fontWeight: 900, display: "block", marginBottom: "4px" }}>
                        {organizerLabel}
                      </span>
                    )}
                    <h3 style={{
                      fontSize: "1.1rem", fontWeight: 900, color: "var(--navy)", margin: "0 0 6px",
                      display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden"
                    }}>
                      {perf.title}
                    </h3>
                    {perf.venue && (
                      <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)", display: "flex", gap: "6px", alignItems: "center" }}>
                        <span>📍 {perf.venue}</span>
                      </div>
                    )}
                  </div>

                  {/* Related artists */}
                  {visibleArtists.length > 0 && (
                    <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border)" }}>
                      <span style={{ fontSize: "0.62rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        함께하는 아티스트
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                        {visibleArtists.map(({ artist, role }) => (
                          <Link
                            key={artist.id}
                            href={`/artists/${artist.slug || artist.id}`}
                            style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
                          >
                            <img
                              src={artist.profileImage ? getListImageUrl(artist.profileImage, 96) : FALLBACK_AVATAR}
                              alt={artist.name}
                              loading="lazy"
                              style={{ width: "22px", height: "22px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }}
                            />
                            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)" }}>
                              {artist.name}
                              {role && <span style={{ color: "var(--ink-muted)", fontWeight: 600 }}> · {role}</span>}
                            </span>
                          </Link>
                        ))}
                        {extraCount > 0 && (
                          <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 700 }}>
                            +{extraCount}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "10px"
                  }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--navy)" }}>
                      {dateLabel ? `📅 ${dateLabel}` : ""}
                    </div>
                    {link ? (
                      <Link
                        href={link.href}
                        {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        style={{
                          textDecoration: "none", fontSize: "0.78rem", fontWeight: 800,
                          color: "#FFFFFF", padding: "7px 14px", background: "var(--navy)",
                          borderRadius: "10px",
                        }}
                      >
                        공연 정보 보기
                      </Link>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--ink-faint)", fontWeight: 700 }}>종료/예정</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
      {visibleCount < performances.length && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
          <button type="button" className="btn-outline" onClick={() => setVisibleCount((count) => Math.min(count + 8, performances.length))} style={{ padding: "10px 18px", borderRadius: "999px", cursor: "pointer", fontWeight: 800 }}>
            공연 더 보기
          </button>
        </div>
      )}
      <style>{`
        .perf-card:hover {
          border-color: var(--navy) !important;
          box-shadow: 0 8px 24px rgba(23, 20, 17, 0.06) !important;
        }
        .perf-card-poster { transition: transform 0.2s ease; }
        .perf-card-poster-img { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .perf-card:hover .perf-card-poster-img {
          transform: scale(1.03);
        }
        @media (max-width: 768px) {
          .performance-carousel-track {
            padding-left: 16px !important;
            padding-right: 16px !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </section>
  );
}
