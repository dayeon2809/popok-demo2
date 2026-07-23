"use client";

import { useState } from "react";
import Link from "next/link";
import { getCompanyDetailHref } from "@/lib/companyRoute";
import type { Company } from "@/types";

interface CompanyCardProps {
  company: Company;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  // `profile_image_url` is often a hotlinked external URL — it can 404 or
  // time out at render time even though it was valid when saved. Fall back
  // to the in-code placeholder (no on-disk asset dependency) rather than
  // showing the browser's broken-image icon.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!company.profile_image_url && !imageFailed;

  return (
    <Link
      href={getCompanyDetailHref(company.slug || company.id)}
      style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
    >
      <div className="company-showcase-card">
        <style jsx>{`
          .company-showcase-card {
            background: #ffffff;
            border: 1.5px solid var(--border);
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(23, 20, 17, 0.04);
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
            min-width: 0;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          .company-showcase-card:hover {
            border-color: var(--navy);
            box-shadow: 0 12px 28px rgba(23, 20, 17, 0.08);
          }
          .company-showcase-card :global(img) {
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .company-showcase-card:hover :global(img) {
            transform: scale(1.03);
          }
          .company-showcase-info {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 0;
            flex: 1 1 auto;
          }
          @media (max-width: 480px) {
            .company-showcase-info {
              padding: 12px !important;
              gap: 4px !important;
            }
            .company-showcase-info h4 {
              font-size: 0.88rem !important;
            }
            .company-showcase-info .company-showcase-bio {
              font-size: 0.7rem !important;
              -webkit-line-clamp: 2 !important;
            }
          }
        `}</style>
        <div style={{ width: "100%", aspectRatio: "1.2", background: "#FAF9F5", overflow: "hidden", flexShrink: 0 }}>
          {showImage ? (
            <img
              src={company.profile_image_url!}
              alt={company.name}
              onError={() => setImageFailed(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", background: "#FAF8F5", gap: "8px",
            }}>
              <span style={{
                fontWeight: 950, fontSize: "1rem", color: "var(--navy)", letterSpacing: "-0.04em",
                display: "flex", alignItems: "center", gap: "2px"
              }}>
                POPOK
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
              </span>
              <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                준비중
              </span>
            </div>
          )}
        </div>
        <div className="company-showcase-info">
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", minHeight: "24px" }}>
            <h4 style={{
              fontSize: "1rem", fontWeight: 900, color: "var(--navy)", margin: 0,
              overflowWrap: "break-word", wordBreak: "keep-all",
              display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {company.name}
            </h4>
            {company.verified && (
              <span style={{
                fontSize: "0.6rem", fontWeight: 800, color: "var(--navy)",
                background: "var(--accent)", padding: "2px 7px", borderRadius: "8px", whiteSpace: "nowrap",
              }}>
                POPOK VERIFIED
              </span>
            )}
          </div>
          {/* name_en/genre rows always reserve their line height (visibility toggle,
              not conditional unmount) so every card's info block is the same total
              height regardless of which optional fields a given company has. */}
          <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-faint)", visibility: company.name_en ? "visible" : "hidden" }}>
            {company.name_en || "—"}
          </span>
          <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 600, visibility: (company.genre || company.city_or_region) ? "visible" : "hidden" }}>
            {[company.genre, company.city_or_region].filter(Boolean).join(" · ") || "—"}
          </div>
          <p className="company-showcase-bio" style={{
            fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.5, margin: "4px 0 0",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            minHeight: "calc(0.78rem * 1.5 * 2)",
          }}>
              {company.bio_short}
            </p>
        </div>
      </div>
    </Link>
  );
}
