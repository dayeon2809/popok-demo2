"use client";

import { motion } from "framer-motion";

const STAGES = [
  {
    phase: "1단계 · 지금",
    status: "ACTIVE",
    statusColor: "var(--accent-dark)",
    statusBg: "var(--accent-light)",
    title: "활동을 기록합니다",
    tags: ["나만의 포트폴리오", "작품과 활동 관리", "개인·단체 프로필", "하나의 링크로 공유"],
    body: "예술가의 활동을 한곳에 기록하는 것부터 시작했습니다.",
  },
  {
    phase: "2단계 · 현재",
    status: "IN PROGRESS",
    statusColor: "#7A5C2E",
    statusBg: "#FFF8E6",
    title: "활동을 이어갑니다",
    tags: ["AI 기반 정리", "공연 정보 관리", "포트폴리오 업데이트", "POPOK 콘텐츠"],
    body: "새로운 활동이 생길 때마다 포트폴리오가 계속 이어질 수 있도록 만들고 있습니다.",
  },
  {
    phase: "3단계 · 앞으로",
    status: "UPCOMING",
    statusColor: "var(--ink-muted)",
    statusBg: "var(--tag-bg)",
    title: "더 많은 연결을 만듭니다",
    tags: ["예술단체 협업", "공연 홍보 확대", "기관 파트너십", "더 많은 활동 기회"],
    body: "기록된 활동이 더 많은 사람과 만날 수 있도록 POPOK의 역할을 넓혀갑니다.",
  },
];

export default function RoadmapSection() {
  return (
    <section className="home-section" style={{
      maxWidth: "1120px",
      margin: "0 auto",
      padding: "90px 24px",
      borderTop: "1px solid var(--border)",
    }}>
      <motion.span 
        className="mono" 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        style={{ display: "block", marginBottom: "12px", color: "var(--accent-dark)", fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.08em" }}
      >
        OUR JOURNEY & FUTURE
      </motion.span>
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
        POPOK 로드맵
      </motion.h2>

      <div className="roadmap-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "24px",
      }}>
        {STAGES.map((stage, i) => (
          <motion.div 
            key={stage.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="roadmap-card"
            style={{
              background: "#FFFFFF",
              border: "1.5px solid var(--border)",
              borderRadius: "16px",
              padding: "28px 24px",
              boxShadow: "0 2px 8px rgba(23,20,17,0.01)",
              display: "flex",
              flexDirection: "column",
              transition: "all 0.2s ease",
              cursor: "default"
            }}
          >
            {/* Stage & Status Badge */}
            <div style={{ display: "flex", marginBottom: "16px" }}>
              <span style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                color: stage.statusColor,
                background: stage.statusBg,
                padding: "4px 10px",
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <span className={stage.status === "IN PROGRESS" || stage.status === "진행 중" ? "status-dot pulsing" : "status-dot"} style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  backgroundColor: stage.statusColor,
                  display: "inline-block",
                }} />
                {stage.phase} : {stage.status}
              </span>
            </div>

            <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "var(--navy)", margin: "0 0 12px", letterSpacing: "-0.01em" }}>
              {stage.title}
            </h3>

            {/* Description */}
            <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", lineHeight: 1.65, margin: "0 0 20px", flexGrow: 1, fontWeight: 500 }}>
              {stage.body}
            </p>

            {/* Tags container */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "auto" }}>
              {stage.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="tag" 
                  style={{ 
                    fontSize: "0.72rem", 
                    background: "var(--tag-bg)", 
                    color: "var(--ink)",
                    padding: "3px 8px",
                    fontWeight: 600,
                    borderRadius: "8px"
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <style>{`
        .roadmap-card:hover {
          border-color: var(--navy) !important;
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(23,20,17,0.04) !important;
        }
        @keyframes pulsingDot {
          0% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.3); }
          100% { opacity: 0.4; transform: scale(0.9); }
        }
        .status-dot.pulsing {
          animation: pulsingDot 1.5s infinite ease-in-out;
        }
        @media (max-width: 900px) {
          .roadmap-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
        }
      `}</style>
    </section>
  );
}

