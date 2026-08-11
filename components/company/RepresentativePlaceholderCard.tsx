"use client";

import React from "react";

export default function RepresentativePlaceholderCard() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "310px",
        aspectRatio: "0.68",
        background: "#FAF8F5", // Clean neutral background
        border: "1.5px solid var(--border)",
        borderRadius: "18px",
        boxShadow: "0 24px 50px -12px rgba(23, 20, 17, 0.12)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
      }}
    >
      {/* Corner Marks (Editorial Styling consistent with PopokCard) */}
      <div style={{ position: "absolute", top: "10px", left: "10px", width: "6px", height: "6px", borderTop: "1px solid #C8C2B7", borderLeft: "1px solid #C8C2B7" }} />
      <div style={{ position: "absolute", top: "10px", right: "10px", width: "6px", height: "6px", borderTop: "1px solid #C8C2B7", borderRight: "1px solid #C8C2B7" }} />
      <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "6px", height: "6px", borderBottom: "1px solid #C8C2B7", borderLeft: "1px solid #C8C2B7" }} />
      <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "6px", height: "6px", borderBottom: "1px solid #C8C2B7", borderRight: "1px solid #C8C2B7" }} />

      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1.5px solid var(--navy)",
          paddingBottom: "8px",
        }}
      >
        <div style={{ fontWeight: 950, fontSize: "0.95rem", color: "var(--navy)", letterSpacing: "-0.04em", display: "inline-flex", alignItems: "center", gap: "2px" }}>
          POPOK
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "var(--border)" }} />
        </div>
        <span className="mono" style={{ fontSize: "0.58rem", fontWeight: 800, color: "var(--ink-muted)", letterSpacing: "0.06em" }}>
          ARTISTIC DIRECTOR
        </span>
      </div>

      {/* Center Content: Symbol, Title, Subtext */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexGrow: 1,
          padding: "16px 0",
          gap: "14px",
        }}
      >
        {/* Placeholder Avatar Box */}
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "#EFECE6",
            border: "1.5px dashed var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ink-muted)",
          }}
        >
          {/* Stylized Profile Icon */}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        {/* Text Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "center" }}>
          <h3
            style={{
              fontSize: "0.95rem",
              fontWeight: 800,
              color: "var(--navy)",
              margin: 0,
              letterSpacing: "-0.02em",
              wordBreak: "keep-all",
              lineHeight: 1.4,
            }}
          >
            단체 대표자가 아직 등록되지 않았습니다.
          </h3>
          <p
            style={{
              fontSize: "0.72rem",
              color: "var(--ink-muted)",
              margin: 0,
              wordBreak: "keep-all",
              lineHeight: 1.4,
              padding: "0 10px",
            }}
          >
            대표 아티스트가 연결되면 이곳에 개인 POPOK이 표시됩니다.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1.5px solid var(--navy)",
          paddingTop: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <span style={{ display: "block", fontSize: "0.45rem", color: "var(--ink-faint)", fontFamily: "monospace" }}>PORTFOLIO STATE</span>
          <span style={{ display: "block", fontSize: "0.72rem", fontWeight: 850, color: "var(--navy)", fontFamily: "monospace", letterSpacing: "0.02em" }}>
            REPRESENTATIVE PROFILE · COMING SOON
          </span>
        </div>
        
        {/* Barcode placeholder */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
          <div style={{ display: "flex", height: "14px", width: "70px", gap: "1px", opacity: 0.3 }}>
            <div style={{ width: "2px", background: "var(--navy)" }} /><div style={{ width: "1px", background: "var(--navy)" }} /><div style={{ width: "3px", background: "var(--navy)" }} />
            <div style={{ width: "1px", background: "var(--navy)" }} /><div style={{ width: "2px", background: "var(--navy)" }} /><div style={{ width: "1px", background: "var(--navy)" }} />
            <div style={{ width: "4px", background: "var(--navy)" }} /><div style={{ width: "2px", background: "var(--navy)" }} /><div style={{ width: "1px", background: "var(--navy)" }} />
            <div style={{ width: "2px", background: "var(--navy)" }} /><div style={{ width: "3px", background: "var(--navy)" }} />
          </div>
          <span style={{ fontSize: "0.45rem", color: "var(--ink-muted)", fontFamily: "monospace" }}>NO. PENDING</span>
        </div>
      </div>
    </div>
  );
}
