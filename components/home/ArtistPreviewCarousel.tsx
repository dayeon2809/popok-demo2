"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Artist } from "@/types";
import { FIELD_LABELS } from "@/types";

interface ArtistPreviewCarouselProps {
  title: string;
  subtitle?: string;
  artists: Artist[];
  moreLink?: { label: string; href: string };
}

function getRepresentativeWork(artist: Artist): string | null {
  const works = artist.works;
  if (Array.isArray(works) && works.length > 0) {
    const first = works[0];
    const title = typeof first === "string" ? first : first?.title;
    if (title) return title;
  }
  if (artist.representative_work) return artist.representative_work;
  return null;
}

export default function ArtistPreviewCarousel({ title, subtitle, artists, moreLink }: ArtistPreviewCarouselProps) {
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
    sliderRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  useEffect(() => {
    if (artists.length === 0) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let lastTs: number | null = null;
    let rafId: number;
    const speed = 20;

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
  }, [artists.length]);
  if (artists.length === 0) return null;

  return (
    <section className="home-section artist-preview-section" style={{
      padding: "80px 24px",
      maxWidth: "1120px",
      margin: "0 auto",
      borderTop: "1px solid var(--border)",
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="artist-preview-header" 
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "32px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 className="display" style={{
            fontSize: "clamp(1.7rem, 3.8vw, 2.4rem)",
            color: "var(--navy)",
            fontWeight: 950,
            letterSpacing: "-0.03em",
            margin: 0,
          }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: "0.9rem", color: "var(--ink-muted)", marginTop: "8px", fontWeight: 600 }}>
              {subtitle}
            </p>
          )}
          {moreLink && (
            <Link href={moreLink.href} style={{
              display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "10px",
              fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)",
              textDecoration: "underline", textUnderlineOffset: "3px",
            }}>
              {moreLink.label} →
            </Link>
          )}
        </div>
        <div className="artist-preview-controls" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={() => handleScroll("left")} aria-label="scroll left" className="btn-outline"
            style={{ width: "36px", height: "36px", borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", cursor: "pointer" }}>
            ←
          </button>
          <button onClick={() => handleScroll("right")} aria-label="scroll right" className="btn-outline"
            style={{ width: "36px", height: "36px", borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", cursor: "pointer" }}>
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
        className="no-scrollbar artist-preview-track"
        style={{
          display: "flex",
          gap: "20px",
          overflowX: "auto",
          padding: "4px 4px 20px",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {artists.map((a) => {
          const genreLabel = a.genre ? (FIELD_LABELS[a.genre] ?? a.genre) : "CREATIVE";
          const repWork = getRepresentativeWork(a);
          const href = `/artists/${a.slug || a.id}`;

          return (
            <Link
              key={a.id}
              href={href}
              className="card hover-scale-img artist-preview-card"
              style={{
                minWidth: "300px",
                maxWidth: "300px",
                flex: "0 0 auto",
                scrollSnapAlign: "start",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden", background: "#EAE6DD", position: "relative" }}>
                {a.profileImage ? (
                  <img src={a.profileImage} alt={a.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.4rem", fontWeight: 800, color: "var(--accent-dark)" }}>
                    {a.name.charAt(0)}
                  </div>
                )}
                <span className="tag" style={{ position: "absolute", top: "12px", right: "12px" }}>
                  {genreLabel}
                </span>
              </div>

              <div style={{ padding: "18px 18px 20px", display: "flex", flexDirection: "column", gap: "6px", flexGrow: 1 }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--navy)", margin: 0, letterSpacing: "-0.01em" }}>
                  {a.name}
                </h3>
                {(a.bio_short || a.aiSummary) && (
                  <p style={{
                    fontSize: "0.82rem", color: "var(--ink-muted)", lineHeight: 1.55, margin: 0,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {a.bio_short || a.aiSummary}
                  </p>
                )}
                {repWork && (
                  <p style={{ fontSize: "0.78rem", color: "var(--ink-faint)", fontWeight: 700, margin: "2px 0 0" }}>
                    〈{repWork}〉
                  </p>
                )}
                <div style={{
                  marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  fontSize: "0.8rem", fontWeight: 800, color: "var(--navy)",
                }}>
                  <span>포퐄 보기</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          );
        })}
      </motion.div>
    </section>
  );
}

