"use client";

import Link from "next/link";
import { PREMIUM_PLAN } from "@/lib/premiumPlans";
import { analytics } from "@/lib/analytics";

export default function PremiumSection() {
  return (
    <section className="home-section home-premium-section" style={{
      maxWidth: "1120px",
      margin: "0 auto",
      padding: "72px 32px",
    }}>
      <div style={{
        background: "var(--navy)",
        borderRadius: "24px",
        padding: "56px 40px",
        display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr",
        gap: "40px",
        alignItems: "center",
      }} className="responsive-stack-320 home-premium-panel">
        <div>
          <span style={{
            display: "inline-block",
            fontSize: "0.72rem", fontWeight: 800, color: "var(--navy)",
            background: "var(--accent)", padding: "4px 10px", borderRadius: "20px",
            letterSpacing: "0.03em", marginBottom: "20px",
          }}>
            POPOK Artist
          </span>

          <h2 className="display" style={{
            fontSize: "clamp(1.7rem, 3.8vw, 2.4rem)",
            color: "#FFFFFF",
            fontWeight: 950,
            letterSpacing: "-0.03em",
            lineHeight: 1.25,
            margin: "0 0 18px",
          }}>
            창작은 당신이.<br />포트폴리오는 POPOK이 관리합니다.
          </h2>

          <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.7)", fontWeight: 600, lineHeight: 1.7, margin: "0 0 28px", maxWidth: "440px" }}>
            활동이 생길 때마다 다시 정리하지 않아도 괜찮아요.
            POPOK이 작품과 이력을 최신 상태로 관리하고,
            다가오는 공연과 새로운 활동을 더 잘 알릴 수 있도록 돕습니다.
          </p>

          <Link
            href="/popok-artist"
            onClick={() => analytics.premiumClick("home_premium_section")}
            className="btn-lime"
            style={{
              textDecoration: "none",
              padding: "14px 28px",
              borderRadius: "999px",
              fontSize: "0.9rem",
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            POPOK Artist 알아보기 <span style={{ fontSize: "1.05rem" }}>→</span>
          </Link>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: "18px",
          padding: "28px 24px",
        }}>
          <span className="mono" style={{ display: "block", marginBottom: "16px", color: "rgba(255,255,255,0.55)" }}>
            POPOK Artist가 관리하는 것들
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {PREMIUM_PLAN.features.map((feature) => (
              <div key={feature} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{
                  width: "18px", height: "18px", borderRadius: "50%",
                  background: "var(--accent)", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.6rem", fontWeight: 900, color: "var(--navy)",
                }}>
                  ✓
                </span>
                <span style={{ fontSize: "0.88rem", color: "#FFFFFF", fontWeight: 700 }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
