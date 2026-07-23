"use client";

import React from "react";
import Link from "next/link";
import type { Artist } from "@/types";

interface RelatedArtistsProps {
  artists: Artist[];
}

// Mirrors components/company/RelatedCompanies.tsx's card recipe exactly (same
// grid, radius, hover, thumb/info layout) so the artist and company pages'
// "explore more" sections read as the same design system. Renders nothing
// when empty — unlike RelatedCompanies, there's no mock fallback list here.
export default function RelatedArtists({ artists = [] }: RelatedArtistsProps) {
  if (artists.length === 0) return null;

  return (
    <section style={{ padding: "50px 0 0 0" }}>
      <style jsx global>{`
        .related-artists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .related-artist-card {
          text-decoration: none;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
          background: #FFFFFF;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .related-artist-card:hover {
          border-color: var(--navy);
          box-shadow: 0 12px 24px rgba(23, 20, 17, 0.06);
          transform: translateY(-4px);
        }
        @media (max-width: 768px) {
          .related-artists-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px 10px !important;
          }
          .related-artist-thumb {
            aspect-ratio: 2.1 !important;
          }
          .related-artist-info {
            padding: 12px 10px !important;
          }
          .related-artist-title {
            font-size: 0.85rem !important;
          }
          .related-artist-desc {
            font-size: 0.68rem !important;
            line-height: 1.4 !important;
          }
        }
      `}</style>

      <h3
        className="mono"
        style={{
          fontSize: "0.72rem",
          fontWeight: 800,
          color: "var(--navy)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "28px",
        }}
      >
        더 탐색할 예술가들
      </h3>

      <div className="related-artists-grid">
        {artists.map((artist) => {
          const href = `/artists/${encodeURIComponent(artist.slug || artist.id)}`;
          const image = artist.profileImage || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(artist.name)}`;

          return (
            <Link key={artist.recordId || artist.id} href={href} className="related-artist-card">
              <div className="related-artist-thumb" style={{ width: "100%", aspectRatio: "1.7", overflow: "hidden", background: "#FAF9F5" }}>
                <img src={image} alt={artist.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>

              <div className="related-artist-info" style={{ padding: "20px", height: "150px" }}>
                <span
                  className="mono"
                  style={{
                    fontSize: "0.58rem", fontWeight: 800, color: "var(--accent-dark)",
                    letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: "4px",
                  }}
                >
                  {artist.genre || artist.role || "ARTIST"}
                </span>

                <h4
                  className="related-artist-title"
                  style={{
                    fontSize: "0.95rem", fontWeight: 800, color: "var(--navy)", margin: "0 0 6px 0",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em",
                  }}
                >
                  {artist.name}
                </h4>

                <p
                  className="related-artist-desc"
                  style={{
                    fontSize: "0.8rem", color: "var(--ink-muted)", lineHeight: 1.45, margin: 0,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}
                >
                  {artist.bio_short || "POPOK 등록 아티스트 포트폴리오"}
                </p>

                <span style={{
                  display: "inline-block", fontSize: "0.72rem", fontWeight: 800, color: "var(--navy)",
                  marginTop: "12px", borderBottom: "1.5px solid var(--accent)", paddingBottom: "1px",
                }}>
                  Explore Profile →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
