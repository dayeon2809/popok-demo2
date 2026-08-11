"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/useLanguage";

const ROLES_KO = [
  { 
    role: "기획 · 운영", 
    desc: "자료 접수부터 프로필 공개까지, POPOK의 전체 여정을 설계하고 운영합니다.",
    color: "var(--accent)",
    letter: "기"
  },
  { 
    role: "디자인", 
    desc: "예술가의 활동이 가장 잘 드러나는 화면과 톤을 만듭니다.",
    color: "var(--accent-yellow)",
    letter: "디"
  },
  { 
    role: "개발", 
    desc: "기록이 안정적으로 쌓이고 다음 활동으로 이어지는 서비스를 만듭니다.",
    color: "var(--accent-light)",
    letter: "개"
  },
  { 
    role: "콘텐츠 · 파트너십", 
    desc: "기록된 활동이 더 많은 사람과 단체에 소개되도록 연결합니다.",
    color: "var(--tag-bg)",
    letter: "콘"
  },
];

const ROLES_EN = [
  { role: "Planning · Operations", desc: "We design and operate the full POPOK journey, from receiving materials to publishing profiles.", color: "var(--accent)", letter: "P" },
  { role: "Design", desc: "We create screens and a visual tone that let each artist's practice come through clearly.", color: "var(--accent-yellow)", letter: "D" },
  { role: "Development", desc: "We build a reliable service where records accumulate and lead into the next activity.", color: "var(--accent-light)", letter: "D" },
  { role: "Content · Partnerships", desc: "We connect documented work with more people and organizations.", color: "var(--tag-bg)", letter: "C" },
];

export default function TeamSection() {
  const { language } = useLanguage();
  const en = language === "en";
  const roles = en ? ROLES_EN : ROLES_KO;
  return (
    <section className="home-section" style={{
      background: "#FFFFFF",
      borderTop: "1px solid var(--border)",
      padding: "100px 24px",
    }}>
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <motion.span 
          className="mono" 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ display: "block", marginBottom: "12px", color: "var(--accent-dark)", fontWeight: 800 }}
        >
          POPOK TEAM
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
            margin: "0 0 16px",
          }}
        >
          {en ? "The people building the record together" : "기록을 함께 만들어가는 사람들"}
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontSize: "0.95rem", color: "var(--ink-muted)", lineHeight: 1.75, margin: "0 0 48px", maxWidth: "560px", fontWeight: 500 }}
        >
          {en ? "POPOK began from the perspective of artists and creative teams. Today, our team brings different roles together to build the next stage of documentation." : "예술가이자 연출진으로 시작한 POPOK은, 각자의 역할로 기록의 다음 단계를 만들어가는 팀과 함께하고 있습니다."}
        </motion.p>

        <div className="team-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
        }}>
          {roles.map((item, idx) => (
            <motion.div 
              key={item.role}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="team-card"
              style={{
                background: "#FFFFFF",
                border: "1.5px solid var(--border)",
                borderRadius: "16px",
                padding: "22px 20px",
                transition: "border-color 0.2s ease",
                cursor: "default",
              }}
            >
              <span className="role-bubble" style={{
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                width: "36px", 
                height: "36px", 
                borderRadius: "50%",
                background: item.color, 
                fontSize: "0.85rem", 
                fontWeight: 900, 
                color: "var(--navy)",
                marginBottom: "16px",
              }}>
                {item.letter}
              </span>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--navy)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                {item.role}
              </h3>
              <p style={{ fontSize: "0.84rem", color: "var(--ink-muted)", lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        .team-card:hover {
          border-color: var(--navy) !important;
        }
        @media (max-width: 900px) {
          .team-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 20px !important; }
        }
        @media (max-width: 520px) {
          .team-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

