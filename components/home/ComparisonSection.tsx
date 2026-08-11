"use client";

import { motion } from "framer-motion";

const BEFORE_ITEMS = [
  "이력은 PDF",
  "작품은 구글 드라이브",
  "공연 소식은 인스타그램",
  "소개는 노션 또는 개인 웹사이트",
  "업데이트할 때마다 다시 정리",
];

const AFTER_ITEMS = [
  "포트폴리오",
  "작품과 활동 이력",
  "다가오는 공연",
  "홍보 콘텐츠",
  "연락처와 링크",
  "지속적인 업데이트",
];

export default function ComparisonSection() {
  return (
    <section className="home-section comparison-section" style={{
      maxWidth: "1120px",
      margin: "0 auto",
      padding: "90px 24px",
      borderTop: "1px solid var(--border)",
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: "40px", maxWidth: "640px" }}
      >
        <h2 className="display" style={{
          fontSize: "clamp(1.7rem, 3.8vw, 2.4rem)",
          color: "var(--navy)",
          fontWeight: 950,
          letterSpacing: "-0.03em",
          margin: "0 0 14px",
        }}>
          흩어진 활동 기록, 이제 하나로
        </h2>
      </motion.div>

      <div className="responsive-stack-320 comparison-grid" style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        alignItems: "stretch",
      }}>
        {/* Before: scattered tools */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            background: "#FFFFFF",
            border: "1.5px solid var(--border)",
            borderRadius: "18px",
            padding: "28px 26px",
            boxShadow: "0 4px 12px rgba(23,20,17,0.02)"
          }}
        >
          <span className="mono" style={{ display: "block", marginBottom: "18px", color: "var(--ink-muted)", fontWeight: 700 }}>
            BEFORE
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {BEFORE_ITEMS.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--border-dark)", flexShrink: 0 }} />
                <span style={{ fontSize: "0.9rem", color: "var(--ink-muted)", fontWeight: 600 }}>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* After: one POPOK profile */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            background: "var(--navy)",
            border: "1.5px solid var(--navy)",
            borderRadius: "18px",
            padding: "28px 26px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 12px 24px rgba(23,20,17,0.1)"
          }}
        >
          <span className="mono" style={{ display: "block", marginBottom: "18px", color: "rgba(255,255,255,0.55)", fontWeight: 700 }}>
            WITH POPOK
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {AFTER_ITEMS.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{
                  width: "18px", height: "18px", borderRadius: "50%",
                  background: "var(--accent)", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 900, color: "var(--navy)",
                }}>
                  ✓
                </span>
                <span style={{ fontSize: "0.9rem", color: "#FFFFFF", fontWeight: 700 }}>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          marginTop: "32px",
          fontSize: "1rem",
          fontWeight: 800,
          color: "var(--navy)",
          letterSpacing: "-0.01em",
          lineHeight: 1.6,
        }}
      >
        기록하고, 보여주고, 다음 활동을 더하는 과정이<br />
        하나의 POPOK 안에서 이어집니다.
      </motion.p>
    </section>
  );
}

