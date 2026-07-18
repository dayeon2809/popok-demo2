"use client";

import React from "react";
import type { Company, Performance } from "@/types";
import { getPerformanceExternalLink } from "@/lib/performanceLinks";

interface CompanyUpcomingPerformancesProps {
  company: Company;
  performances: Performance[];
}

export default function CompanyUpcomingPerformances({
  company,
  performances = [],
}: CompanyUpcomingPerformancesProps) {
  if (performances.length === 0) return null;

  const brandAccent = company.brand_color || "#C8EE52"; // default popok point color

  const formatPerformanceDates = (startDate?: string | null, endDate?: string | null) => {
    if (!startDate) return "";
    const start = startDate.replace(/-/g, ".");
    if (!endDate || startDate === endDate) return start;
    const end = endDate.replace(/-/g, ".");
    return `${start} - ${end}`;
  };

  return (
    <section
      style={{
        padding: "50px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <style jsx global>{`
        .upcoming-performances-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
          gap: 40px 32px;
        }
        .performance-card {
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border);
          border-radius: 4px;
          background: #FFFFFF;
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          text-decoration: none;
          color: inherit;
        }
        .performance-card:hover {
          border-color: var(--navy);
          box-shadow: 0 8px 24px rgba(23, 20, 17, 0.04);
        }
        .poster-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1.414; /* Standard poster ratio */
          background-color: #F6F5F2;
          overflow: hidden;
          border-bottom: 1px solid var(--border);
        }
        .poster-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .performance-card:hover .poster-image {
          transform: scale(1.02);
        }
        .performance-info {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .perf-genre-tag {
          font-family: monospace;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--ink-faint);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }
        .perf-title {
          font-size: 1.05rem;
          font-weight: 900;
          color: var(--navy);
          margin: 0 0 8px 0;
          line-height: 1.35;
          letter-spacing: -0.02em;
        }
        .perf-meta-row {
          font-size: 0.8rem;
          color: var(--ink-muted);
          margin-bottom: 4px;
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .perf-description {
          font-size: 0.8rem;
          color: var(--ink-muted);
          line-height: 1.5;
          margin: 12px 0;
          display: -webkit-box;
          WebkitLineClamp: 2;
          WebkitBoxOrient: "vertical";
          overflow: hidden;
          flex-grow: 1;
          word-break: keep-all;
        }
        .perf-cta-row {
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--navy);
        }
        
        /* Poster Placeholder */
        .poster-placeholder {
          width: 100%;
          height: 100%;
          background: #FAF8F5;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }
        .placeholder-accent-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background-color: ${brandAccent};
        }
        .placeholder-date-badge {
          align-self: flex-start;
          font-family: monospace;
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--navy);
          border: 1px solid var(--navy);
          padding: 2px 6px;
          border-radius: 2px;
        }
        .placeholder-title {
          font-size: 1.15rem;
          font-weight: 900;
          color: var(--navy);
          line-height: 1.3;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .placeholder-venue {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--ink-muted);
        }

        @media (max-width: 768px) {
          .upcoming-performances-grid {
            grid-template-columns: 1fr !important; /* 1-column list on mobile */
            gap: 24px !important;
          }
          .performance-card {
            flex-direction: row !important; /* side-by-side or standard list */
            height: 160px;
          }
          .poster-wrapper {
            width: 110px !important;
            height: 100% !important;
            aspect-ratio: auto !important;
            flex-shrink: 0;
            border-bottom: none !important;
            border-right: 1px solid var(--border);
          }
          .performance-info {
            padding: 12px 16px !important;
            justify-content: space-between;
          }
          .perf-title {
            font-size: 0.95rem !important;
            margin-bottom: 4px !important;
          }
          .perf-description {
            display: none !important; /* hide description on mobile */
          }
          .perf-meta-row {
            font-size: 0.75rem !important;
            margin-bottom: 2px !important;
          }
          .perf-cta-row {
            padding-top: 6px !important;
            border-top: none !important;
          }
          .poster-placeholder {
            padding: 12px !important;
          }
          .placeholder-title {
            font-size: 0.85rem !important;
          }
          .placeholder-venue {
            font-size: 0.72rem !important;
          }
          .placeholder-date-badge {
            font-size: 0.62rem !important;
            padding: 1px 4px !important;
          }
        }
      `}</style>

      {/* Header Titles */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "28px" }}>
        <div>
          <h3
            className="mono"
            style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              color: "var(--navy)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "4px",
            }}
          >
            다가오는 공연
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--ink-muted)", fontWeight: 500 }}>
            이 단체의 새로운 공연과 활동 소식을 확인해보세요.
          </span>
        </div>
        <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>
          {performances.length} UPCOMING
        </span>
      </div>

      {/* Grid List Container */}
      <div className="upcoming-performances-grid">
        {performances.map((perf) => {
          const hasPoster = !!perf.posterUrl;
          const displayDates = formatPerformanceDates(perf.startDate, perf.endDate);
          // externalUrl > ticketUrl > sourceUrl — same priority as the home
          // carousel (lib/performanceLinks.ts). A performance with none of
          // the three still renders as a card, just without a clickable CTA.
          const link = getPerformanceExternalLink(perf);
          const CardTag = link ? "a" : "div";

          return (
            <CardTag
              key={perf.id}
              {...(link ? { href: link, target: "_blank", rel: "noopener noreferrer" } : {})}
              className="performance-card"
            >
              {/* Poster Section */}
              <div className="poster-wrapper">
                {hasPoster ? (
                  <img
                    src={perf.posterUrl!}
                    alt={`${perf.title} 포스터`}
                    className="poster-image"
                  />
                ) : (
                  <div className="poster-placeholder">
                    {/* Top border accent line using company brand color */}
                    <div className="placeholder-accent-line" />
                    
                    {/* Date label */}
                    <div className="placeholder-date-badge">
                      {perf.startDate ? perf.startDate.replace(/-/g, ".") : "UPCOMING"}
                    </div>
                    
                    {/* Title */}
                    <div>
                      <h4 className="placeholder-title">{perf.title}</h4>
                    </div>
                    
                    {/* Venue */}
                    <div className="placeholder-venue">
                      📍 {perf.venue || "미정"}
                    </div>
                  </div>
                )}
              </div>

              {/* Text Info Section */}
              <div className="performance-info">
                <div>
                  <div className="perf-genre-tag">
                    {perf.genre || perf.category || "PERFORMANCE"}
                  </div>
                  <h4 className="perf-title">{perf.title}</h4>
                  
                  <div className="perf-meta-row">
                    <span style={{ fontWeight: 800, color: "var(--navy)" }}>일정:</span>
                    <span>{displayDates || "상세 일정 미정"}</span>
                  </div>
                  
                  <div className="perf-meta-row">
                    <span style={{ fontWeight: 800, color: "var(--navy)" }}>장소:</span>
                    <span>{perf.venue || "추후 공지"}</span>
                  </div>
                </div>

                <p className="perf-description">
                  {perf.description || `${perf.title} 공연 정보입니다. 자세한 예매 및 예매처 정보는 안내 링크를 확인해주시기 바랍니다.`}
                </p>

                {link && (
                  <div className="perf-cta-row">
                    <span>공연 정보 보기 ↗</span>
                  </div>
                )}
              </div>
            </CardTag>
          );
        })}
      </div>
    </section>
  );
}
