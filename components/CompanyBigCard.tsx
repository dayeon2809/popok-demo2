"use client";

import { useState } from "react";
import Link from "next/link";
import { getCompanyDetailHref } from "@/lib/companyRoute";
import { getListImageUrl } from "@/lib/imageUrls";
import type { Company } from "@/types";

const FALLBACK_IMAGE = "/images/placeholders/cake-placeholder.png";

interface CompanyBigCardProps {
  company: Company;
}

// Larger, editorial-style card for the /companies directory (replaces the
// small compact grid cards there — components/CompanyCard.tsx stays
// untouched since it's reused elsewhere: company detail "related" rail,
// admin preview, recommendation quiz, home v1 carousel). Bigger hero image,
// larger type, and a small strip of representative/work thumbnails when
// available, so each company reads as its own showcase rather than one tile
// in a dense grid.
export default function CompanyBigCard({ company }: CompanyBigCardProps) {
  const [heroFailed, setHeroFailed] = useState(false);
  const heroImage = company.profile_image_url;
  const showHero = !!heroImage && !heroFailed;

  const secondaryImages = (company.representative_images || [])
    .filter((img): img is string => Boolean(img && img.trim()))
    .slice(0, 3);

  return (
    <Link
      href={getCompanyDetailHref(company.slug || company.id)}
      style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
    >
      <div className="company-big-card">
        <style jsx>{`
          .company-big-card {
            background: #ffffff;
            border: 1.5px solid var(--border);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(23, 20, 17, 0.05);
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          .company-big-card:hover {
            border-color: var(--navy);
            box-shadow: 0 16px 36px rgba(23, 20, 17, 0.1);
          }
          .company-big-card :global(img) {
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .company-big-card:hover .company-big-card-hero :global(img) {
            transform: scale(1.03);
          }
        `}</style>

        <div className="company-big-card-hero" style={{ width: "100%", aspectRatio: "16 / 10", background: "#FAF9F5", overflow: "hidden", flexShrink: 0, position: "relative" }}>
          {showHero ? (
            <img
              src={getListImageUrl(heroImage!, 600)}
              alt={company.name}
              loading="lazy"
              decoding="async"
              onError={() => setHeroFailed(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <img src={FALLBACK_IMAGE} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
          )}
          <span style={{
              position: "absolute", top: "14px", right: "14px",
              fontSize: "0.65rem", fontWeight: 850,
              color: "var(--navy)", background: "var(--accent)",
              padding: "4px 10px", borderRadius: "999px", whiteSpace: "nowrap",
            }}>
              POPOK VERIFIED
            </span>
        </div>

        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          <div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--navy)", margin: 0, letterSpacing: "-0.02em" }}>
              {company.name}
            </h3>
            {company.name_en && (
              <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>{company.name_en}</span>
            )}
          </div>

          {(company.genre || company.city_or_region) && (
            <span className="mono" style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--accent-dark)", letterSpacing: "0.02em" }}>
              {[company.genre, company.city_or_region].filter(Boolean).join(" · ")}
            </span>
          )}

          {company.bio_short && (
            <p style={{
              fontSize: "0.88rem", color: "var(--ink-muted)", lineHeight: 1.6, margin: "4px 0 0",
              display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {company.bio_short}
            </p>
          )}

          {secondaryImages.length > 0 && (
            <div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "16px" }}>
              {secondaryImages.map((img, idx) => (
                <div key={idx} style={{ width: "56px", height: "56px", borderRadius: "8px", overflow: "hidden", background: "#EAE6DD", flexShrink: 0 }}>
                  <img src={getListImageUrl(img, 128)} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
