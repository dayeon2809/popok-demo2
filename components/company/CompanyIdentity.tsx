"use client";

import React from "react";
import type { Company } from "@/types";

interface CompanyIdentityProps {
  company: Company;
}

export default function CompanyIdentity({ company }: CompanyIdentityProps) {
  const brandAccent = company.brand_color || "#171411";

  const missionText =
    company.mission ||
    company.bio ||
    "우리는 신체의 움직임이 언어를 넘어서는 고유한 서사임을 믿으며, 현대 사회의 다양한 화두를 무대 위에 해체적이고 전위적인 방식으로 풀어내는 물리적 실험실을 지향합니다.";

  const visionText =
    company.vision ||
    "국내외 예술 교류 네트워크의 구심점이 되어, 무용뿐만 아니라 다원 예술 영역을 아우르는 디지털/피지컬 융복합 아카이브 생태계를 개척합니다.";

  const valuesList = company.values && company.values.length > 0
    ? company.values
    : ["Experiment", "Community", "Archive", "Challenge"];

  return (
    <section
      style={{
        padding: "60px 0",
        borderBottom: "1.5px solid var(--border)",
      }}
    >
      <style jsx global>{`
        .identity-wrapper {
          max-width: 800px;
          margin: 0 auto;
        }
        .identity-block {
          margin-bottom: 40px;
        }
        .identity-title {
          font-family: 'Pretendard Variable', sans-serif;
          font-size: 0.72rem;
          font-weight: 850;
          color: var(--ink-muted);
          letter-spacing: 0.08em;
          display: block;
          margin-bottom: 12px;
          text-transform: uppercase;
        }
        .identity-mission-text {
          font-size: clamp(1.15rem, 3vw, 1.45rem);
          font-weight: 800;
          color: var(--navy);
          line-height: 1.6;
          margin: 0;
          word-break: keep-all;
          letter-spacing: -0.02em;
        }
        .identity-vision-text {
          font-size: clamp(1.05rem, 2.5vw, 1.3rem);
          font-weight: 600;
          color: var(--ink-muted);
          line-height: 1.55;
          margin: 0;
          word-break: keep-all;
          letter-spacing: -0.01em;
        }
        .values-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 14px;
        }
        @media (max-width: 768px) {
          .identity-block {
            margin-bottom: 30px !important;
          }
          .identity-mission-text {
            font-size: 1.08rem !important;
            line-height: 1.5 !important;
          }
          .identity-vision-text {
            font-size: 0.98rem !important;
            line-height: 1.5 !important;
          }
        }
      `}</style>

      <div className="identity-wrapper">
        
        {/* MISSION */}
        <div className="identity-block">
          <span className="identity-title" style={{ color: brandAccent }}>
            MISSION
          </span>
          <h3 className="identity-mission-text">
            {missionText}
          </h3>
        </div>

        <div style={{ width: "100%", height: "1px", backgroundColor: "var(--border-light)", marginBottom: "40px" }} />

        {/* VISION */}
        <div className="identity-block">
          <span className="identity-title" style={{ color: brandAccent }}>
            VISION
          </span>
          <h3 className="identity-vision-text">
            {visionText}
          </h3>
        </div>

        <div style={{ width: "100%", height: "1px", backgroundColor: "var(--border-light)", marginBottom: "40px" }} />

        {/* VALUES */}
        <div>
          <span className="identity-title" style={{ color: brandAccent }}>
            CORE VALUES
          </span>
          <div className="values-container">
            {valuesList.map((val, idx) => (
              <span
                key={idx}
                className="tag-navy"
                style={{
                  fontSize: "0.78rem",
                  padding: "6px 16px",
                  borderRadius: "20px",
                  fontWeight: 700,
                  backgroundColor: "var(--navy)",
                  color: "#FFFFFF",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: brandAccent }} />
                {val}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
