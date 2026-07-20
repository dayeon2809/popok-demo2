"use client";

import React, { useState } from "react";
import type { Company } from "@/types";
import { normalizeWorkImages } from "@/lib/company-works";
import WorkDrawer from "./WorkDrawer";

interface CompanyPortfolioProps {
  company: Company;
}

const WorkImagePlaceholder = ({ company }: { company: any }) => (
  <div style={{
    width: "100%",
    height: "100%",
    backgroundColor: "#FAF9F5",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    color: "var(--navy)",
    gap: "8px",
  }}>
    <span style={{ fontWeight: 950, fontSize: "1rem", letterSpacing: "-0.04em", display: "flex", alignItems: "center", gap: "2px" }}>
      POPOK
      <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: company.brand_color || "#171411" }} />
    </span>
    <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      No Image Archive
    </span>
  </div>
);

function formatShortRole(role: string | null | undefined): string {
  if (!role || !role.trim()) return "안무";
  const trimmed = role.trim();
  // If role contains long credit list (e.g., "안무: 윤경근, 드라마투르그: 박지현...")
  if (trimmed.includes(":") || trimmed.includes("드라마투르그") || trimmed.includes("무용수:") || trimmed.length > 30) {
    const firstPart = trimmed.split(":")[0].trim();
    if (firstPart && firstPart.length < 20) {
      return firstPart;
    }
    return "안무";
  }
  return trimmed;
}

export default function CompanyPortfolio({ company }: CompanyPortfolioProps) {
  const [activeWork, setActiveWork] = useState<any | null>(null);

  const works = company.works || [];

  return (
    <section
      style={{
        padding: "50px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <style jsx global>{`
        .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 36px 28px;
        }
        .portfolio-tile {
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .portfolio-image-wrapper {
          position: relative;
          aspect-ratio: 1.4;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--border);
          background-color: #FAF8F5;
        }
        .portfolio-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .portfolio-tile:hover .portfolio-image {
          transform: scale(1.03);
        }
        .portfolio-tile:hover .work-title {
          text-decoration: underline;
        }
        .portfolio-caption {
          padding-top: 12px;
          display: flex;
          flex-direction: column;
        }
        .caption-meta {
          font-family: monospace;
          font-size: 0.68rem;
          color: var(--ink-faint);
          display: flex;
          align-items: center;
          gap: 6px;
          text-transform: uppercase;
        }
        .genre-tag {
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .work-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--navy);
          margin: 4px 0 2px 0;
          letter-spacing: -0.02em;
          line-height: 1.35;
        }
        .work-role {
          font-size: 0.76rem;
          color: var(--ink-muted);
          font-weight: 500;
        }
        @media (max-width: 768px) {
          .portfolio-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px 12px !important;
          }
          .portfolio-image-wrapper {
            aspect-ratio: 1.5 !important;
          }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "28px" }}>
        <h3
          className="mono"
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            color: "var(--navy)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Selected Works
        </h3>
        <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>
          {works.length} ARCHIVES
        </span>
      </div>

      {works.length === 0 ? (
        <div
          style={{
            padding: "50px 24px",
            textAlign: "center",
            border: "1px dashed var(--border)",
            borderRadius: "4px",
            color: "var(--ink-muted)",
            fontSize: "0.82rem",
          }}
        >
          등록된 대표 작품이 없습니다.
        </div>
      ) : (
        <div className="portfolio-grid">
          {works.map((work: any, idx: number) => {
            const workImages = normalizeWorkImages(work);
            const hasImage = workImages.length > 0;
            const imageUrl = hasImage ? workImages[0] : "";

            return (
              <div
                key={work.id || idx}
                onClick={() => setActiveWork(work)}
                className="portfolio-tile"
              >
                {/* Image Wrapper */}
                <div className="portfolio-image-wrapper">
                  {hasImage ? (
                    <img
                      src={imageUrl}
                      alt={work.title}
                      className="portfolio-image"
                    />
                  ) : (
                    <WorkImagePlaceholder company={company} />
                  )}
                </div>

                {/* Text Caption underneath */}
                <div className="portfolio-caption">
                  <div className="caption-meta">
                    <span className="genre-tag" style={{ color: company.brand_color || "var(--navy)" }}>
                      {work.genre || work.category || "PERFORMANCE"}
                    </span>
                    <span className="dot">•</span>
                    <span>{work.year || "n.d."}</span>
                  </div>
                  <h4 className="work-title">{work.title}</h4>
                  <div className="work-role">{formatShortRole(work.role)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeWork && (
        <WorkDrawer
          work={activeWork}
          company={company}
          onClose={() => setActiveWork(null)}
        />
      )}
    </section>
  );
}
