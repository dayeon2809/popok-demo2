"use client";

import { motion } from "framer-motion";

export default function OriginStorySection() {
  const problems = [
    { num: "01", text: "공연이 끝날 때마다 이력서를 다시 고치고," },
    { num: "02", text: "작품 사진과 영상은 여러 폴더에 흩어지고," },
    { num: "03", text: "다가오는 활동은 SNS에서 금방 지나갑니다." }
  ];

  return (
    <section className="home-section" style={{
      borderTop: "1px solid var(--border)",
      background: "#FFFFFF",
      padding: "90px 24px",
      position: "relative",
      overflow: "hidden"
    }}>
      <div className="responsive-stack-320" style={{
        maxWidth: "1120px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1.2fr 0.8fr",
        gap: "56px",
        alignItems: "start",
      }}>
        {/* Left: Pain points & Solution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="display" style={{
            fontSize: "clamp(1.7rem, 3.8vw, 2.5rem)",
            color: "var(--navy)",
            fontWeight: 950,
            letterSpacing: "-0.03em",
            lineHeight: 1.3,
            margin: "0 0 32px",
          }}>
            예술가의 활동은 계속되는데,<br />
            <span style={{ color: "var(--ink-muted)" }}>기록은 자꾸 흩어집니다.</span>
          </h2>

          {/* Restructuring paragraph into styled problem blocks */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
            {problems.map((prob, idx) => (
              <motion.div
                key={prob.num}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  background: "#FFFFFF",
                  border: "1.5px solid var(--border)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  boxShadow: "0 4px 10px rgba(23,20,17,0.02)"
                }}
              >
                <span className="mono" style={{ 
                  color: "var(--accent-dark)", 
                  fontWeight: 900, 
                  fontSize: "0.9rem",
                  background: "var(--accent-light)",
                  padding: "2px 8px",
                  borderRadius: "6px"
                }}>
                  {prob.num}
                </span>
                <span style={{ fontSize: "0.95rem", color: "var(--navy)", fontWeight: 700 }}>
                  {prob.text}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{
              borderLeft: "3px solid var(--navy)",
              paddingLeft: "16px",
              marginTop: "24px"
            }}
          >
            <p style={{
              fontSize: "1.05rem",
              color: "var(--ink)",
              lineHeight: 1.85,
              fontWeight: 800,
              maxWidth: "560px",
            }}>
              POPOK은 예술가의 활동을 한곳에 남기고,<br />
              다음 활동으로 자연스럽게 이어지게 하기 위해 시작되었습니다.
            </p>
          </motion.div>
        </motion.div>

        {/* Right: Founder's Note Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            background: "#FFFFFF",
            border: "1.5px solid var(--navy)",
            borderRadius: "20px",
            padding: "36px 30px",
            boxShadow: "0 16px 32px rgba(23,20,17,0.06)",
            position: "relative",
          }}
        >
          {/* Big Quote Mark in Background */}
          <div style={{
            position: "absolute",
            top: "16px",
            right: "24px",
            fontSize: "4rem",
            fontWeight: 900,
            color: "var(--accent-light)",
            opacity: 0.5,
            lineHeight: 1,
            pointerEvents: "none",
            userSelect: "none"
          }}>
            ”
          </div>

          <span className="mono" style={{ 
            display: "inline-block", 
            marginBottom: "16px", 
            color: "var(--ink-muted)",
            borderBottom: "1.5px solid var(--accent)",
            paddingBottom: "2px"
          }}>
            FOUNDER&apos;S NOTE
          </span>
          
          <p style={{ 
            fontSize: "0.95rem", 
            color: "var(--ink-muted)", 
            lineHeight: 1.8, 
            margin: "0 0 28px",
            fontWeight: 500,
          }}>
            예술가이자 연출진으로서 겪었던 복잡하고 파편화된 프로필 관리의 한계를 해결하기 위해 POPOK을 시작했습니다.
            예술가의 시간이 흩어지지 않고 기록으로 남는 방식을 만들어가고 있습니다.
          </p>

          <div style={{ 
            borderTop: "1px solid var(--border)", 
            paddingTop: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 950, color: "var(--navy)" }}>이다연</div>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--accent-dark)", marginTop: "2px" }}>
                POPOK Founder · Dancer
              </div>
            </div>
            {/* Signature Accent */}
            <span style={{
              fontFamily: "monospace",
              fontSize: "0.7rem",
              color: "var(--ink-faint)",
              letterSpacing: "0.1em"
            }}>
              POPOK.KR
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
