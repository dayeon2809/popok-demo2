"use client";

import { useEffect, useRef, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function StatsCTA({
  totalArtists = 48,
  individualArtists = 36,
  organizations = 12,
  totalWorks = 137
}: {
  totalArtists?: number;
  individualArtists?: number;
  organizations?: number;
  totalWorks?: number;
}) {
  const STATS = [
    { value: totalArtists, suffix: "명", label: "등록 아티스트" },
    { value: individualArtists, suffix: "명", label: "개인 안무가" },
    { value: organizations, suffix: "개", label: "무용단·단체" },
    { value: totalWorks, suffix: "개", label: "등록 작품" },
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);
  const [counts, setCounts] = useState<number[]>(() => STATS.map(() => 0));

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const runAnimation = () => {
      if (hasAnimatedRef.current) return;
      hasAnimatedRef.current = true;

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) {
        setCounts(STATS.map((s) => s.value));
        return;
      }

      const duration = 1400;
      let startTs: number | null = null;

      const step = (ts: number) => {
        if (startTs === null) startTs = ts;
        const progress = Math.min((ts - startTs) / duration, 1);
        const eased = easeOutCubic(progress);
        setCounts(STATS.map((s) => Math.round(s.value * eased)));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) runAnimation();
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [totalArtists, individualArtists, organizations, totalWorks]);

  return (
    <section className="home-section" style={{
      padding: "60px 32px",
      maxWidth: "1120px",
      margin: "0 auto",
    }}>
      {/* Title */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{
          fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
          color: "var(--navy)",
          fontWeight: 950,
          letterSpacing: "-0.03em",
          margin: "0 0 6px"
        }}>
          Artist DB 현황
        </h2>
        <p style={{
          fontSize: "0.85rem",
          color: "var(--ink-muted)",
          fontWeight: 700,
          margin: "0 0 10px"
        }}>
          POPOK은 흩어진 공연 기록을 하나의 도메인으로 연결해 나갑니다.
        </p>
        {false && (
          <a
            href="https://knowledge-popok.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.82rem",
              fontWeight: 800,
              color: "var(--navy)",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            POPOK이 구축한 데이터베이스 살펴보기 ↗
          </a>
        )}
      </div>

      {/* Dark container */}
      <div
        ref={containerRef}
        style={{
          background: "var(--navy)",
          border: "1.5px solid var(--border-dark)",
          borderRadius: "24px",
          padding: "48px 32px",
          boxShadow: "0 12px 36px rgba(23, 20, 17, 0.1)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "32px",
          textAlign: "center"
        }}
      >
        {STATS.map((stat, idx) => (
          <div key={stat.label} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 950,
              color: "var(--accent)",
              letterSpacing: "-0.02em"
            }}>
              {counts[idx]}{stat.suffix}
            </span>
            <span style={{
              fontSize: "0.78rem",
              fontWeight: 800,
              color: "rgba(255, 255, 255, 0.6)",
              textTransform: "uppercase"
            }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
