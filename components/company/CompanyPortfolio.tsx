"use client";

import React, { useState } from "react";
import type { Company } from "@/types";
import WorkDrawer from "./WorkDrawer";

interface CompanyPortfolioProps {
  company: Company;
}

export default function CompanyPortfolio({ company }: CompanyPortfolioProps) {
  const [activeWork, setActiveWork] = useState<any | null>(null);

  const works = company.works || [];

  return (
    <section
      style={{
        padding: "60px 0",
        borderBottom: "1.5px solid var(--border)",
      }}
    >
      <style jsx global>{`
        .portfolio-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }
        .portfolio-tile {
          position: relative;
          aspect-ratio: 1.25;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          background-color: #FAF8F5;
          border: 1px solid var(--border-light);
          box-shadow: 0 4px 16px rgba(23, 20, 17, 0.02);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .portfolio-tile:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 16px 32px rgba(23, 20, 17, 0.08);
          border-color: var(--border-dark);
        }
        .portfolio-tile:hover .overlay {
          opacity: 1 !important;
        }
        .portfolio-tile:hover img {
          transform: scale(1.04);
        }
        @media (max-width: 768px) {
          .portfolio-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px 10px !important;
          }
          .portfolio-tile {
            border-radius: 8px !important;
            aspect-ratio: 1.1 !important;
          }
          /* On mobile touch devices, keep overlay readable */
          .portfolio-tile .overlay {
            background: linear-gradient(to top, rgba(23, 20, 17, 0.9) 0%, rgba(23, 20, 17, 0.3) 100%) !important;
            opacity: 1 !important;
            padding: 12px 10px !important;
          }
          .portfolio-tile .overlay-genre {
            font-size: 0.58rem !important;
            margin-bottom: 2px !important;
          }
          .portfolio-tile .overlay-title {
            font-size: 0.85rem !important;
            margin-bottom: 2px !important;
          }
          .portfolio-tile .overlay-meta {
            font-size: 0.65rem !important;
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
            padding: "60px 24px",
            textAlign: "center",
            border: "1px dashed var(--border)",
            borderRadius: "14px",
            color: "var(--ink-muted)",
            fontSize: "0.85rem",
          }}
        >
          등록된 대표 작품이 없습니다.
        </div>
      ) : (
        <div className="portfolio-grid">
          {works.map((work: any, idx: number) => {
            const imageUrl =
              work.image_url ||
              work.image ||
              (work.media && work.media.src) ||
              "/images/placeholders/cake-placeholder.png";

            return (
              <div
                key={work.id || idx}
                onClick={() => setActiveWork(work)}
                className="portfolio-tile"
              >
                {/* Image */}
                <img
                  src={imageUrl}
                  alt={work.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />

                {/* Hover Overlay */}
                <div
                  className="overlay"
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(23, 20, 17, 0.78)",
                    opacity: 0,
                    transition: "opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: "20px",
                    color: "#FFFFFF",
                  }}
                >
                  <span
                    className="overlay-genre mono"
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      color: company.brand_color || "var(--accent)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                      display: "block",
                    }}
                  >
                    {work.genre || work.category || "PERFORMANCE"}
                  </span>
                  <h4
                    className="overlay-title"
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      margin: "0 0 2px 0",
                      color: "#FFFFFF",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.3,
                    }}
                  >
                    {work.title}
                  </h4>
                  <div
                    className="overlay-meta"
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--ink-faint)",
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                    }}
                  >
                    <span>{work.year || "n.d."}</span>
                    <span>•</span>
                    <span>{work.role || "Choreography"}</span>
                  </div>
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
