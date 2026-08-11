"use client";

import React from "react";
import type { Company } from "@/types";

interface CompanyHeroProps {
  company: Company;
  artistCount: number;
  workCount: number;
  performanceCount: number;
}

export default function CompanyHero({
  company,
  artistCount = 0,
  workCount = 0,
  performanceCount = 0,
}: CompanyHeroProps) {
  const brandAccent = company.brand_color || "#171411";

  const heroImage =
    company.hero_image_url ||
    (company.profile_image_urls && company.profile_image_urls[0]) ||
    company.profile_image_url ||
    null;

  return (
    <section
      id="brand-hero-section"
      style={{
        width: "100%",
        padding: "60px 0 40px 0",
        borderTop: "1.5px solid var(--border)",
      }}
    >
      <style jsx global>{`
        .hero-metric-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 24px;
          text-align: center;
          padding-top: 36px;
        }
        @media (max-width: 768px) {
          .hero-metric-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 16px 8px !important;
            padding-top: 24px !important;
          }
          .hero-poster-wrapper {
            aspect-ratio: 16 / 10 !important;
            min-height: 240px !important;
            margin-bottom: 24px !important;
          }
          .hero-metric-item span {
            font-size: 1.05rem !important;
          }
        }
      `}</style>

      {/* Cinematic Poster Area */}
      <div
        className="hero-poster-wrapper"
        style={{
          width: "100%",
          position: "relative",
          aspectRatio: "21 / 9",
          minHeight: "360px",
          background: "#171411",
          borderRadius: "14px",
          overflow: "hidden",
          border: "1.5px solid var(--border)",
          boxShadow: "0 12px 32px rgba(23, 20, 17, 0.04)",
          marginBottom: "32px",
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
              opacity: 0.9,
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg, ${brandAccent}, #171411)`,
              opacity: 0.95,
            }}
          />
        )}

        {/* Text/Logo Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(23, 20, 17, 0.05), rgba(23, 20, 17, 0.85))",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "36px 20px",
            textAlign: "center",
            color: "#FFFFFF",
          }}
        >
          {/* Logo overlay */}
          {(company.logo_url || company.profile_image_url) && (
            <img
              src={company.logo_url || company.profile_image_url || ""}
              alt={`${company.name} Logo`}
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #FFFFFF",
                marginBottom: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            />
          )}

          <h2
            className="display"
            style={{
              fontSize: "clamp(1.8rem, 4.5vw, 3.2rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: "0 0 8px 0",
              color: "#FFFFFF",
              textShadow: "0 2px 8px rgba(23,20,17,0.3)",
            }}
          >
            {company.name}
          </h2>

          {company.slogan ? (
            <p
              style={{
                fontSize: "clamp(0.88rem, 1.8vw, 1.15rem)",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                margin: "0 0 16px 0",
                opacity: 0.9,
                color: "#F5F1E8",
                textShadow: "0 1px 4px rgba(23,20,17,0.3)",
              }}
            >
              "{company.slogan}"
            </p>
          ) : (
            company.bio_short && (
              <p
                style={{
                  fontSize: "0.95rem",
                  margin: "0 0 16px 0",
                  opacity: 0.9,
                  textShadow: "0 1px 4px rgba(23,20,17,0.3)",
                }}
              >
                {company.bio_short}
              </p>
            )
          )}

          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 800,
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              padding: "4px 12px",
              borderRadius: "20px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {company.genre || company.category || "ARCHIVE"}
          </span>
        </div>
      </div>

      {/* Brand Metrics Section */}
      <div className="hero-metric-grid" style={{ borderBottom: "1.5px solid var(--border)", paddingBottom: "36px" }}>
        <div className="hero-metric-item">
          <span className="mono" style={{ display: "block", marginBottom: "4px" }}>
            Founded
          </span>
          <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)" }}>
            {company.founded_year || 2021}
          </span>
        </div>
        <div className="hero-metric-item">
          <span className="mono" style={{ display: "block", marginBottom: "4px" }}>
            Region
          </span>
          <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)" }}>
            {company.city_or_region || "Seoul"}
          </span>
        </div>
        <div className="hero-metric-item">
          <span className="mono" style={{ display: "block", marginBottom: "4px" }}>
            Artists
          </span>
          <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)" }}>
            {artistCount}
          </span>
        </div>
        <div className="hero-metric-item">
          <span className="mono" style={{ display: "block", marginBottom: "4px" }}>
            Works
          </span>
          <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)" }}>
            {workCount}
          </span>
        </div>
        <div className="hero-metric-item">
          <span className="mono" style={{ display: "block", marginBottom: "4px" }}>
            Shows
          </span>
          <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)" }}>
            {performanceCount}
          </span>
        </div>
      </div>
    </section>
  );
}
