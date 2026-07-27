"use client";

import type { ReactNode } from "react";

interface ArtistMinimalHeaderProps {
  name: string;
  nameEn?: string | null;
  verified?: boolean;
  roleLine: string; // e.g. "안무가 · 현대무용 · 서울"
  currentActivityLine?: string | null;
  profileImage?: string | null;
  /** Share/연결하기 buttons, rendered on the right (desktop) — see app/artists/[id]/page.tsx */
  actions?: ReactNode;
  contactCandidates?: Array<{ label: string; href: string; channel: string }>;
  onContactClick?: (channel: string) => void;
}

// V2 public artist page — a deliberately small header (feature/home-feed-v2):
// name/role/one activity line + Share/Connect, no big profile card and no
// long bio up top. The work itself (ArtistVisualHero + ArtistWorkGallery,
// rendered right below this) is meant to be what a visitor sees first, not
// the artist's own description of themselves.
export default function ArtistMinimalHeader({
  name,
  nameEn,
  verified,
  roleLine,
  currentActivityLine,
  profileImage,
  actions,
  contactCandidates,
  onContactClick,
}: ArtistMinimalHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", paddingBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        {profileImage && (
          <img
            src={profileImage}
            alt={name}
            style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }}
          />
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--navy)", margin: 0, letterSpacing: "-0.02em" }}>{name}</h1>
            {nameEn && <span className="mono" style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>{nameEn}</span>}
            {verified && (
              <span style={{ fontSize: "0.58rem", fontWeight: 800, color: "var(--navy)", background: "var(--accent)", padding: "2px 7px", borderRadius: "8px" }}>
                POPOK VERIFIED
              </span>
            )}
          </div>
          {roleLine && (
            <span className="mono" style={{ fontSize: "0.72rem", color: "var(--accent-dark)", fontWeight: 800, letterSpacing: "0.03em", display: "block", marginTop: "2px" }}>
              {roleLine}
            </span>
          )}
          {currentActivityLine && (
            <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", margin: "4px 0 0", maxWidth: "440px" }}>{currentActivityLine}</p>
          )}

          {contactCandidates && contactCandidates.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginTop: "8px" }}>
              {contactCandidates.map((c, idx) => (
                <a
                  key={idx}
                  href={c.href}
                  target={c.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  onClick={() => onContactClick?.(c.channel)}
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 750,
                    color: "var(--navy)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = "underline";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = "none";
                  }}
                >
                  {c.label} ↗
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {actions && (
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
