"use client";

import React from "react";
import Link from "next/link";
import type { Company } from "@/types";

interface RelatedCompaniesProps {
  currentCompany: Company;
  relatedCompanies: Company[];
}

export default function RelatedCompanies({ currentCompany, relatedCompanies = [] }: RelatedCompaniesProps) {
  const brandAccent = currentCompany.brand_color || "#171411";

  const displayList = relatedCompanies.length > 0
    ? relatedCompanies
    : [
        {
          id: "ldp-dance",
          name: "LDP (Laboratory Dance Project)",
          name_en: "LDP",
          genre: "Contemporary Dance",
          slug: "ldp-dance",
          bio_short: "신체 고유의 물리적 한계에 도전하며 파괴력 있는 현대무용을 선보이는 프로젝트 단체",
        },
        {
          id: "ambiguous-dance",
          name: "앰비규어스 댄스 컴퍼니",
          name_en: "Ambiguous Dance Company",
          genre: "Contemporary Dance",
          slug: "ambiguous-dance",
          bio_short: "장르의 경계를 넘어 독창적인 시각과 대중성을 확보한 글로벌 무용단",
        },
        {
          id: "seo-ballet",
          name: "서울발레시어터",
          name_en: "Seoul Ballet Theater",
          genre: "Ballet",
          slug: "seo-ballet",
          bio_short: "클래식 발레의 전통 위에 모던 발레의 독창성을 더하는 국내 대표 민간 발레단",
        },
      ];

  return (
    <section
      style={{
        padding: "60px 0 0 0",
      }}
    >
      <style jsx global>{`
        .related-grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .related-card {
          text-decoration: none;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          background: #FFFFFF;
          box-shadow: 0 4px 16px rgba(23, 20, 17, 0.01);
          transition: border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .related-card:hover {
          border-color: var(--navy);
          box-shadow: 0 12px 24px rgba(23, 20, 17, 0.06);
          transform: translateY(-4px);
        }
        @media (max-width: 768px) {
          .related-grid-container {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px 10px !important;
          }
          .related-card {
            border-radius: 8px !important;
          }
          .related-thumb-wrapper {
            aspect-ratio: 2.1 !important;
          }
          .related-info-panel {
            padding: 12px 10px !important;
          }
          .related-title {
            font-size: 0.85rem !important;
            margin-bottom: 2px !important;
          }
          .related-desc {
            font-size: 0.68rem !important;
            line-height: 1.4 !important;
            margin-bottom: 8px !important;
          }
          .related-cta {
            font-size: 0.68rem !important;
            margin-top: 4px !important;
          }
        }
      `}</style>

      <h3
        className="mono"
        style={{
          fontSize: "0.72rem",
          fontWeight: 800,
          color: "var(--navy)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "28px",
        }}
      >
        You may also like
      </h3>

      <div className="related-grid-container">
        {displayList.map((comp, idx) => {
          const compHref = `/companies/${encodeURIComponent(comp.slug || comp.id)}`;
          const compImage =
            comp.profile_image_url ||
            (comp.profile_image_urls && comp.profile_image_urls[0]) ||
            `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(comp.name)}`;

          return (
            <Link
              key={comp.id || idx}
              href={compHref}
              className="related-card"
            >
              {/* Thumbnail image */}
              <div className="related-thumb-wrapper" style={{ width: "100%", aspectRatio: "1.7", overflow: "hidden", background: "#FAF8F5" }}>
                <img
                  src={compImage}
                  alt={comp.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              {/* Info text */}
              <div className="related-info-panel" style={{ padding: "20px", height: "150px" }}>
                <span
                  className="mono"
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: 800,
                    color: brandAccent,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {comp.genre || "ORGANIZATION"}
                </span>

                <h4
                  className="related-title"
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: "var(--navy)",
                    margin: "0 0 6px 0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    letterSpacing: "-0.01em"
                  }}
                >
                  {comp.name}
                </h4>

                <p
                  className="related-desc"
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--ink-muted)",
                    lineHeight: 1.45,
                    margin: 0,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {comp.bio_short || "POPOK 등록 창작 단체 아카이브 포트폴리오"}
                </p>

                <span
                  className="related-cta"
                  style={{
                    display: "inline-block",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "var(--navy)",
                    marginTop: "12px",
                    borderBottom: `1.5px solid ${brandAccent}`,
                    paddingBottom: "1px",
                  }}
                >
                  Explore Brand →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
