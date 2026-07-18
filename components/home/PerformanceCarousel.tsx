"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Performance } from "@/types";

interface PerformanceCarouselProps {
  title: string;
  subtitle?: string;
  performances: Performance[];
}

const FALLBACK_POSTER = "/images/placeholders/cake-placeholder.png";

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

// Only a real http/https URL counts as usable — null, "", and whitespace-only
// values (any of which a crawled or partially-filled-in row can have) are
// rejected rather than handed to <Link href>.
function isValidHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^https?:\/\/.+/i.test(value.trim());
}

// Link priority: admin-entered externalUrl (ticket page, official site,
// Instagram post, ...) first, then the crawler's ticketUrl, then its
// sourceUrl — covers both admin-curated rows and the 479 crawler-imported
// rows, which only ever have ticketUrl/sourceUrl. No internal detail page
// exists yet, so there's nothing to prefer over these.
function getPerformanceLink(perf: Performance): { href: string; external: boolean } | null {
  for (const candidate of [perf.externalUrl, perf.ticketUrl, perf.sourceUrl]) {
    if (isValidHttpUrl(candidate)) return { href: candidate.trim(), external: true };
  }
  return null;
}

export default function PerformanceCarousel({ title, subtitle, performances }: PerformanceCarouselProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      padding: "60px 32px",
      maxWidth: "1120px",
      margin: "0 auto",
      borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: "32px",
        gap: "16px",
        flexWrap: "wrap"
      }}>
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
      </div>

      <div
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
        {performances.map((perf) => {
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
              minWidth: "320px",
              maxWidth: "320px",
              flex: "0 0 auto",
              scrollSnapAlign: "start",
            }}>
              <div style={{
                background: "#FFFFFF",
                border: "1.5px solid var(--border)",
                borderRadius: "16px",
                padding: "14px",
                boxShadow: "0 6px 20px rgba(23, 20, 17, 0.03)",
                minHeight: "440px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                cursor: "default"
              }} className="perf-card">
                <div>
                  {/* Poster Area */}
                  <div style={{
                    width: "100%", height: "220px", borderRadius: "10px", overflow: "hidden",
                    background: "var(--bg-warm)", border: "1px solid var(--border)",
                    position: "relative"
                  }}>
                    <img src={perf.posterUrl || FALLBACK_POSTER} alt={perf.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
                              src={artist.profileImage || FALLBACK_POSTER}
                              alt={artist.name}
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
                          textDecoration: "none", fontSize: "0.78rem", fontWeight: 900,
                          color: "var(--navy)", padding: "6px 12px", background: "var(--accent)",
                          borderRadius: "8px", border: "1px solid var(--navy)"
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
      </div>
      <style>{`
        .perf-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(23, 20, 17, 0.08) !important;
        }
      `}</style>
    </section>
  );
}
