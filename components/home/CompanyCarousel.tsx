"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import FlippingCompanyCard from "./FlippingCompanyCard";
import type { Company } from "@/types";

interface CompanyCarouselProps {
  title: string;
  subtitle?: string;
  companies: Company[];
  /** Optional link shown below the subtitle, e.g. to the full company directory. */
  moreLink?: { label: string; href: string };
}

export default function CompanyCarousel({ title, subtitle, companies, moreLink }: CompanyCarouselProps) {
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
    if (companies.length === 0) return;
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
  }, [companies.length]);

  if (companies.length === 0) return null;

  return (
    <section className="home-section company-carousel-section" style={{
      padding: "60px 32px",
      maxWidth: "1120px",
      margin: "0 auto",
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
          {moreLink && (
            <Link
              href={moreLink.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "8px",
                fontSize: "0.82rem",
                fontWeight: 800,
                color: "var(--navy)",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              {moreLink.label} →
            </Link>
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
        className="no-scrollbar company-carousel-track"
        style={{
          display: "flex",
          gap: "28px",
          overflowX: "auto",
          padding: "10px 4px 30px",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {companies.map((c) => {
          return (
            <div key={c.id} className="company-carousel-slot" style={{
              minWidth: "260px",
              maxWidth: "260px",
              flex: "0 0 auto",
              scrollSnapAlign: "start",
              position: "relative"
            }}>
              <div className="card-hover-wrapper" style={{ transition: "transform 0.3s ease" }}>
                <div className="company-carousel-scale" style={{ position: "relative" }}>
                  <FlippingCompanyCard company={c} />
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
