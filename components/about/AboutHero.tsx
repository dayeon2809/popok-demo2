"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/useLanguage";

export default function AboutHero() {
  const { language } = useLanguage();
  const en = language === "en";
  return (
    <section 
      className="home-section about-hero-section" 
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "100px 24px 80px",
        textAlign: "center",
        position: "relative",
      }}
    >
      {/* Decorative subtle background gradient blur */}
      <div style={{
        position: "absolute",
        top: "10%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "300px",
        height: "300px",
        background: "var(--accent-light)",
        filter: "blur(120px)",
        borderRadius: "50%",
        opacity: 0.6,
        zIndex: -1,
        pointerEvents: "none"
      }} />

      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "#FFFFFF",
          border: "1.5px solid var(--navy)",
          borderRadius: "999px",
          padding: "6px 16px",
          marginBottom: "32px",
          boxShadow: "0 4px 12px rgba(23,20,17,0.04)"
        }}
      >
        <span 
          style={{ 
            width: "8px", 
            height: "8px", 
            borderRadius: "50%", 
            background: "var(--accent-dark)", 
            display: "inline-block",
            boxShadow: "0 0 8px var(--accent)"
          }} 
        />
        <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--navy)", letterSpacing: "0.1em" }}>
          ABOUT POPOK
        </span>
      </motion.div>

      <motion.h1 
        className="display" 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        style={{
          fontSize: "clamp(2.2rem, 6vw, 3.6rem)",
          color: "var(--navy)",
          fontWeight: 950,
          letterSpacing: "-0.04em",
          lineHeight: 1.25,
          marginBottom: "32px",
        }}
      >
        {en ? "So your work is never lost," : "활동이 사라지지 않도록,"}<br />
        {en ? <>we rethink <span className="seen-highlight" style={{ paddingBottom: "4px" }}>how it is documented</span>.</> : <><span className="seen-highlight" style={{ paddingBottom: "4px" }}>기록의 방식</span>을 다시 생각합니다.</>}
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        style={{
          fontSize: "clamp(1rem, 2vw, 1.15rem)",
          color: "var(--ink-muted)",
          lineHeight: 1.85,
          maxWidth: "600px",
          margin: "0 auto",
          fontWeight: 500,
        }}
      >
        {en ? <>POPOK began with the belief that an artist&apos;s work should not end with a single introduction,<br className="desktop-only-break" /> but should build into a lasting record over time.</> : <>POPOK은 예술가의 활동이 한 번의 소개로 끝나지 않고,<br className="desktop-only-break" /> 시간 속에 차곡차곡 쌓여야 한다는 생각에서 시작했습니다.</>}
      </motion.p>

      {/* Elegant design line decoration */}
      <motion.div 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.5, ease: "easeInOut" }}
        style={{
          width: "80px",
          height: "2px",
          background: "linear-gradient(90deg, transparent, var(--border-dark), transparent)",
          margin: "48px auto 0",
        }}
      />
    </section>
  );
}
