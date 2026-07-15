"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui/States";
import { getCompanyDetailHref } from "@/lib/companyRoute";
import type { Company } from "@/types";

const FALLBACK_IMAGE = "/images/placeholders/cake-placeholder.png";

export default function CompaniesClient({ companies }: { companies: Company[] }) {
  return (
    <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 32px 80px" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .company-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 24px;
        }
        @media (max-width: 768px) {
          .company-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px 12px !important;
          }
        }
      `}} />

      {/* Page Headline */}
      <div style={{ margin: "40px 0" }}>
        <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 700, letterSpacing: "0.15em", display: "block", marginBottom: "8px" }}>
          POPOK DIRECTORY
        </span>
        <h1 className="display" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", color: "var(--navy)", fontWeight: 900, letterSpacing: "-0.03em" }}>
          단체
        </h1>
      </div>

      {companies.length === 0 ? (
        <div>
          <EmptyState message="아직 등록된 단체가 없습니다." />
          <div style={{ textAlign: "center", marginTop: "-20px", marginBottom: "40px" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginBottom: "16px" }}>
              POPOK에 단체의 작품과 활동을 기록해보세요.
            </p>
            <Link
              href="/organizations/apply"
              className="btn-lime"
              style={{
                display: "inline-block",
                textDecoration: "none",
                padding: "12px 24px",
                borderRadius: "12px",
                fontSize: "0.88rem",
                fontWeight: 800,
              }}
            >
              단체 포퐄 등록하기 →
            </Link>
          </div>
        </div>
      ) : (
        <div className="company-grid">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyCard({ company }: { company: Company }) {
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
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
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
