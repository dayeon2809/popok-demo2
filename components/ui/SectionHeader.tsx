import type { CSSProperties } from "react";

// Matches the section-header recipe already hand-rolled across every
// components/company/*.tsx section (CompanyUpcomingPerformances,
// CompanyPortfolio, CompanyArtists, CompanyHistory, ...) and the artist
// page's SECTION_LABEL_STYLE — extracted here so new sections (artist page
// redesign, homepage) reuse one definition instead of a 6th/7th copy-paste.
// Existing Company* components are left untouched (they already render this
// exact recipe; retrofitting them is out of scope for a visual task on a
// page that must not change).
const EYEBROW_STYLE: CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 800,
  color: "var(--navy)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  display: "block",
};

interface SectionHeaderProps {
  eyebrow: string;
  description?: string;
  meta?: string;
  style?: CSSProperties;
}

export default function SectionHeader({ eyebrow, description, meta, style }: SectionHeaderProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "28px", ...style }}>
      <div>
        <h3 className="mono" style={{ ...EYEBROW_STYLE, marginBottom: description ? "4px" : 0 }}>
          {eyebrow}
        </h3>
        {description && (
          <span style={{ fontSize: "0.8rem", color: "var(--ink-muted)", fontWeight: 500 }}>
            {description}
          </span>
        )}
      </div>
      {meta && (
        <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>
          {meta}
        </span>
      )}
    </div>
  );
}
