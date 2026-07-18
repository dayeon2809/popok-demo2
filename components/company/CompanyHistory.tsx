"use client";

import React from "react";
import type { Company } from "@/types";

interface CompanyHistoryProps {
  company: Company;
}

export default function CompanyHistory({ company }: CompanyHistoryProps) {
  const brandAccent = company.brand_color || "#171411";

  const historyList = Array.isArray(company.history) ? company.history : [];
  if (historyList.length === 0) return null;

  return (
    <section
      style={{
        padding: "50px 0",
        borderBottom: "1px solid var(--border)",
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
