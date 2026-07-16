"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Company } from "@/types";

// Import custom company components
import DigitalCard from "@/components/company/DigitalCard";
import CompanyHero from "@/components/company/CompanyHero";
import CompanyIdentity from "@/components/company/CompanyIdentity";
import CompanyPortfolio from "@/components/company/CompanyPortfolio";
import CompanyHistory from "@/components/company/CompanyHistory";
import CompanyProjects from "@/components/company/CompanyProjects";
import CompanyArtists from "@/components/company/CompanyArtists";
import CompanyContact from "@/components/company/CompanyContact";
import RelatedCompanies from "@/components/company/RelatedCompanies";

interface CompanyClientViewProps {
  company: Company;
  artists: any[];
  relatedCompanies: Company[];
}

export default function CompanyClientView({
  company,
  artists,
  relatedCompanies,
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

  return (
    <div
      style={{
        background: `linear-gradient(180deg, rgba(${rgbAccent}, 0.08) 0%, var(--bg-warm) 600px, var(--bg-warm) 100%)`,
        minHeight: "100vh",
        paddingBottom: "80px",
        fontFamily: "'Pretendard Variable', 'Pretendard', sans-serif",
        WebkitFontSmoothing: "antialiased",
        position: "relative",
        overflow: "hidden",
        // Inject company brand color dynamically
        //@ts-ignore
        "--company-accent": brandAccent,
      }}
    >
      {/* Background brand glow effects */}
      <div style={{
        position: "absolute",
        top: "80px",
        left: "5%",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${rgbAccent}, 0.12) 0%, rgba(${rgbAccent}, 0) 70%)`,
        filter: "blur(60px)",
        pointerEvents: "none",
        zIndex: 0,
      }} />
      <div style={{
        position: "absolute",
        top: "300px",
        right: "5%",
        width: "450px",
        height: "450px",
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${rgbAccent}, 0.09) 0%, rgba(${rgbAccent}, 0) 70%)`,
        filter: "blur(80px)",
        pointerEvents: "none",
        zIndex: 0,
      }} />
      <style jsx global>{`
        .company-detail-page-container {
          max-width: 1120px;
          margin: 0 auto;
          padding: 40px 32px;
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
          font-size: 0.82rem;
          font-weight: 700;
          margin-bottom: 32px;
          transition: color 0.15s ease;
        }
        .back-nav-btn:hover {
          color: var(--navy);
        }
        @media (max-width: 768px) {
          .company-detail-page-container {
            padding: 24px 16px !important;
          }
          .back-nav-btn {
            font-size: 0.76rem !important;
            margin-bottom: 20px !important;
          }
          .header-title-text {
            font-size: 1.15rem !important;
          }
          .header-nav-pill {
            font-size: 0.78rem !important;
          }
        }
      `}</style>

      {/* Dynamic Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(245,241,232,0.92)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: "1120px",
            margin: "0 auto",
            padding: "0 24px",
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
            <div className="header-title-text" style={{ fontWeight: 950, fontSize: "1.25rem", color: "var(--navy)", letterSpacing: "-0.04em", display: "flex", alignItems: "center", gap: "2px" }}>
              POPOK
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: brandAccent }} />
            </div>
          </Link>
          <div style={{ display: "flex", gap: "16px" }}>
            <Link href="/artists" className="header-nav-pill" style={{ textDecoration: "none", fontSize: "0.82rem", fontWeight: 700, color: "var(--ink-muted)" }}>
              Artists
            </Link>
            <Link href="/companies" className="header-nav-pill" style={{ textDecoration: "none", fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)" }}>
              Companies
            </Link>
            <Link href="/onboarding" className="header-nav-pill" style={{ textDecoration: "none", fontSize: "0.82rem", fontWeight: 700, color: "var(--ink-muted)" }}>
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="company-detail-page-container">
        
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
        >
          ← 단체 둘러보기
        </button>

        {/* 1. POPOK DIGITAL CARD (The Passport identity card) */}
        <DigitalCard company={adaptedCompany as any} viewCount={company.view_count || 0} />

        {/* 2. BRAND HERO (Poster Style) */}
        <CompanyHero
          company={adaptedCompany as any}
          artistCount={artists.length}
          workCount={(adaptedCompany.works && adaptedCompany.works.length) || 0}
          performanceCount={(adaptedCompany.current_activity && adaptedCompany.current_activity.length) || 0}
        />

        {/* 3. IDENTITY (Mission, Vision, Values) */}
        <CompanyIdentity company={adaptedCompany as any} />

        {/* 4. REPRESENTATIVE PORTFOLIO (Cargo style visual grid) */}
        <CompanyPortfolio company={adaptedCompany as any} />

        {/* 5. HISTORY */}
        <CompanyHistory company={adaptedCompany as any} />

        {/* 6. PROJECTS & SHOWS */}
        <CompanyProjects company={adaptedCompany as any} />

        {/* 7. AFFILIATED ARTISTS */}
        <CompanyArtists company={adaptedCompany as any} artists={artists} />

        {/* 8. PRESS & CONTACT */}
        <CompanyContact company={adaptedCompany as any} />

        {/* 9. RELATED DISCOVERY (You may also like) */}
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
            padding: "10px 24px",
            borderRadius: "30px",
            fontSize: "0.85rem",
            fontWeight: 700,
            zIndex: 1000,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
