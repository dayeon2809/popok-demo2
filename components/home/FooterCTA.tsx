"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface FooterCTAProps {
  title?: ReactNode;
  description?: ReactNode;
  primaryLabel?: string;
  secondaryLabel?: string;
  /** Overrides the primary CTA's destination — defaults to /auth (V1 landing page behavior). */
  primaryHref?: string;
  /** Fires alongside navigation — used by the V2 home to log home_create_popok_clicked. */
  onPrimaryClick?: () => void;
  /** Small badge line shown above the title, e.g. a "free during beta" message. */
  freeBadge?: ReactNode;
}

export default function FooterCTA({
  title = <>당신의 활동을<br />하나의 포퐄으로.</>,
  description = <>작품과 이력을 기록하고,<br />다음 활동까지 계속 이어가세요.</>,
  primaryLabel = "내 포퐄 만들기",
  secondaryLabel = "아티스트 둘러보기",
  primaryHref = "/auth",
  onPrimaryClick,
  freeBadge,
}: FooterCTAProps) {
  return (
    <section className="home-section home-footer-cta" style={{
      background: "var(--accent)",
      borderTop: "1px solid var(--navy)",
      borderBottom: "1px solid var(--navy)",
      padding: "100px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background scattered cards illustration with hover/viewport motion */}
      <motion.div 
        initial={{ opacity: 0, rotate: -20, x: 50 }}
        whileInView={{ opacity: 0.1, rotate: -12, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          position: "absolute",
          top: "10%",
          right: "10%",
          width: "400px",
          height: "350px",
          zIndex: 0,
          pointerEvents: "none",
          display: "flex",
          gap: "20px",
          transformOrigin: "bottom right"
        }} 
        className="header-nav-links"
      >
        <div style={{ width: "120px", height: "180px", border: "2px solid var(--navy)", borderRadius: "8px", background: "#FFFFFF" }} />
        <div style={{ width: "120px", height: "180px", border: "2px solid var(--navy)", borderRadius: "8px", background: "var(--accent)", transform: "translateY(40px)" }} />
        <div style={{ width: "120px", height: "180px", border: "2px solid var(--navy)", borderRadius: "8px", background: "#FFFFFF", transform: "translateY(-20px)" }} />
      </motion.div>

      <div style={{
        maxWidth: "1120px",
        margin: "0 auto",
        position: "relative",
        zIndex: 1
      }}>
        {freeBadge && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(23,20,17,0.06)", border: "1px solid var(--navy)",
              borderRadius: "20px", padding: "6px 14px", marginBottom: "18px",
            }}
          >
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--navy)", display: "inline-block" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)" }}>{freeBadge}</span>
          </motion.div>
        )}

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="display"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.6rem)",
            color: "var(--navy)",
            fontWeight: 950,
            lineHeight: 1.15,
            letterSpacing: "-0.04em",
            marginBottom: "20px",
            margin: 0
          }}
        >
          {title}
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
            color: "var(--navy)",
            fontWeight: 700,
            lineHeight: 1.5,
            marginBottom: "36px",
            maxWidth: "600px",
            letterSpacing: "-0.02em",
            marginTop: "12px"
          }}
        >
          {description}
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="cta-row" 
          style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
        >
          <Link href={primaryHref} onClick={onPrimaryClick} style={{
            textDecoration: "none",
            background: "var(--navy)",
            color: "#FFFFFF",
            padding: "16px 36px",
            borderRadius: "999px",
            fontSize: "0.95rem",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s ease",
          }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(23, 20, 17, 0.2)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}>
            {primaryLabel} <span style={{ fontSize: "1.1rem" }}>→</span>
          </Link>
          <Link href="/artists" className="btn-outline" style={{
            textDecoration: "none",
            padding: "16px 36px",
            borderRadius: "999px",
            fontSize: "0.95rem",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
          }}>
            {secondaryLabel}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

