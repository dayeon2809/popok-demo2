"use client";

import { testimonials } from "@/data/testimonials";

export default function TestimonialsPreview() {
  const previewList = testimonials.slice(0, 3);
  if (previewList.length === 0) return null;

  return (
    <section className="home-section" style={{
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
          POPOK을 먼저 경험한 아티스트들
        </h2>
        <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.65)", fontWeight: 600, margin: "6px 0 0" }}>
          흩어져 있던 작업이 하나의 프로필이 되었습니다.
        </p>
      </div>

      <div
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
            style={{
              flex: "0 0 auto",
              width: "320px",
              scrollSnapAlign: "start",
              background: "#FFFFFF",
              borderRadius: "20px",
              border: "1.5px solid var(--border)",
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "220px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            }}
          >
            <p style={{
              fontSize: "1rem",
              color: "var(--navy)",
              lineHeight: 1.6,
              fontWeight: 800,
              marginBottom: "24px",
              margin: 0
            }}>
              “{t.quote}”
            </p>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid var(--border)",
              paddingTop: "14px",
              marginTop: "10px"
            }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "var(--navy)" }}>
                {t.name}
              </span>
              <span style={{
                fontSize: "0.7rem", fontWeight: 800, color: "var(--accent-dark)",
                background: "var(--navy)", padding: "4px 8px", borderRadius: "6px"
              }}>
                {t.genre}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
