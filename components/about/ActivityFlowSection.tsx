"use client";

import { motion } from "framer-motion";

const FLOW_STEPS = [
  "AI 모니터링 시작",
  "새로운 활동 확인",
  "활동·작품 정리",
  "포트폴리오 반영",
  "새 활동 이어 쓰기",
];

export default function ActivityFlowSection() {
  return (
    <section className="home-section" style={{
      maxWidth: "1120px",
      margin: "0 auto",
      padding: "90px 24px",
      borderTop: "1px solid var(--border)",
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
          margin: "0 0 48px",
        }}
      >
        한 번 만들고 끝내지 않는 운영 방식
      </motion.h2>

      <div className="activity-flow-row" style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
      }}>
        {FLOW_STEPS.map((step, i) => {
          const isLast = i === FLOW_STEPS.length - 1;
          return (
            <div key={step} className="flow-step-wrapper" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -2 }}
                style={{
                  padding: "16px 22px",
                  background: isLast ? "var(--navy)" : "#FFFFFF",
                  color: isLast ? "#FFFFFF" : "var(--navy)",
                  border: isLast ? "1.5px solid var(--navy)" : "1.5px solid var(--border)",
                  borderRadius: "14px",
                  fontSize: "0.9rem",
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  boxShadow: isLast 
                    ? "0 8px 20px rgba(23,20,17,0.15), 0 0 0 2px var(--accent)" 
                    : "0 4px 10px rgba(23,20,17,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "default",
                  transition: "border-color 0.2s, box-shadow 0.2s"
                }}
              >
                <span className="mono" style={{ 
                  fontSize: "0.75rem", 
                  color: isLast ? "var(--accent)" : "var(--accent-dark)",
                  fontWeight: 900
                }}>
                  {i + 1}
                </span>
                <span>{step}</span>
                {isLast && (
                  <span style={{ fontSize: "1rem", animation: "spin 4s linear infinite" }}>🔄</span>
                )}
              </motion.div>

              {!isLast && (
                <div className="flow-arrow-container" style={{ display: "flex", alignItems: "center" }}>
                  {/* Horizontal arrow for desktop */}
                  <svg 
                    className="flow-arrow-horizontal"
                    width="18" 
                    height="12" 
                    viewBox="0 0 18 12" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M1 6H17M17 6L12 1M17 6L12 11" 
                      stroke="var(--accent-dark)" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                  {/* Vertical arrow for mobile */}
                  <svg 
                    className="flow-arrow-vertical"
                    width="12" 
                    height="18" 
                    viewBox="0 0 12 18" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M6 1V17M6 17L1 12M6 17L11 12" 
                      stroke="var(--accent-dark)" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{
          marginTop: "36px",
          fontSize: "0.92rem",
          color: "var(--ink-muted)",
          lineHeight: 1.75,
          maxWidth: "640px",
          fontWeight: 500,
        }}
      >
        등록된 활동은 POPOK 안에서 소개될 수 있으며,
        선정된 아티스트와 공연은 콘텐츠와 채널을 통해 더 넓게 소개됩니다.
      </motion.p>

      <style>{`
        .flow-arrow-horizontal { display: block; }
        .flow-arrow-vertical { display: none; }

        @keyframes arrowPulseH {
          0%, 100% { transform: translateX(0); opacity: 0.6; }
          50% { transform: translateX(4px); opacity: 1; }
        }
        @keyframes arrowPulseV {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(4px); opacity: 1; }
        }
        .flow-arrow-horizontal path {
          animation: arrowPulseH 2.5s infinite ease-in-out;
        }
        .flow-arrow-vertical path {
          animation: arrowPulseV 2.5s infinite ease-in-out;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @media (max-width: 900px) {
          .activity-flow-row { 
            flex-direction: column !important; 
            align-items: center !important; 
            gap: 16px !important;
          }
          .flow-step-wrapper { 
            flex-direction: column !important; 
            align-items: center !important; 
            width: 100% !important;
          }
          .flow-step-wrapper > div:first-child {
            width: 100% !important;
            max-width: 280px !important;
            justify-content: center !important;
          }
          .flow-arrow-horizontal { display: none !important; }
          .flow-arrow-vertical { display: block !important; }
          .flow-arrow-container {
            padding: 8px 0 !important;
            margin: 4px 0 !important;
          }
        }
      `}</style>
    </section>
  );
}

