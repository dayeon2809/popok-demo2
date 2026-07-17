"use client";

import { useEffect, useRef, useState } from "react";
import { testimonials } from "@/data/testimonials";

export default function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isPaused) return;

    const timerId = setInterval(() => {
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      const firstChild = el.firstElementChild as HTMLElement;
      const cardWidth = firstChild?.getBoundingClientRect().width || 300;
      const style = window.getComputedStyle(el);
      const gap = parseInt(style.gap || "20px", 10) || 20;
      const step = cardWidth + gap;

      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: step, behavior: "smooth" });
      }
    }, 4000);

    return () => clearInterval(timerId);
  }, [isPaused]);

  if (testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="home-section" style={{
      background: "var(--navy)",
      padding: "100px 0",
      overflow: "hidden",
    }}>
      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 32px", marginBottom: "48px" }}>
        <span className="mono" style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
          TESTIMONIALS
        </span>
        <h2 className="display" style={{
          fontSize: "clamp(2rem, 4vw, 2.8rem)",
          color: "#FFFFFF",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          marginBottom: "12px"
        }}>
          POPOK을 먼저 경험한 아티스트들
        </h2>
        <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>
          흩어져 있던 작업이 하나의 프로필이 되었습니다.
        </p>
      </div>

      {/* Edge-bleeding horizontal card row — cards get cut off at the viewport edges
          to hint that more testimonials continue off-screen. Scrolls via touch swipe
          on mobile and trackpad/scroll on desktop. */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="no-scrollbar testimonial-row"
        style={{
          display: "flex",
          gap: "20px",
          overflowX: "auto",
          padding: "4px 32px 8px",
          scrollSnapType: "x proximity",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {testimonials.map((t, idx) => (
          <div
            key={idx}
            className="testimonial-card"
            style={{
              flex: "0 0 auto",
              width: "300px",
              scrollSnapAlign: "start",
              background: "#FFFFFF",
              borderRadius: "20px",
              border: "1px solid var(--border)",
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "230px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
            }}
          >
            <div>
              <div style={{ color: "var(--accent-yellow)", fontSize: "0.85rem", marginBottom: "8px" }}>
                {"★".repeat(t.rating || 5)}
              </div>
              <p style={{
                fontSize: "0.95rem",
                color: "var(--navy)",
                lineHeight: 1.6,
                fontWeight: 700,
                marginBottom: "24px",
                whiteSpace: "pre-line"
              }}>
                “{t.quote}”
              </p>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid var(--border)",
              paddingTop: "14px",
            }}>
              <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--navy)" }}>
                {t.name}
              </span>
              <span className="tag">{t.genre}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
