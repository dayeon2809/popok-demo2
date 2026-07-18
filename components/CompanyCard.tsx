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
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div className="company-showcase-card">
        <style jsx>{`
          .company-showcase-card {
            background: #ffffff;
            border: 1.5px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(23, 20, 17, 0.04);
            transition: transform 0.25s ease, box-shadow 0.25s ease;
            min-width: 0;
          }
          .company-showcase-info {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 0;
            min-height: 135px;
          }
          @media (max-width: 480px) {
            .company-showcase-info {
              padding: 12px !important;
              gap: 4px !important;
              min-height: 0 !important;
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
        <div style={{ width: "100%", aspectRatio: "1.2", background: "var(--bg-warm)", overflow: "hidden" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <h4 style={{
              fontSize: "1rem", fontWeight: 900, color: "var(--navy)", margin: 0,
              overflowWrap: "break-word", wordBreak: "keep-all",
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
          {company.name_en && (
            <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-faint)" }}>
              {company.name_en}
            </span>
          )}
          {(company.genre || company.city_or_region) && (
            <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 600 }}>
              {[company.genre, company.city_or_region].filter(Boolean).join(" · ")}
            </div>
          )}
          {company.bio_short && (
            <p className="company-showcase-bio" style={{
              fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.5, margin: "4px 0 0",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {company.bio_short}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
