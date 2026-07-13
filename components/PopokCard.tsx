"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface PopokCardProps {
  name: string;
  nameEn?: string;
  genre: string | null;
  instagram: string | null;
  id: string;
  slug?: string;
  profileImage?: string;
}

// NEXT_PUBLIC_ vars are inlined at build time, so this is identical in the
// server-rendered HTML and the client's first render — never derived from
// window.location, which would differ between the two and break hydration.
const PUBLIC_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://popok.kr";

export default function PopokCard({
  name,
  nameEn,
  genre,
  instagram,
  id,
  slug,
  profileImage,
}: PopokCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    // Adjust tilt direction depending on flipped state
    const multiplier = flipped ? -12 : 12;
    setTilt({
      x: x * multiplier,
      y: -y * multiplier,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const cleanInstagramHandle = (url: string | null) => {
    if (!url) return "@username";
    const cleaned = url.trim();
    if (cleaned.startsWith("@")) return cleaned;
    try {
      const rawPath = cleaned
        .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, "")
        .replace(/\/$/, "");
      const username = rawPath.split("/")[0].split("?")[0];
      return username ? `@${username}` : `@${name}`;
    } catch (e) {
      return `@${name}`;
    }
  };

  const effectiveSlug = slug || id;
  const detailHref = `/artists/${effectiveSlug}`;
  const displayPath = `popok.kr/${effectiveSlug}`;
  const profileUrl = `${PUBLIC_URL}${detailHref}`;

  const cardNo = id.substring(0, 4).toUpperCase();
  const displayEnglishName = nameEn || name.toUpperCase();
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(profileUrl)}`;

  // Clicking the link should navigate, not just flip the card.
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      {/* 3D Flip Card stage wrapper */}
      <div
        ref={cardRef}
        onClick={() => setFlipped(!flipped)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`flip-card-container ${flipped ? "flipped" : ""}`}
        style={{
          width: "100%",
          maxWidth: "310px", // 15-25% enlarged card (about 310px width)
          aspectRatio: "0.68", // Card vertical ratio
          transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.1s ease",
        }}
      >
        <div className="flip-card-inner">
          
          {/* ──────────────── FRONT SIDE (White/Cream membership pass) ──────────────── */}
          <div
            className="flip-card-front"
            style={{
              background: "#FFFFFF",
              border: "1.5px solid var(--border)",
              boxShadow: "0 24px 50px -12px rgba(23, 20, 17, 0.12)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "absolute",
              top: 0,
              left: 0,
              overflow: "hidden"
            }}
          >
            {/* Corner Marks (Editorial Styling) */}
            <div style={{ position: "absolute", top: "10px", left: "10px", width: "6px", height: "6px", borderTop: "1px solid #C8C2B7", borderLeft: "1px solid #C8C2B7" }} />
            <div style={{ position: "absolute", top: "10px", right: "10px", width: "6px", height: "6px", borderTop: "1px solid #C8C2B7", borderRight: "1px solid #C8C2B7" }} />
            <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "6px", height: "6px", borderBottom: "1px solid #C8C2B7", borderLeft: "1px solid #C8C2B7" }} />
            <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "6px", height: "6px", borderBottom: "1px solid #C8C2B7", borderRight: "1px solid #C8C2B7" }} />

            {/* Top Pass Title Header */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: "1.5px solid var(--navy)", paddingBottom: "8px"
            }}>
              {/* Typographic Logo */}
              <div style={{ fontWeight: 950, fontSize: "0.95rem", color: "var(--navy)", letterSpacing: "-0.04em", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                POPOK
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
              </div>
              <span className="mono" style={{ fontSize: "0.58rem", fontWeight: 800, color: "var(--ink-muted)", letterSpacing: "0.06em" }}>
                ARTIST ID CARD
              </span>
            </div>

            {/* Profile Picture (Centered Grayscale Portrait) */}
            <div style={{
              margin: "12px 0", width: "100%", aspectRatio: "1.05", borderRadius: "10px",
              overflow: "hidden", border: "1px solid var(--border)", background: "#F5F1E8",
              position: "relative"
            }}>
              <img
                src={profileImage || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name)}`}
                alt={name}
                className="popok-card-img"
                style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
              />
              {/* Little Lime Accent Label */}
              <div style={{
                position: "absolute", bottom: "8px", left: "8px", background: "var(--accent)",
                padding: "3px 8px", borderRadius: "6px", fontSize: "0.55rem", fontWeight: 850,
                color: "var(--navy)", border: "1px solid var(--navy)", letterSpacing: "0.02em"
              }}>
                POPOK CERTIFIED
              </div>
            </div>

            {/* Metadata Text Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 950, color: "var(--navy)", margin: 0, letterSpacing: "-0.02em" }}>
                  {name}
                </h3>
                <span className="mono" style={{ fontSize: "0.62rem", color: "var(--accent-dark)", fontWeight: 800, textTransform: "uppercase" }}>
                  {genre || "CREATIVE"}
                </span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--ink-muted)" }}>
                <span>{displayEnglishName}</span>
                <span>{cleanInstagramHandle(instagram)}</span>
              </div>
            </div>

            {/* Card Footer (Barcode / URL info) */}
            <div style={{
              borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "4px",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <span style={{ display: "block", fontSize: "0.45rem", color: "var(--ink-faint)", fontFamily: "monospace" }}>PORTFOLIO URL</span>
                <Link
                  href={detailHref}
                  onClick={handleLinkClick}
                  style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, color: "var(--navy)", fontFamily: "monospace", textDecoration: "none" }}
                >
                  {displayPath}
                </Link>
              </div>
              
              {/* Barcode representation */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                <div style={{ display: "flex", height: "14px", width: "70px", gap: "1px" }}>
                  <div style={{ width: "2px", background: "var(--navy)" }} /><div style={{ width: "1px", background: "var(--navy)" }} /><div style={{ width: "3px", background: "var(--navy)" }} />
                  <div style={{ width: "1px", background: "var(--navy)" }} /><div style={{ width: "2px", background: "var(--navy)" }} /><div style={{ width: "1px", background: "var(--navy)" }} />
                  <div style={{ width: "4px", background: "var(--navy)" }} /><div style={{ width: "2px", background: "var(--navy)" }} /><div style={{ width: "1px", background: "var(--navy)" }} />
                  <div style={{ width: "2px", background: "var(--navy)" }} /><div style={{ width: "3px", background: "var(--navy)" }} />
                </div>
                <span style={{ fontSize: "0.45rem", color: "var(--ink-muted)", fontFamily: "monospace" }}>NO. {cardNo}</span>
              </div>
            </div>

          </div>

          {/* ──────────────── BACK SIDE (Lime branding details) ──────────────── */}
          <div
            className="flip-card-back"
            style={{
              background: "var(--accent)",
              border: "1.5px solid var(--navy)",
              boxShadow: "0 24px 50px -12px rgba(23, 20, 17, 0.15)",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "absolute",
              top: 0,
              left: 0
            }}
          >
            {/* Minimal Background Card Graphic details */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.15 }}>
              <circle cx="50%" cy="50%" r="120" fill="none" stroke="var(--navy)" strokeWidth="1" />
              <circle cx="50%" cy="50%" r="80" fill="none" stroke="var(--navy)" strokeWidth="1" strokeDasharray="3 3" />
            </svg>

            {/* Back Logo */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1
            }}>
              <div style={{ fontWeight: 950, fontSize: "1.2rem", color: "var(--navy)", letterSpacing: "-0.04em", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                POPOK
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "var(--navy)" }} />
              </div>
              <span className="mono" style={{ fontSize: "0.55rem", fontWeight: 800, color: "var(--navy)", border: "1px solid var(--navy)", padding: "2px 6px", borderRadius: "4px" }}>
                PASS CODE: {cardNo}
              </span>
            </div>

            {/* Core Brand Tagline */}
            <div style={{ zIndex: 1, margin: "16px 0" }}>
              <p style={{
                fontSize: "1.65rem", fontWeight: 950, color: "var(--navy)",
                lineHeight: 1.2, letterSpacing: "-0.03em", margin: 0
              }}>
                Your work,<br />connected.
              </p>
            </div>

            {/* QR Code container (Enlarged) */}
            <div style={{
              display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1
            }}>
              <div style={{
                background: "#FFFFFF", padding: "8px", borderRadius: "12px",
                border: "1.5px solid var(--navy)", display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <img
                  src={qrImageUrl}
                  alt="POPOK Portfolio QR"
                  style={{ width: "95px", height: "95px", objectFit: "contain" }}
                />
              </div>
            </div>

            {/* Footer URL and Sharing Badge */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 1
            }}>
              <div>
                <span style={{ display: "block", fontSize: "0.45rem", color: "var(--navy)", opacity: 0.6, fontFamily: "monospace" }}>SCAN TO EXPLORE</span>
                <Link
                  href={detailHref}
                  onClick={handleLinkClick}
                  style={{ display: "block", fontSize: "0.75rem", fontWeight: 850, color: "var(--navy)", fontFamily: "monospace", textDecoration: "underline" }}
                >
                  {displayPath}
                </Link>
              </div>
              
              {/* Little visual graphic */}
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%", border: "1px solid var(--navy)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem"
              }}>
                📸
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Guide notice below card */}
      <div style={{
        marginTop: "16px",
        fontSize: "0.8rem",
        fontWeight: 700,
        color: "var(--ink-muted)",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        cursor: "pointer",
        transition: "opacity 0.2s"
      }} onClick={() => setFlipped(!flipped)}>
        <span>↻</span>
        <span>Tap to flip card</span>
      </div>

    </div>
  );
}
