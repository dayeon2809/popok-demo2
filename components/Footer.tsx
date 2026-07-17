"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/useLanguage";

export default function Footer() {
  const { language } = useLanguage();
  const isKo = language === "ko";

  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      padding: "64px 32px 48px",
      background: "var(--bg-warm)",
    }}>
      {/* Main Row */}
      <div className="footer-inner" style={{
        maxWidth: "1120px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "40px"
      }}>
        {/* Left column */}
        <div className="footer-inner" style={{ display: "flex", flexDirection: "column" }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "12px" }}>
            <div style={{ fontWeight: 900, fontSize: "1.3rem", color: "var(--navy)", letterSpacing: "-0.04em", display: "flex", alignItems: "center", gap: "2px" }}>
              POPOK
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
            </div>
          </Link>
          <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", fontWeight: 500, margin: 0 }}>
            {isKo ? "예술인을 더 많은 기회로 연결합니다." : "Connecting artists to more opportunities."}
          </p>
        </div>

        {/* Right column (links) */}
        <div style={{ display: "flex", gap: "60px", flexWrap: "wrap" }}>
          <div className="footer-inner" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink)", fontWeight: 700, letterSpacing: "0.1em" }}>POPOK</span>
            <Link href="/about" style={{ textDecoration: "none", fontSize: "0.875rem", color: "var(--ink-muted)", fontWeight: 500 }}>About</Link>
            <Link href="/artists" style={{ textDecoration: "none", fontSize: "0.875rem", color: "var(--ink-muted)", fontWeight: 500 }}>Artists</Link>
            <Link href="/premium" style={{ textDecoration: "none", fontSize: "0.875rem", color: "var(--ink-muted)", fontWeight: 500 }}>Premium</Link>
          </div>
          <div className="footer-inner" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink)", fontWeight: 700, letterSpacing: "0.1em" }}>Social</span>
            <a href="https://www.instagram.com/popok.official/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", fontSize: "0.875rem", color: "var(--ink-muted)", fontWeight: 500 }}>Instagram</a>
            <a href="mailto:popok.service@gmail.com" style={{ textDecoration: "none", fontSize: "0.875rem", color: "var(--ink-muted)", fontWeight: 500 }}>Contact</a>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        maxWidth: "1120px",
        margin: "40px auto 0",
        borderTop: "1px solid var(--border)",
      }} />

      {/* Bottom Info Section */}
      <div style={{
        maxWidth: "1120px",
        margin: "24px auto 0",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        fontSize: "0.75rem",
        color: "var(--ink-muted)",
        fontWeight: 500
      }}>
        {/* Row 1: Policies (left) & Domain (right) */}
        <div className="footer-bottom-row" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/terms" style={{ color: "inherit", textDecoration: "none" }} onMouseOver={(e) => e.currentTarget.style.textDecoration = "underline"} onMouseOut={(e) => e.currentTarget.style.textDecoration = "none"}>이용약관</Link>
            <span style={{ color: "var(--border-dark)" }}>·</span>
            <Link href="/privacy" style={{ color: "inherit", textDecoration: "none", fontWeight: 700 }} onMouseOver={(e) => e.currentTarget.style.textDecoration = "underline"} onMouseOut={(e) => e.currentTarget.style.textDecoration = "none"}>개인정보처리방침</Link>
            <span style={{ color: "var(--border-dark)" }}>·</span>
            <Link href="/copyright" style={{ color: "inherit", textDecoration: "none" }} onMouseOver={(e) => e.currentTarget.style.textDecoration = "underline"} onMouseOut={(e) => e.currentTarget.style.textDecoration = "none"}>저작권 및 콘텐츠 정책</Link>
            <span style={{ color: "var(--border-dark)" }}>·</span>
            <a href="mailto:popok.service@gmail.com" aria-label="POPOK 운영팀으로 이메일 문의 보내기" style={{ color: "inherit", textDecoration: "none" }} onMouseOver={(e) => e.currentTarget.style.textDecoration = "underline"} onMouseOut={(e) => e.currentTarget.style.textDecoration = "none"}>문의하기</a>
          </div>
          <span className="mono" style={{ fontSize: "0.65rem" }}>popok.kr</span>
        </div>

        {/* Row 2: Corporate details (left) & Copyright (right) */}
        <div className="footer-bottom-row" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <span>{isKo ? "대표 이다연" : "Representative: Dayeon Lee"}</span>
            <span style={{ color: "var(--border-dark)" }}>|</span>
            <span>
              E-mail.{" "}
              <a href="mailto:popok.service@gmail.com" aria-label="POPOK 운영팀으로 이메일 문의 보내기" style={{ color: "inherit", textDecoration: "none" }} onMouseOver={(e) => e.currentTarget.style.textDecoration = "underline"} onMouseOut={(e) => e.currentTarget.style.textDecoration = "none"}>
                popok.service@gmail.com
              </a>
            </span>
          </div>
          <span>© 2026 POPOK. All rights reserved.</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-inner {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            margin-bottom: 8px;
          }
          .footer-bottom-row {
            flex-direction: column !important;
            align-items: center !important;
            gap: 12px !important;
            text-align: center !important;
          }
        }
      `}</style>
    </footer>
  );
}
