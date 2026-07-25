"use client";

import { motion } from "framer-motion";

const STEPS = [
  { 
    num: "01", 
    title: "AI 모니터링 시작", 
    body: "흩어진 작품과 이력 자료를 감지하여 한곳에 수집하기 시작합니다." 
  },
  { 
    num: "02", 
    title: "새로운 활동 확인", 
    body: "작품명, 역할, 연도와 자료의 실제 출처를 교차 확인합니다." 
  },
  { 
    num: "03", 
    title: "활동·작품 정리", 
    body: "보는 사람이 직관적으로 이해하기 쉬운 깔끔한 활동 기록으로 정리합니다." 
  },
  { 
    num: "04", 
    title: "포트폴리오 반영", 
    body: "최신 이력과 새로운 작품 정보가 포트폴리오 웹사이트에 즉시 반영됩니다." 
  },
  { 
    num: "05", 
    title: "새 활동 이어 쓰기", 
    body: "새 활동이 생길 때마다 끊김 없이 기존 포트폴리오에 이어서 기록을 축적합니다." 
  },
];

export default function HowWeWorkSection() {
  return (
    <section className="home-section" style={{
      maxWidth: "800px",
      margin: "0 auto",
      padding: "90px 24px",
    }}>
      <motion.h2 
        className="display" 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{
          fontSize: "clamp(1.7rem, 3.8vw, 2.5rem)",
          color: "var(--navy)",
          fontWeight: 950,
          letterSpacing: "-0.03em",
          margin: "0 0 54px",
        }}
      >
        POPOK이 기록을 다루는 방식
      </motion.h2>

      <div style={{ position: "relative", paddingLeft: "16px" }}>
        {/* Timeline line - Styled dashed connector */}
        <div style={{
          position: "absolute", 
          left: "24px", 
          top: "24px", 
          bottom: "24px",
          width: "2px", 
          borderLeft: "2px dashed var(--border-dark)",
        }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {STEPS.map((step, idx) => (
            <motion.div 
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              style={{ display: "flex", gap: "24px", alignItems: "flex-start", position: "relative" }}
            >
              {/* Step indicator circle badge */}
              <div 
                style={{
                  flexShrink: 0, 
                  width: "18px", 
                  height: "18px", 
                  borderRadius: "50%",
                  background: "var(--accent)", 
                  border: "2px solid var(--navy)",
                  zIndex: 2,
                  marginTop: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 0 4px #FFFFFF"
                }} 
              />

              {/* Step Card with hover lift effect */}
              <div 
                className="about-step-card"
                style={{
                  flex: 1,
                  background: "#FFFFFF",
                  border: "1.5px solid var(--border)",
                  borderRadius: "16px",
                  padding: "20px 24px",
                  boxShadow: "0 4px 12px rgba(23,20,17,0.02)",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  cursor: "default"
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "8px" }}>
                  <span className="mono" style={{ 
                    fontSize: "0.8rem", 
                    color: "var(--accent-dark)", 
                    fontWeight: 900,
                    letterSpacing: "0.05em"
                  }}>
                    {step.num}
                  </span>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--navy)", margin: 0 }}>
                    {step.title}
                  </h3>
                </div>
                <p style={{ fontSize: "0.92rem", color: "var(--ink-muted)", lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
                  {step.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        .about-step-card:hover {
          border-color: var(--navy) !important;
          transform: translateY(-3px);
          box-shadow: 0 12px 24px rgba(23,20,17,0.06) !important;
        }
      `}</style>
    </section>
  );
}

