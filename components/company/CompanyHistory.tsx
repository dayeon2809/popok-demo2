"use client";

import React from "react";
import type { Company } from "@/types";

interface CompanyHistoryProps {
  company: Company;
}

export default function CompanyHistory({ company }: CompanyHistoryProps) {
  const brandAccent = company.brand_color || "#171411";

  const historyList = company.history && company.history.length > 0
    ? company.history
    : [
        { year: "2020", event: "단체 창단 (Founded in Seoul)" },
        { year: "2021", event: "아르코 예술극장 신진 예술가 레지던시 선정 (ARKO Residency)" },
        { year: "2022", event: "프랑스 파리 국제 현대무용 페스티벌 초청 공연 (Paris Tour)" },
        { year: "2023", event: "올해의 예술가상 최우수 작품 부문 수상 (Grand Prix)" },
        { year: "2025", event: "POPOK 피처드 아티스트 단체 인터뷰 참여 (POPOK Interview)" },
      ];

  return (
    <section
      style={{
        padding: "60px 0",
        borderBottom: "1.5px solid var(--border)",
      }}
    >
      <style jsx global>{`
        .history-grid-row {
          display: grid;
          grid-template-columns: 120px 1fr;
          align-items: baseline;
          padding: 20px 0;
          gap: 24px;
        }
        @media (max-width: 768px) {
          .history-grid-row {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
            padding: 16px 0 !important;
          }
          .history-year {
            font-size: 1.15rem !important;
          }
          .history-event {
            font-size: 0.88rem !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        <h3
          className="mono"
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            color: "var(--navy)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "32px",
          }}
        >
          Company History
        </h3>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {historyList.map((item, idx) => (
            <div key={idx}>
              {/* Row */}
              <div className="history-grid-row">
                {/* Year */}
                <span
                  className="history-year"
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 900,
                    color: brandAccent,
                    letterSpacing: "-0.01em"
                  }}
                >
                  {item.year}
                </span>

                {/* Event */}
                <p
                  className="history-event"
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: 600,
                    color: "var(--navy)",
                    margin: 0,
                    lineHeight: 1.5,
                    wordBreak: "keep-all",
                    whiteSpace: "pre-line"
                  }}
                >
                  {item.event}
                </p>
              </div>

              {/* Divider (Skip for the last element) */}
              {idx < historyList.length - 1 && (
                <div style={{ width: "100%", height: "1px", backgroundColor: "var(--border-light)" }} />
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
