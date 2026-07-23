"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import FlippingArtistCard from "./FlippingArtistCard";
import type { Artist } from "@/types";

interface ArtistCarouselProps {
  title: string;
  subtitle?: string;
  artists: Artist[];
  showNewBadge?: boolean;
}

export default function ArtistCarousel({ title, subtitle, artists, showNewBadge = false }: ArtistCarouselProps) {
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
      const scrollAmount = dir === "left" ? -350 : 350;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (artists.length === 0) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let lastTs: number | null = null;
    let rafId: number;
    const speed = 24; // px per second

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
    <section className="home-section artist-carousel-section" style={{
      padding: "60px 32px",
      maxWidth: "1120px",
      margin: "0 auto",
      borderTop: "1px solid var(--border)",
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
        className="no-scrollbar artist-carousel-track"
        style={{
          display: "flex",
          gap: "28px",
          overflowX: "auto",
          padding: "10px 4px 30px",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {artists.map((a) => {
          return (
            <div key={a.id} className="artist-carousel-slot" style={{
              minWidth: "260px",
              maxWidth: "260px",
              flex: "0 0 auto",
              scrollSnapAlign: "start",
              position: "relative"
            }}>
              <div className="card-hover-wrapper" style={{ transition: "transform 0.3s ease" }}>
                {/* Fixed 260px design-width inner box — on mobile this is shrunk via CSS
                    transform: scale() (see globals.css), which scales every bit of the
                    card's internal content (fonts, badges, barcode) uniformly and keeps
                    every ratio intact, instead of relying on PopokCard's own fixed px
                    values to somehow shrink themselves. Desktop is untouched (scale: 1). */}
                <div className="artist-carousel-scale" style={{ position: "relative" }}>
                  <FlippingArtistCard
                    name={a.name}
                    nameEn={a.name_en || undefined}
                    genre={a.genre || "CREATIVE"}
                    instagram={a.instagram || ""}
                    id={a.id}
                    slug={a.slug || a.id}
                    profileImage={a.profileImage || undefined}
                  />
                  {showNewBadge && (
                    <span style={{
                      position: "absolute", top: "16px", left: "16px", zIndex: 100,
                      background: "var(--accent-dark)", color: "var(--navy)", border: "1px solid var(--navy)",
                      fontSize: "0.62rem", fontWeight: 950, padding: "4px 8px", borderRadius: "6px",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.12)", letterSpacing: "0.05em"
                    }}>
                      NEW
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        .card-hover-wrapper:hover {
          transform: translateY(-4px);
        }
      `}</style>
    </section>
  );
}
