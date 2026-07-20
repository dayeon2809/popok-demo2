"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import type { Company } from "@/types";
import { analytics } from "@/lib/analytics";
import type { PortfolioRequestViewerState } from "@/lib/portfolioRequestsServer";

// Import custom company components
import CompanyCardStack from "@/components/company/CompanyCardStack";
import CompanyBrochureHeader from "@/components/company/CompanyBrochureHeader";
import CompanyGallery from "@/components/company/CompanyGallery";
import CompanyIdentity from "@/components/company/CompanyIdentity";
import CompanyPortfolio from "@/components/company/CompanyPortfolio";
import CompanyHistory from "@/components/company/CompanyHistory";
import CompanyUpcomingPerformances from "@/components/company/CompanyUpcomingPerformances";
import CompanyArtists from "@/components/company/CompanyArtists";
import CompanyContact from "@/components/company/CompanyContact";
import CompanyAwardsLinks from "@/components/company/CompanyAwardsLinks";
import RelatedCompanies from "@/components/company/RelatedCompanies";
import SendPortfolioSection from "@/components/portfolio-requests/SendPortfolioSection";

interface CompanyClientViewProps {
  company: Company;
  artists: any[];
  relatedCompanies: Company[];
  upcomingPerformances: any[];
  sendPortfolioViewerState: PortfolioRequestViewerState;
}

export default function CompanyClientView({
  company,
  artists,
  relatedCompanies,
  upcomingPerformances = [],
  sendPortfolioViewerState,
}: CompanyClientViewProps) {
      const router = useRouter();
  const pathname = usePathname();
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
        @media (max-width: 768px) {
          .company-detail-page-container {
            padding: 24px 16px !important;
          }
          .back-nav-btn {
            margin-bottom: 24px !important;
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
          
          <CompanyCardStack company={adaptedCompany as any} viewCount={company.view_count || 0} artists={artists} />
        </div>
      </div>

      {/* Main Container - Clean White Background */}
      <div className="company-detail-page-container" style={{ background: "#FFFFFF", paddingTop: "40px" }}>
        
        <CompanyBrochureHeader company={adaptedCompany as any} artistCount={artists.length} />

        {/* 2b. REPRESENTATIVE IMAGE GALLERY */}
        <CompanyGallery images={adaptedCompany.representative_images} />

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

        {/* 8b. AWARDS & LINKS */}
        <CompanyAwardsLinks company={adaptedCompany as any} />

        {/* 9. RELATED DISCOVERY */}
        <RelatedCompanies currentCompany={adaptedCompany as any} relatedCompanies={relatedCompanies} />

      </div>

      {/* 10. SEND PORTFOLIO CTA */}
      <SendPortfolioSection
        target={{ type: "company", id: company.id, name: company.name, imageUrl: company.profile_image_url }}
        viewerState={sendPortfolioViewerState}
        currentPath={pathname}
        onToast={triggerToast}
      />

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
