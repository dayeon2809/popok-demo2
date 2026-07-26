"use client";

interface IndexWork {
  id: string;
  title: string;
  year: string;
  role: string;
  description: string;
  image: string;
  externalLink?: string;
}

interface ArtistWorkIndexProps {
  works: IndexWork[];
  onSelectWork: (workId: string) => void;
}

// Full work list, separate from ArtistWorkGallery above it (feature/home-feed-v2):
// the gallery is for browsing/looking, this is for scanning — a compact
// thumbnail + text row per work rather than repeating the same big-image
// cards. Reuses exactly the same `works` data (id/title/year/role/description/
// image) the page already computes; no new fields.
export default function ArtistWorkIndex({ works, onSelectWork }: ArtistWorkIndexProps) {
  if (works.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {works.map((work, idx) => (
        <button
          key={work.id}
          type="button"
          onClick={() => onSelectWork(work.id)}
          style={{
            display: "grid", gridTemplateColumns: "72px 1fr auto", gap: "16px", alignItems: "center",
            width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer",
            padding: "16px 0", borderTop: idx > 0 ? "1px solid var(--border-light)" : "none",
          }}
        >
          <div style={{ width: "72px", height: "72px", borderRadius: "6px", overflow: "hidden", background: "#FAF8F5", border: "1px solid var(--border)", flexShrink: 0 }}>
            {work.image && !work.image.includes("cake-placeholder") && (
              <img src={work.image} alt={work.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-faint)", fontWeight: 700, marginBottom: "2px" }}>
              {[work.year, work.role].filter(Boolean).join(" · ")}
            </div>
            <h4 style={{
              fontSize: "0.98rem", fontWeight: 800, color: "var(--navy)", margin: 0, letterSpacing: "-0.01em",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {work.title}
            </h4>
            {work.description && (
              <p style={{
                fontSize: "0.8rem", color: "var(--ink-muted)", margin: "4px 0 0", lineHeight: 1.5,
                display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {work.description}
              </p>
            )}
          </div>
          <span className="mono" style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--ink-faint)", flexShrink: 0 }}>→</span>
        </button>
      ))}
    </div>
  );
}
