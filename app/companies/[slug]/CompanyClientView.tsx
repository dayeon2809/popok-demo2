"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Company } from "@/types";
import { analytics } from "@/lib/analytics";

// Import custom company components
import DigitalCard from "@/components/company/DigitalCard";
import CompanyIdentity from "@/components/company/CompanyIdentity";
import CompanyPortfolio from "@/components/company/CompanyPortfolio";
import CompanyHistory from "@/components/company/CompanyHistory";
import CompanyUpcomingPerformances from "@/components/company/CompanyUpcomingPerformances";
import CompanyArtists from "@/components/company/CompanyArtists";
import CompanyContact from "@/components/company/CompanyContact";
import RelatedCompanies from "@/components/company/RelatedCompanies";

interface CompanyClientViewProps {
  company: Company;
  artists: any[];
  relatedCompanies: Company[];
  upcomingPerformances: any[];
}

export default function CompanyClientView({
  company,
  artists,
  relatedCompanies,
  upcomingPerformances = [],
}: CompanyClientViewProps) {
      const router = useRouter();
  const [toastMsg, setToastMsg] = useState("");
  const brandAccent = company.brand_color || "#C8EE52"; // default popok lime

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  };

  useEffect(() => {
    document.title = `${company.name} | POPOK Company Archive`;
  }, [company.name]);

  useEffect(() => {
    if (!company) return;
    const companyKey = company.id;
    if (!companyKey) return;
    analytics.companyViewed(companyKey, company.name);
  }, [company?.id, company?.name]);

  const hexToRgb = (hexColor: string) => {
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
  };

  const rgbAccent = hexToRgb(brandAccent);

  const adaptedCompany = {
    ...company,
    slogan: company.bio_short ? company.bio_short : null,
    values: Array.isArray(company.core_values) ? company.core_values : [],
    projects: Array.isArray(company.current_activity) ? company.current_activity : [],
    press_links: Array.isArray(company.review_links) ? company.review_links : [],

    // ensure arrays are safe
    core_values: Array.isArray(company.core_values) ? company.core_values : [],
    current_activity: Array.isArray(company.current_activity) ? company.current_activity : [],
    review_links: Array.isArray(company.review_links) ? company.review_links : [],
    works: Array.isArray(company.works) ? company.works : [],
    awards: Array.isArray(company.awards) ? company.awards : [],
    links: Array.isArray(company.links) ? company.links : [],
    history: Array.isArray(company.history) ? company.history : [],
  };

  const heroImage =
    company.hero_image_url ||
    (company.profile_image_urls && company.profile_image_urls[0]) ||
    company.profile_image_url ||
    null;

  return (
            <div
      style={{
        background: "#FFFFFF",
        minHeight: "100vh",
        paddingBottom: "80px",
        fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
        WebkitFontSmoothing: "antialiased",
        position: "relative",
        // Inject company brand color dynamically
        //@ts-ignore
        "--company-accent": brandAccent,
      }}
    >
      <style jsx global>{`
        .company-detail-page-container {
          max-width: 1040px;
          margin: 0 auto;
          padding: 40px 24px;
          position: relative;
          z-index: 1;
        }
        .back-nav-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--ink-muted);
          font-size: 0.8rem;
          font-weight: 700;
          margin-bottom: 40px;
          transition: color 0.15s ease;
        }
        .back-nav-btn:hover {
          color: var(--navy);
        }
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
          border-bottom: 1px solid var(--border, #E6E2D8);
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
          .company-detail-page-container {
            padding: 24px 16px !important;
          }
          .back-nav-btn {
            margin-bottom: 24px !important;
          }
          .brochure-header-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            margin-bottom: 32px !important;
          }
        }
      `}</style>

      {/* Dynamic Header */}
                  <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: "1040px",
            margin: "0 auto",
            padding: "0 24px",
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ fontWeight: 950, fontSize: "1.15rem", color: "var(--navy)", letterSpacing: "-0.04em", display: "flex", alignItems: "center", gap: "2px" }}>
              POPOK
              <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: brandAccent }} />
            </div>
          </Link>
          <div style={{ display: "flex", gap: "20px" }}>
            <Link href="/artists" style={{ textDecoration: "none", fontSize: "0.8rem", fontWeight: 700, color: "var(--ink-muted)" }}>
              Artists
            </Link>
            <Link href="/companies" style={{ textDecoration: "none", fontSize: "0.8rem", fontWeight: 700, color: "var(--navy)" }}>
              Companies
            </Link>
            <Link href="/onboarding" style={{ textDecoration: "none", fontSize: "0.8rem", fontWeight: 700, color: "var(--ink-muted)" }}>
              Register
            </Link>
          </div>
        </div>
      </header>

            {/* 1. POPOK DIGITAL CARD Area - Full Viewport Width with Warm Background */}
      <div
        style={{
          width: "100%",
          background: `linear-gradient(180deg, rgba(${rgbAccent}, 0.05) 0%, var(--bg-warm) 100%)`,
          borderBottom: "1px solid var(--border)",
          padding: "40px 24px 30px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ maxWidth: "1040px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Back Link */}
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/companies");
              }
            }}
            className="back-nav-btn"
            style={{ alignSelf: "flex-start", marginBottom: "20px" }}
          >
            ← 단체 둘러보기
          </button>
          
          <DigitalCard company={adaptedCompany as any} viewCount={company.view_count || 0} />
        </div>
      </div>

      {/* Main Container - Clean White Background */}
      <div className="company-detail-page-container" style={{ background: "#FFFFFF", paddingTop: "40px" }}>
        
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
                  <td className="value">{artists.length}</td>
                </tr>
                <tr>
                  <td className="label">Works</td>
                  <td className="value">{(adaptedCompany.works && adaptedCompany.works.length) || 0}</td>
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

        {/* 3. IDENTITY (Mission, Vision, Values) */}
        <CompanyIdentity company={adaptedCompany as any} />

        {/* 4. REPRESENTATIVE PORTFOLIO (Editorial Gallery System) */}
        <CompanyPortfolio company={adaptedCompany as any} />

                {/* 5. HISTORY */}
        <CompanyHistory company={adaptedCompany as any} />

                        {/* 6. UPCOMING PERFORMANCES */}
        <CompanyUpcomingPerformances company={adaptedCompany as any} performances={upcomingPerformances} />

        {/* 7. AFFILIATED ARTISTS */}
        <CompanyArtists company={adaptedCompany as any} artists={artists} />

        {/* 8. PRESS & CONTACT */}
        <CompanyContact company={adaptedCompany as any} />

        {/* 9. RELATED DISCOVERY */}
        <RelatedCompanies currentCompany={adaptedCompany as any} relatedCompanies={relatedCompanies} />

      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--navy)",
            color: "#FFFFFF",
            padding: "8px 20px",
            borderRadius: "4px",
            fontSize: "0.8rem",
            fontWeight: 700,
            zIndex: 1000,
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
