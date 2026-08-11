"use client";

import type { Artist } from "@/types";

interface ArtistCompactCardProps {
  artist: Artist;
  /** Optional — omit to hide the Share button entirely. */
  onShare?: () => void;
}

// Compact stand-in for the full PopokCard flip-card, used where the artist
// page's image feed is the visual focus and the identity card should read
// as secondary support rather than the page's centerpiece (V2 prototype,
// feature/home-feed-v2 — see section 10 of the brief). The full PopokCard
// (with QR/flip) is untouched further down the page in "Digital Card &
// Share" — this only reuses fields the page already has, no new data.
export default function ArtistCompactCard({ artist, onShare }: ArtistCompactCardProps) {
  const profileImage = artist.profile_image_url || artist.profileImage || undefined;
  const subline = [artist.genre || artist.field, artist.city_or_region].filter(Boolean).join(" · ");
  const companyName = artist.connectedCompany?.company.name || artist.company;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 14px",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        background: "#FAF9F5",
        maxWidth: "320px",
        width: "100%",
      }}
    >
      <div style={{
        width: "48px", height: "48px", borderRadius: "10px", overflow: "hidden",
        flexShrink: 0, background: "#EAE6DD", border: "1px solid var(--border)",
      }}>
        {profileImage && (
          <img src={profileImage} alt={artist.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{
            fontSize: "0.88rem", fontWeight: 850, color: "var(--navy)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {artist.name}
          </span>
          {artist.verified && (
            <span style={{
              fontSize: "0.52rem", fontWeight: 800, color: "var(--navy)", background: "var(--accent)",
              padding: "1px 5px", borderRadius: "6px", flexShrink: 0,
            }}>
              ✓
            </span>
          )}
        </div>
        <p style={{
          fontSize: "0.7rem", color: "var(--ink-muted)", margin: "2px 0 0",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {[subline, companyName].filter(Boolean).join(" · ") || "POPOK 아티스트"}
        </p>
      </div>

      {onShare && (
        <button
          type="button"
          onClick={onShare}
          aria-label="포트폴리오 링크 공유"
          style={{
            flexShrink: 0, width: "32px", height: "32px", borderRadius: "50%",
            border: "1px solid var(--border-dark)", background: "#FFFFFF",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: "0.85rem", color: "var(--navy)",
          }}
        >
          ↗
        </button>
      )}
    </div>
  );
}
