"use client";

import React from "react";
import type { Company } from "@/types";
import { normalizeCompanyAwards, type CompanyAward } from "@/lib/company";

interface LinkItem {
  label?: string;
  url?: string;
}

interface CompanyAwardsLinksProps {
  company: Company;
}

// AWARDS was already fully populated/editable in the admin-only preview
// (companies.awards, structured {year,title,organization,result}[]) but never
// rendered on the public page. This exposes that same data + normalizer
// (lib/company.ts normalizeCompanyAwards) publicly, paired with LINKS in a
// 2-col layout — each card independently hidden when empty, and the whole
// section hidden when both are.
export default function CompanyAwardsLinks({ company }: CompanyAwardsLinksProps) {
  const brandAccent = (company as any).brand_color || "#171411";
  const awards = normalizeCompanyAwards((company as any).awards);
  const links: LinkItem[] = (Array.isArray((company as any).links) ? (company as any).links : []).filter(
    (l: any) => l && typeof l === "object" && (l.url || l.label)
  );

  const hasAwards = awards.length > 0;
  const hasLinks = links.length > 0;
  if (!hasAwards && !hasLinks) return null;

  const bothPresent = hasAwards && hasLinks;

  // "제목 - 기관명" — the year is rendered separately (bold, left column), so
  // this only needs the remainder, gracefully omitting a missing organization.
  const formatAwardBody = (award: CompanyAward): string => {
    const title = award.title || "";
    if (award.organization) return title ? `${title} - ${award.organization}` : award.organization;
    return title;
  };

  return (
    <section style={{ padding: "50px 0", borderBottom: "1px solid var(--border)" }}>
      <style jsx global>{`
        .awards-links-grid {
          display: grid;
          gap: 48px;
        }
        .awards-links-grid[data-cols="2"] {
          grid-template-columns: 1fr 1fr;
        }
        .awards-links-grid[data-cols="1"] {
          grid-template-columns: 1fr;
        }
        @media (max-width: 768px) {
          .awards-links-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
        }
      `}</style>

      <div className="awards-links-grid" data-cols={bothPresent ? "2" : "1"}>
        {hasAwards && (
          <div>
            <h3
              className="mono"
              style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                color: "var(--navy)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              Awards
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {awards.map((award, idx) => (
                <div key={idx} style={{ display: "flex", gap: "10px", fontSize: "0.85rem", lineHeight: 1.5, color: "var(--navy)" }}>
                  {award.year && (
                    <span className="mono" style={{ fontWeight: 800, color: brandAccent, flexShrink: 0 }}>
                      {award.year}
                    </span>
                  )}
                  <span style={{ color: "var(--ink-muted)" }}>{formatAwardBody(award)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasLinks && (
          <div>
            <h3
              className="mono"
              style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                color: "var(--navy)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              Links
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "var(--navy)",
                    textDecoration: "none",
                    borderBottom: `1px solid ${brandAccent}`,
                    paddingBottom: "2px",
                    alignSelf: "flex-start",
                  }}
                >
                  {link.label || link.url} ↗
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
