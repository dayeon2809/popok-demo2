"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PREMIUM_PLAN } from "@/lib/premiumPlans";
import { analytics } from "@/lib/analytics";
import { useLanguage } from "@/lib/useLanguage";
import { localizePath } from "@/lib/i18n/locale";

export default function AboutPremiumSection() {
  const { language } = useLanguage();
  const en = language === "en";
  const features = en ? [
    "More time for creating, less time spent documenting",
    "Automatic monitoring and updates for performance news",
    "Support for promotional performance content",
    "Features on POPOK's main page and social channels",
    "Ongoing review and management of activity records",
  ] : PREMIUM_PLAN.features;
  return (
    <section className="home-section" style={{
      background: "#FFFFFF",
      borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
      padding: "90px 24px",
    }}>
      <div className="responsive-stack-320" style={{
        maxWidth: "1120px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr",
        gap: "56px",
        alignItems: "center",
      }}>
        {/* Left copy text block */}
        <motion.div
          initial={{ opacity: 0, x: -25 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="mono" style={{ display: "block", marginBottom: "12px", color: "var(--ink-muted)", fontWeight: 700 }}>
            POPOK ARTIST
          </span>
          <h2 className="display" style={{
            fontSize: "clamp(1.6rem, 3.6vw, 2.3rem)",
            color: "var(--navy)",
            fontWeight: 950,
            letterSpacing: "-0.03em",
            lineHeight: 1.3,
            margin: "0 0 20px",
          }}>
            {en ? "When new work happens," : "활동이 생길 때마다"}<br />
            {en ? <>you should not have to <span className="seen-highlight" style={{ paddingBottom: "2px" }}>start organizing from scratch</span></> : <><span className="seen-highlight" style={{ paddingBottom: "2px" }}>처음부터 다시 정리</span>하지 않아도 되도록</>}
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--ink-muted)", lineHeight: 1.8, marginBottom: "32px", maxWidth: "480px", fontWeight: 500 }}>
            {en ? "POPOK Artist is more than a plan with additional features. It reduces the burden of organizing and updating, so an artist's portfolio can continue to grow." : "POPOK Artist는 기능을 더 많이 제공하는 요금제에 그치지 않고, 예술가의 포트폴리오가 계속 이어질 수 있도록 정리와 업데이트의 부담을 줄여주는 서비스입니다."}
          </p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ display: "inline-block" }}>
            <Link
              href={localizePath("/popok-artist", language)}
              onClick={() => analytics.premiumClick("about_premium_section")}
              className="btn-lime premium-cta-btn"
              style={{
                textDecoration: "none",
                padding: "16px 32px",
                borderRadius: "999px",
                fontSize: "0.92rem",
                fontWeight: 900,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(200,238,82,0.3)"
              }}
            >
              {en ? "Explore POPOK Artist" : "POPOK Artist 알아보기"}
              <span className="arrow" style={{ fontSize: "1.05rem", transition: "transform 0.2s" }}>→</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Right card showing list of features */}
        <motion.div
          initial={{ opacity: 0, x: 25 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="about-premium-card"
          style={{
            background: "#FFFFFF",
            border: "1.5px solid var(--navy)",
            borderRadius: "22px",
            padding: "36px 30px",
            boxShadow: "0 16px 40px rgba(23,20,17,0.06)",
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          <span className="mono" style={{ 
            display: "inline-block", 
            marginBottom: "20px", 
            color: "var(--ink-muted)",
            borderBottom: "1.5px solid var(--accent)",
            paddingBottom: "2px"
          }}>
            {en ? "What we manage with you" : "함께 관리하는 것들"}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {features.map((feature, idx) => (
              <motion.div 
                key={feature} 
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <span className="checkmark-bubble" style={{
                  width: "20px", 
                  height: "20px", 
                  borderRadius: "50%",
                  background: "var(--accent)", 
                  flexShrink: 0,
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(200,238,82,0.4)",
                  transition: "transform 0.2s"
                }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 4L4 6.5L8.5 1.5" stroke="var(--navy)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span style={{ fontSize: "0.92rem", color: "var(--navy)", fontWeight: 800 }}>{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <style>{`
        .premium-cta-btn:hover .arrow {
          transform: translateX(4px);
        }
        .about-premium-card:hover {
          transform: scale(1.01) translateY(-2px);
          box-shadow: 0 20px 48px rgba(23,20,17,0.09) !important;
        }
        .about-premium-card:hover .checkmark-bubble {
          transform: scale(1.1);
        }
      `}</style>
    </section>
  );
}
