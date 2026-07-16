"use client";

import React from "react";
import Link from "next/link";
import type { Company } from "@/types";

interface CompanyArtistsProps {
  company: Company;
  artists: any[];
}

export default function CompanyArtists({ company, artists = [] }: CompanyArtistsProps) {
  const brandAccent = company.brand_color || "#171411";

  return (
    <section
      style={{
        padding: "60px 0",
        borderBottom: "1.5px solid var(--border)",
      }}
    >
      <style jsx global>{`
        .artists-grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }
        .artist-profile-card {
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid var(--border);
          backgroundColor: #FFFFFF;
          box-shadow: 0 4px 12px rgba(23, 20, 17, 0.01);
          transition: border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .artist-profile-card:hover {
          border-color: var(--navy);
          box-shadow: 0 8px 20px rgba(23, 20, 17, 0.04);
          transform: translateY(-2px);
        }
        @media (max-width: 768px) {
          .artists-grid-container {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .artist-profile-card {
            padding: 10px 8px !important;
            gap: 8px !important;
            border-radius: 8px !important;
          }
          .artist-name {
            font-size: 0.82rem !important;
          }
          .artist-role {
            font-size: 0.68rem !important;
          }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "28px" }}>
        <h3
          className="mono"
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            color: "var(--navy)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Affiliated Artists
        </h3>
        <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>
          {artists.length} CREATIVES
        </span>
      </div>

      {artists.length === 0 ? (
        <div
          style={{
            padding: "40px 24px",
            textAlign: "center",
            border: "1px dashed var(--border)",
            borderRadius: "14px",
            color: "var(--ink-muted)",
            fontSize: "0.85rem",
          }}
        >
          소속된 예술가 정보가 등록되어 있지 않습니다.
        </div>
      ) : (
        <div className="artists-grid-container">
          {artists.map((artist, idx) => {
            const avatarUrl =
              artist.profile_image_url ||
              `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(artist.name)}`;

            const profileHref = `/artists/${encodeURIComponent(artist.slug || artist.id)}`;

            return (
              <Link
                key={artist.id || idx}
                href={profileHref}
                className="artist-profile-card"
              >
                <img
                  src={avatarUrl}
                  alt={artist.name}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    backgroundColor: "#FAF8F5",
                    border: "1px solid var(--border-light)",
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <h4
                    className="artist-name"
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      color: "var(--navy)",
                      margin: "0 0 2px 0",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      letterSpacing: "-0.01em"
                    }}
                  >
                    {artist.name}
                  </h4>
                  <span
                    className="artist-role"
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--ink-muted)",
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {artist.role || "CREATIVE"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
