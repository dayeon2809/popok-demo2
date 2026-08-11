"use client";

import { useEffect, useRef, useState } from "react";
import { testimonials } from "@/data/testimonials";
import { useLanguage } from "@/lib/useLanguage";

export default function TestimonialsPreview() {
  const { language } = useLanguage();
  const en = language === "en";
  const previewList = testimonials;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timerId = setInterval(() => {
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      const firstChild = el.firstElementChild as HTMLElement;
      const cardWidth = firstChild?.getBoundingClientRect().width || 320;
      const style = window.getComputedStyle(el);
      const gap = parseInt(style.gap || "24px", 10) || 24;
      const step = cardWidth + gap;

      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: step, behavior: "smooth" });
      }
    }, 4000);

    return () => clearInterval(timerId);
  }, [isPaused]);

  if (previewList.length === 0) return null;

  return (
    <section className="home-section testimonials-preview-section" style={{
      background: "var(--navy)",
      padding: "80px 32px",
      overflow: "hidden",
    }}>
      <div style={{ maxWidth: "1120px", margin: "0 auto", marginBottom: "40px" }}>
        <span className="mono" style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
          TESTIMONIALS
        </span>
        <h2 className="display" style={{
          fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
          color: "#FFFFFF",
          fontWeight: 950,
          letterSpacing: "-0.03em",
          marginBottom: "12px",
          margin: 0
        }}>
          {en ? "Artists who experienced POPOK first" : "POPOK을 먼저 경험한 아티스트들"}
        </h2>
        <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.65)", fontWeight: 600, margin: "6px 0 0" }}>
          {en ? "Scattered work became one coherent profile." : "흩어져 있던 작업이 하나의 프로필이 되었습니다."}
        </p>
      </div>

      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: "24px",
          overflowX: "auto",
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "4px 4px 12px",
          scrollSnapType: "x proximity",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {previewList.map((t, idx) => (
          <div
            key={idx}
            className="testimonial-card"
            style={{
              flex: "0 0 auto",
              width: "320px",
              scrollSnapAlign: "start",
              background: "#FFFFFF",
              borderRadius: "18px",
              border: "1.5px solid var(--border)",
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "240px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            }}
          >
            <div>
              <div style={{ color: "var(--accent-yellow)", fontSize: "0.85rem", marginBottom: "8px" }}>
                {"★".repeat(t.rating || 5)}
              </div>
              <p style={{
                fontSize: "0.92rem",
                color: "var(--navy)",
                lineHeight: 1.6,
                fontWeight: 700,
                marginBottom: "24px",
                margin: 0,
                whiteSpace: "pre-line"
              }}>
                “{en ? t.quoteEn : t.quote}”
              </p>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid var(--border)",
              paddingTop: "14px",
              marginTop: "10px"
            }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "var(--navy)" }}>
                {en ? t.nameEn : t.name}
              </span>
              <span style={{
                fontSize: "0.7rem", fontWeight: 800, color: "var(--accent-dark)",
                background: "var(--navy)", padding: "4px 8px", borderRadius: "6px"
              }}>
                {en ? t.genreEn : t.genre}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
