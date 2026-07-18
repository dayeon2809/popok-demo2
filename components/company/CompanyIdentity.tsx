"use client";

import React from "react";
import type { Company } from "@/types";

interface CompanyIdentityProps {
  company: Company;
}

export default function CompanyIdentity({ company }: CompanyIdentityProps) {
  const brandAccent = company.brand_color || "#171411";

  const missionText = company.mission || null;
  const visionText = company.vision || null;

  const valuesList = Array.isArray(company.core_values) ? company.core_values : [];

  const hasContent = missionText || visionText || valuesList.length > 0;
  if (!hasContent) return null;

  return (
    <section
      style={{
        padding: "50px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <style jsx global>{`
        .identity-wrapper {
          max-width: 800px;
          margin: 0 auto;
        }
        .identity-block {
          margin-bottom: 32px;
        }
        .identity-title {
          font-family: 'Pretendard Variable', sans-serif;
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--ink-muted);
          letter-spacing: 0.08em;
          display: block;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .identity-mission-text {
          font-size: clamp(1.1rem, 2.5vw, 1.3rem);
          font-weight: 700;
          color: var(--navy);
          line-height: 1.6;
          margin: 0;
          word-break: keep-all;
          letter-spacing: -0.02em;
        }
        .identity-vision-text {
          font-size: clamp(1rem, 2vw, 1.15rem);
          font-weight: 500;
          color: var(--ink-muted);
          line-height: 1.55;
          margin: 0;
          word-break: keep-all;
          letter-spacing: -0.01em;
        }
        .values-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 12px;
        }
        @media (max-width: 768px) {
          .identity-block {
            margin-bottom: 24px !important;
          }
          .identity-mission-text {
            font-size: 1rem !important;
            line-height: 1.5 !important;
          }
          .identity-vision-text {
            font-size: 0.9rem !important;
            line-height: 1.5 !important;
          }
        }
      `}</style>

      <div className="identity-wrapper">
        
        {/* MISSION */}
        {missionText && (
          <>
            <div className="identity-block">
              <span className="identity-title" style={{ color: brandAccent }}>
                MISSION
              </span>
              <h3 className="identity-mission-text">
                {missionText}
              </h3>
            </div>
            <div style={{ width: "100%", height: "1px", backgroundColor: "var(--border-light)", marginBottom: "32px" }} />
          </>
        )}

        {/* VISION */}
        {visionText && (
          <>
            <div className="identity-block">
              <span className="identity-title" style={{ color: brandAccent }}>
                VISION
              </span>
              <h3 className="identity-vision-text">
                {visionText}
              </h3>
            </div>
            <div style={{ width: "100%", height: "1px", backgroundColor: "var(--border-light)", marginBottom: "32px" }} />
          </>
        )}

        {/* VALUES */}
        {valuesList.length > 0 && (
          <div>
            <span className="identity-title" style={{ color: brandAccent }}>
              CORE VALUES
            </span>
            <div className="values-container">
              {valuesList.map((val, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: "0.75rem",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    fontWeight: 700,
                    backgroundColor: "#FFFFFF",
                    border: "1px solid var(--border)",
                    color: "var(--navy)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: brandAccent }} />
                  {val}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
