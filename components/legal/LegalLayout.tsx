"use client";

import Link from "next/link";
import { LegalDocument } from "@/types/legal";

interface LegalLayoutProps {
  document: LegalDocument;
}

const NAV_ITEMS = [
  { id: "terms", label: "이용약관", href: "/terms" },
  { id: "privacy", label: "개인정보처리방침", href: "/privacy" },
  { id: "copyright", label: "저작권 및 콘텐츠 정책", href: "/copyright" },
];

export default function LegalLayout({ document }: LegalLayoutProps) {
  return (
    <main style={{ background: "var(--bg-warm)", minHeight: "100vh" }}>
      {/* Main Document Content */}
      <article style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "80px 24px 100px",
        fontFamily: "inherit"
      }}>
        {/* Document Header */}
        <header style={{ marginBottom: "56px", borderBottom: "1px solid var(--border)", paddingBottom: "32px" }}>
          <h1 className="display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", color: "var(--navy)", fontWeight: 900, marginBottom: "20px", letterSpacing: "-0.02em" }}>
            {document.title}
          </h1>
          
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "0.82rem", color: "var(--ink-muted)", fontWeight: 600, marginBottom: "20px" }}>
            <div>
              <span style={{ marginRight: "6px" }}>시행일:</span>
              <strong style={{ color: "var(--navy)" }}>{document.effectiveDate}</strong>
            </div>
            <div>
              <span style={{ marginRight: "6px" }}>최종 수정일:</span>
              <strong style={{ color: "var(--navy)" }}>{document.updatedDate}</strong>
            </div>
          </div>

          <p style={{ fontSize: "1rem", color: "var(--ink-muted)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
            {document.description}
          </p>
        </header>

        {/* Document Body Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
          {document.sections.map((section, sIdx) => (
            <section key={sIdx} aria-labelledby={`section-title-${sIdx}`}>
              <h2 
                id={`section-title-${sIdx}`}
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--navy)",
                  borderLeft: "4px solid var(--accent)",
                  paddingLeft: "12px",
                  marginBottom: "20px",
                  letterSpacing: "-0.01em"
                }}
              >
                {section.title}
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {section.items.map((item, iIdx) => {
                  if (item.type === "paragraph") {
                    return (
                      <p 
                        key={iIdx} 
                        style={{
                          fontSize: "0.92rem",
                          color: "var(--ink)",
                          lineHeight: 1.7,
                          margin: 0,
                          fontWeight: 500
                        }}
                      >
                        {item.text}
                      </p>
                    );
                  } else if (item.type === "list" && item.listItems) {
                    return (
                      <ul 
                        key={iIdx} 
                        style={{
                          margin: 0,
                          paddingLeft: "20px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px"
                        }}
                      >
                        {item.listItems.map((listItem, lIdx) => (
                          <li 
                            key={lIdx} 
                            style={{
                              fontSize: "0.92rem",
                              color: "var(--ink)",
                              lineHeight: 1.6,
                              fontWeight: 500
                            }}
                          >
                            {listItem}
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return null;
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Spacing before bottom components */}
        <div style={{ height: "80px" }} />

        {/* Contact Inquiry Card Footer */}
        <footer style={{
          padding: "36px 32px",
          background: "#FFFFFF",
          border: "1.5px solid var(--border)",
          borderRadius: "20px",
          textAlign: "center",
          boxShadow: "0 8px 30px rgba(23, 20, 17, 0.03)"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)", margin: "0 0 12px" }}>
            문의 사항
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginBottom: "20px", lineHeight: 1.5 }}>
            본 정책 또는 POPOK 서비스 이용에 관해 궁금한 점이 있으시면 운영팀으로 문의해주세요.
          </p>
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--navy)" }}>POPOK 운영팀</span>
            <a
              href={`mailto:${document.contactEmail}`}
              aria-label="POPOK 운영팀으로 이메일 보내기"
              className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--navy)] outline-none rounded"
              style={{
                fontSize: "0.92rem",
                color: "var(--navy)",
                fontWeight: 800,
                textDecoration: "none",
                borderBottom: "1.5px solid var(--navy)",
                paddingBottom: "2px",
                minHeight: "44px", // Accessible touch target
                display: "inline-flex",
                alignItems: "center"
              }}
            >
              {document.contactEmail}
            </a>
          </div>
        </footer>

        {/* Spacing between Inquiry Card and Navigation */}
        <div style={{ height: "48px" }} />

        {/* Policy navigation (moved below the Inquiry Card, blends with warm background) */}
        <nav 
          aria-label="정책 문서 네비게이션"
          style={{
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            padding: "16px 0",
            background: "transparent"
          }}
        >
          <div style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center"
          }}>
            {NAV_ITEMS.map((item, idx) => {
              const isActive = item.id === document.id;
              return (
                <span key={item.id} style={{ display: "inline-flex", alignItems: "center" }}>
                  <Link
                    href={item.href}
                    className="focus-visible:ring-2 focus-visible:ring-[var(--navy)] outline-none rounded"
                    style={{
                      textDecoration: "none",
                      color: isActive ? "var(--navy)" : "var(--ink-muted)",
                      fontWeight: isActive ? 800 : 500,
                      fontSize: "0.85rem",
                      padding: "10px 14px",
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: "44px", // Touch target min 44px
                      transition: "color 0.15s ease"
                    }}
                    onMouseOver={(e) => {
                      if (!isActive) e.currentTarget.style.color = "var(--navy)";
                    }}
                    onMouseOut={(e) => {
                      if (!isActive) e.currentTarget.style.color = "var(--ink-muted)";
                    }}
                  >
                    {item.label}
                  </Link>
                  {idx < NAV_ITEMS.length - 1 && (
                    <span style={{ color: "var(--border-dark)", margin: "0 4px", fontSize: "0.8rem", userSelect: "none" }} aria-hidden="true">|</span>
                  )}
                </span>
              );
            })}
          </div>
        </nav>
      </article>
    </main>
  );
}
