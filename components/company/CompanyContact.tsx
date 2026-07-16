"use client";

import React from "react";
import type { Company } from "@/types";

interface CompanyContactProps {
  company: Company;
}

export default function CompanyContact({ company }: CompanyContactProps) {
  const brandAccent = company.brand_color || "#171411";

  const pressList = company.press_links && company.press_links.length > 0
    ? company.press_links
    : [
        {
          title: "현대무용의 한계와 경계를 뒤흔들다 - 새로운 몸짓의 아카이브",
          source: "중앙일보",
          url: "#",
        },
        {
          title: "신체 지각 예술 프로젝트 '침묵의 잔상' 평론: 낯선 감각의 극대화",
          source: "Dance Magazine",
          url: "#",
        },
      ];

  const emailText = company.email || "inquiry@popok-dance.org";
  const webText = company.website || "www.popok-dance.org";
  const instaText = company.instagram || "@popok_dance_official";

  return (
    <section
      style={{
        padding: "60px 0",
        borderBottom: "1.5px solid var(--border)",
      }}
    >
      <style jsx global>{`
        .contact-grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 48px;
        }
        .contact-info-card {
          padding: 28px;
          background: #FAF8F5;
          border: 1.5px solid var(--border);
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .press-link:hover {
          color: ${brandAccent} !important;
        }
        @media (max-width: 768px) {
          .contact-grid-container {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
          .contact-info-card {
            padding: 20px !important;
            gap: 16px !important;
          }
          .press-title {
            font-size: 0.85rem !important;
          }
        }
      `}</style>

      <div className="contact-grid-container">
        
        {/* Press Links */}
        <div>
          <h3
            className="mono"
            style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              color: "var(--navy)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "24px",
            }}
          >
            Press & Media Coverage
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {pressList.map((press, idx) => (
              <a
                key={idx}
                href={press.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  color: "var(--navy)",
                  lineHeight: 1.5,
                  display: "block",
                  paddingBottom: "12px",
                  borderBottom: "1px solid var(--border-light)",
                  transition: "color 0.2s ease",
                }}
                className="press-link"
              >
                <span style={{ fontSize: "0.68rem", color: "var(--ink-faint)", display: "block", fontFamily: "monospace", marginBottom: "4px" }}>
                  {press.source || "NEWS"}
                </span>
                <span className="press-title" style={{ fontWeight: 700, letterSpacing: "-0.01em" }}>{press.title} ↗</span>
              </a>
            ))}
          </div>
        </div>

        {/* Contact info */}
        <div>
          <h3
            className="mono"
            style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              color: "var(--navy)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "24px",
            }}
          >
            Contact & Inquiries
          </h3>

          <div className="contact-info-card">
            <div>
              <span className="mono" style={{ display: "block", fontSize: "0.62rem", marginBottom: "4px" }}>
                Official Email
              </span>
              <a href={`mailto:${emailText}`} style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--navy)", textDecoration: "none", borderBottom: `1.5px solid ${brandAccent}`, paddingBottom: "2px" }}>
                {emailText}
              </a>
            </div>

            <div>
              <span className="mono" style={{ display: "block", fontSize: "0.62rem", marginBottom: "4px" }}>
                Website
              </span>
              <a href={webText.startsWith("http") ? webText : `https://${webText}`} target="_blank" rel="noreferrer" style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--navy)", textDecoration: "none" }}>
                {webText} ↗
              </a>
            </div>

            <div>
              <span className="mono" style={{ display: "block", fontSize: "0.62rem", marginBottom: "4px" }}>
                Instagram
              </span>
              <a href={instaText.startsWith("http") ? instaText : `https://instagram.com/${instaText.replace("@", "")}`} target="_blank" rel="noreferrer" style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--navy)", textDecoration: "none" }}>
                {instaText} ↗
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
