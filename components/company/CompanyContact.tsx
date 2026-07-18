"use client";

import React, { useState, useMemo } from "react";
import type { Company } from "@/types";

interface CompanyContactProps {
  company: Company;
}

export default function CompanyContact({ company }: CompanyContactProps) {
  const brandAccent = company.brand_color || "#171411";
  const [openWorks, setOpenWorks] = useState<Record<string, boolean>>({});

  const toggleWork = (workTitle: string) => {
    setOpenWorks(prev => ({ ...prev, [workTitle]: !prev[workTitle] }));
  };

    const groupedReviews = useMemo(() => {
    const groups: Record<string, Array<{ title: string; source?: string; url?: string }>> = {};
    const list = Array.isArray(company.press_links) ? company.press_links : [];
    
    if (list.length === 0) return groups;
    
    list.forEach(item => {
      const key = item.title || "기타 언론 보도";
      if (!groups[key]) groups[key] = [];
      groups[key].push({
        title: item.title || "",
        source: item.source || "",
        url: item.url || "",
      });
    });
    return groups;
  }, [company.press_links]);

  const hasReviews = Object.keys(groupedReviews).length > 0;

  const emailText = company.email || "inquiry@popok-dance.org";
  const webText = company.website || "www.popok-dance.org";
  const instaText = company.instagram || "@popok_dance_official";

  return (
    <section
      style={{
        padding: "50px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <style jsx global>{`
        .contact-grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 48px;
        }
        .contact-info-card {
          padding: 24px;
          background: #FFFFFF;
          border: 1px solid var(--border);
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .press-link:hover {
          color: ${brandAccent} !important;
          text-decoration: underline !important;
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
        }
      `}</style>

      <div className="contact-grid-container">
        
        {/* Press Links (Grouped by Work) */}
        {hasReviews ? (
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
              Reviews & Articles
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.entries(groupedReviews).map(([workTitle, reviews], idx) => {
                const isOpen = !!openWorks[workTitle];
                return (
                  <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: "4px", backgroundColor: "#FFFFFF", overflow: "hidden" }}>
                    <button
                      type="button"
                      onClick={() => toggleWork(workTitle)}
                      style={{
                        width: "100%",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px 20px",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--navy)" }}>
                        {workTitle}
                      </span>
                      <span style={{
                        fontSize: "0.8rem",
                        color: "var(--navy)",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.25s ease",
                        marginLeft: "12px",
                      }}>
                        ↓
                      </span>
                    </button>

                    <div style={{
                      maxHeight: isOpen ? "1000px" : "0px",
                      overflow: "hidden",
                      transition: "max-height 0.3s ease-in-out",
                    }}>
                      <div style={{ padding: "0 20px 16px 20px", borderTop: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: "10px", paddingTop: "12px" }}>
                        {reviews.map((press, pIdx) => (
                          <a
                            key={pIdx}
                            href={press.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              textDecoration: "none",
                              fontSize: "0.82rem",
                              color: "var(--navy)",
                              display: "block",
                              lineHeight: 1.4,
                              transition: "color 0.15s ease",
                            }}
                            className="press-link"
                          >
                            <span style={{ fontSize: "0.68rem", color: "var(--ink-faint)", display: "block", fontFamily: "monospace", marginBottom: "2px" }}>
                              {press.source || "NEWS"}
                            </span>
                            <span style={{ fontWeight: 700 }}>{press.source && press.source.includes(workTitle) ? press.source : `${press.source || "리뷰 링크"} ↗`}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ display: "none" }} />
        )}

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
