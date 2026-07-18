import Link from "next/link";
import { getCompanyDetailHref } from "@/lib/companyRoute";
import type { Company } from "@/types";

const FALLBACK_IMAGE = "/images/placeholders/cake-placeholder.png";

interface CompanyCardProps {
  company: Company;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link
      href={getCompanyDetailHref(company.slug || company.id)}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div
        className="showcase-card"
        style={{
          background: "#FFFFFF",
          border: "1.5px solid var(--border)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(23, 20, 17, 0.04)",
          transition: "transform 0.25s ease, box-shadow 0.25s ease",
          minWidth: 0,
        }}
      >
        <div style={{ width: "100%", aspectRatio: "1.2", background: "var(--bg-warm)", overflow: "hidden" }}>
          <img
            src={company.profile_image_url || FALLBACK_IMAGE}
            alt={company.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "6px", minWidth: 0, height: "135px" }}>
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
            <p style={{
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
