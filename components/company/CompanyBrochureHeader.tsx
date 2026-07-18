"use client";

import React from "react";
import type { Company } from "@/types";

interface CompanyBrochureHeaderProps {
  company: Company;
  artistCount: number;
}

function hexToRgb(hexColor: string) {
  const hex = hexColor.replace("#", "");
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  if (hex.length === 3) {
    const r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    const g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    const b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
    return `${r}, ${g}, ${b}`;
  }
  return "200, 238, 82";
}

// Shared between the public Company Detail page and the Admin CMS live
// preview so both stay structurally identical — see app/companies/[slug]/CompanyClientView.tsx
// and app/admin/companies/[id]/page.tsx.
export default function CompanyBrochureHeader({ company, artistCount }: CompanyBrochureHeaderProps) {
  const brandAccent = company.brand_color || "#C8EE52";
  const rgbAccent = hexToRgb(brandAccent);
  const workCount = Array.isArray(company.works) ? company.works.length : 0;

  const heroImage =
    company.hero_image_url ||
    (company.profile_image_urls && company.profile_image_urls[0]) ||
    company.profile_image_url ||
    null;

  return (
    <>
      <style jsx>{`
        .brochure-header-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 48px;
          margin-bottom: 48px;
          align-items: start;
        }
        .meta-table {
          width: 100%;
          border-top: 1px solid var(--border-dark, #171411);
          border-collapse: collapse;
          font-size: 0.82rem;
        }
        .meta-table tr {
          border-bottom: 1px solid var(--border, #e6e2d8);
        }
        .meta-table td {
          padding: 12px 4px;
          color: var(--navy);
        }
        .meta-table td.label {
          font-family: monospace;
          color: var(--ink-faint);
          font-weight: 700;
          text-transform: uppercase;
          width: 100px;
        }
        .meta-table td.value {
          font-weight: 800;
          text-align: right;
        }
        .logo-badge {
          width: 48px;
          height: 48px;
          border-radius: 4px;
          object-fit: cover;
          border: 1px solid var(--border);
          margin-bottom: 16px;
        }
        .brochure-bio-box {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }
        @media (max-width: 768px) {
          .brochure-header-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            margin-bottom: 32px !important;
          }
        }
      `}</style>

      {/* Brochure Header Section */}
      <div className="brochure-header-grid">
        {/* Left Column: Title & Bio */}
        <div>
          {(company.logo_url || company.profile_image_url) && (
            <img
              src={company.logo_url || company.profile_image_url || ""}
              alt={`${company.name} Logo`}
              className="logo-badge"
            />
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
            <span className="mono" style={{ fontSize: "0.65rem", fontWeight: 800, backgroundColor: "var(--navy)", color: "#FFFFFF", padding: "4px 8px", borderRadius: "4px", letterSpacing: "0.08em" }}>
              {company.genre || company.category || "PERFORMING ARTS"}
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              margin: "0 0 12px 0",
              color: "var(--navy)",
              lineHeight: 1.1,
            }}
          >
            {company.name}
          </h1>

          {company.name_en && (
            <div className="mono" style={{ fontSize: "0.85rem", color: "var(--ink-faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
              {company.name_en}
            </div>
          )}

          {company.bio_short && (
            <p
              style={{
                fontSize: "1.05rem",
                fontWeight: 600,
                lineHeight: 1.5,
                margin: "0 0 24px 0",
                color: "var(--navy)",
                letterSpacing: "-0.01em",
                wordBreak: "keep-all",
              }}
            >
              "{company.bio_short}"
            </p>
          )}

          {company.bio && (
            <div className="brochure-bio-box">
              <p style={{ fontSize: "0.92rem", color: "var(--ink-muted)", lineHeight: 1.65, margin: 0, whiteSpace: "pre-line", wordBreak: "keep-all" }}>
                {company.bio}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Metadata Brochure Table */}
        <div style={{ position: "sticky", top: "80px" }}>
          <table className="meta-table">
            <tbody>
              <tr>
                <td className="label">Founded</td>
                <td className="value">{company.founded_year || "2021"}</td>
              </tr>
              <tr>
                <td className="label">Region</td>
                <td className="value">{company.city_or_region || "Seoul"}</td>
              </tr>
              <tr>
                <td className="label">Artists</td>
                <td className="value">{artistCount}</td>
              </tr>
              <tr>
                <td className="label">Works</td>
                <td className="value">{workCount}</td>
              </tr>
              <tr>
                <td className="label">Views</td>
                <td className="value">{company.view_count || 0}</td>
              </tr>
              {company.brand_color && (
                <tr>
                  <td className="label">Identity</td>
                  <td className="value" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "6px", border: "none", padding: "12px 4px" }}>
                    <span style={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: brandAccent, display: "inline-block", border: "1px solid var(--border)" }} />
                    <span style={{ fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700 }}>{brandAccent}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Quick Contact Links below the table */}
          {(company.email || company.website || company.instagram) && (
            <div style={{ marginTop: "24px" }}>
              <div className="mono" style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--ink-faint)", borderBottom: "1px solid var(--border-dark)", paddingBottom: "8px", marginBottom: "12px" }}>
                CONTACT
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.82rem" }}>
                {company.email && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontFamily: "monospace", color: "var(--ink-faint)", marginRight: "8px" }}>EMAIL</span>
                    <a href={`mailto:${company.email}`} style={{ fontWeight: 700, color: "var(--navy)", textDecoration: "none", wordBreak: "break-all", textAlign: "right" }}>{company.email}</a>
                  </div>
                )}
                {company.website && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontFamily: "monospace", color: "var(--ink-faint)", marginRight: "8px" }}>WEB</span>
                    <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: "var(--navy)", textDecoration: "none", textAlign: "right" }}>
                      {company.website.replace(/^(https?:\/\/)?(www\.)?/, "")} ↗
                    </a>
                  </div>
                )}
                {company.instagram && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontFamily: "monospace", color: "var(--ink-faint)", marginRight: "8px" }}>INSTAGRAM</span>
                    <a href={company.instagram.startsWith("http") ? company.instagram : `https://instagram.com/${company.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: "var(--navy)", textDecoration: "none", textAlign: "right" }}>
                      {company.instagram.startsWith("@") ? company.instagram : `@${company.instagram.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, "").replace(/\/$/, "")}`} ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Brand Poster Section */}
      <div
        style={{
          width: "100%",
          borderRadius: "4px",
          overflow: "hidden",
          border: "1px solid var(--border)",
          marginBottom: "40px",
          aspectRatio: "21 / 9",
          minHeight: "260px",
          background: "#FAF9F5",
        }}
      >
        {heroImage ? (
          <img
            src={heroImage}
            alt={`${company.name} Poster`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg, rgba(${rgbAccent}, 0.12) 0%, rgba(${rgbAccent}, 0.02) 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontWeight: 950, fontSize: "2rem", color: "var(--navy)", letterSpacing: "-0.04em", opacity: 0.15 }}>
              POPOK ARCHIVE
            </div>
          </div>
        )}
      </div>
    </>
  );
}
