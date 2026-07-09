"use client";

import type { Performance } from "@/types";
import { getPerformancePosterUrl } from "@/lib/performances";

function colorFromName(name: string): string {
  const colors = ["#F5A623", "#1E2D40", "#4A8C6F", "#9B59B6", "#E06060", "#2980B9", "#F39C12", "#16A085"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

interface PerformanceCardProps {
  performance: Performance;
  onClick?: () => void;
}

export default function PerformanceCard({ performance: p, onClick }: PerformanceCardProps) {
  const color = colorFromName(p.title);
  const initial = p.title.charAt(0);
  const posterUrl = getPerformancePosterUrl(p);

  // Format date nicely
  const formatDateRange = () => {
    if (!p.startDate) return "일정 미정";
    if (!p.endDate || p.startDate === p.endDate) return p.startDate;
    return `${p.startDate} ~ ${p.endDate}`;
  };

  return (
    <div
      className="card"
      onClick={onClick}
      style={{ cursor: "pointer", display: "flex", flexDirection: "column", width: "100%", height: "100%" }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {/* Poster / Fallback Gradient */}
      <div style={{
        width: "100%",
        aspectRatio: "3/4", // Standard poster ratio (portrait)
        overflow: "hidden",
        background: posterUrl
          ? `url(${posterUrl}) center/cover no-repeat`
          : `linear-gradient(135deg, ${color}2A 0%, ${color}4B 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}>
        {!posterUrl && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "20px" }}>
            <span style={{ fontSize: "3.6rem", fontWeight: 900, color, opacity: 0.6 }}>{initial}</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--ink-muted)", textAlign: "center", opacity: 0.8 }}>
              {p.title}
            </span>
          </div>
        )}
        
        {/* Genre Tags top-right */}
        {p.genre && p.genre.length > 0 && (
          <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", gap: "4px" }}>
            <span className="tag" style={{ fontSize: "0.6rem", padding: "3px 8px" }}>
              {p.genre[1] || p.genre[0]}
            </span>
          </div>
        )}
      </div>

      {/* Info details */}
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "6px", flexGrow: 1 }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--accent-dark)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {p.company || "기타 단체"}
        </span>
        
        <h3 style={{ 
          fontSize: "1.05rem", 
          fontWeight: 800, 
          color: "var(--navy)", 
          lineHeight: 1.25, 
          letterSpacing: "-0.01em",
          margin: "2px 0"
        }}>
          {p.title}
        </h3>
        
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "4px", paddingTop: "8px" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
            📅 {formatDateRange()}
          </p>
          {p.venue && (
            <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              📍 {p.venue}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
