"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/useLanguage";

const VALUES = [
  { meta: "01", title: "기록", body: "작품, 공연, 이력을 한곳에 차곡차곡 남깁니다." },
  { meta: "02", title: "포트폴리오", body: "흩어진 자료를 하나의 페이지로 보여줍니다." },
  { meta: "03", title: "이어가기", body: "새로운 활동을 기존 기록에 계속 더합니다." },
  { meta: "04", title: "공유", body: "하나의 링크로 지금의 활동을 전달합니다." },
];

export default function ServiceValueSection() {
  const { language } = useLanguage();
  const en = language === "en";
  const values = en ? [
    { meta: "01", title: "Document", body: "Keep your works, performances, and career in one place." },
    { meta: "02", title: "Portfolio", body: "Present scattered materials as one coherent page." },
    { meta: "03", title: "Keep building", body: "Add each new activity to your existing record." },
    { meta: "04", title: "Share", body: "Share your current practice with a single link." },
  ] : VALUES;
  return (
    <section className="home-section service-value-section" style={{
      maxWidth: "1120px",
      margin: "0 auto",
      padding: "80px 24px",
      borderTop: "1px solid var(--border)",
    }}>
      <motion.h2 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="display" 
        style={{
          fontSize: "clamp(1.5rem, 3.2vw, 2rem)",
          color: "var(--navy)",
          fontWeight: 950,
          letterSpacing: "-0.03em",
          margin: "0 0 32px",
        }}
      >
        {en ? "From documentation to your next opportunity" : "기록부터 다음 활동까지 한곳에서"}
      </motion.h2>

      <div className="service-value-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "0",
        borderTop: "1px solid var(--border)",
      }}>
        {values.map((v, i) => (
          <motion.div 
            key={v.title} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="service-value-item" 
            style={{
              padding: "24px 20px 4px",
              borderRight: i < VALUES.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <span className="mono" style={{ color: "var(--accent-dark)", fontWeight: 800 }}>
              {v.meta}
            </span>
            <h3 style={{ fontSize: "1rem", fontWeight: 900, color: "var(--navy)", margin: "10px 0 6px", letterSpacing: "-0.01em" }}>
              {v.title}
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", lineHeight: 1.55, margin: 0 }}>
              {v.body}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
