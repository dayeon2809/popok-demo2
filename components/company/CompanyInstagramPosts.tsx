"use client";

import React from "react";
import type { InstagramStory } from "@/lib/instagram";

interface CompanyInstagramPostsProps {
  stories: InstagramStory[];
  brandAccent?: string;
}

function formatStoryDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// Shows @popok.official Instagram posts tagged with this company's
// dedicated tag (see lib/instagram.ts createCompanyInstagramTag), placed
// right below the upcoming-performances section. Always rendered — a
// permanent fixture of the page like CompanyUpcomingPerformances — with an
// empty state when no tagged posts exist yet, rather than being hidden.
export default function CompanyInstagramPosts({ stories = [], brandAccent = "#171411" }: CompanyInstagramPostsProps) {
  return (
    <section style={{ padding: "50px 0", borderBottom: "1px solid var(--border)" }}>
      <style jsx global>{`
        .ig-posts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }
        .ig-post-card {
          text-decoration: none;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
          background: #FFFFFF;
          transition: border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ig-post-card:hover {
          border-color: var(--navy);
          box-shadow: 0 12px 24px rgba(23, 20, 17, 0.06);
          transform: translateY(-4px);
        }
        @media (max-width: 768px) {
          .ig-posts-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px 10px !important;
          }
          .ig-post-info {
            padding: 10px !important;
          }
          .ig-post-title {
            font-size: 0.78rem !important;
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
        POPOK에서 만난 이야기
      </h3>

      {stories.length === 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "24px 4px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <span style={{ fontSize: "1.3rem", lineHeight: 1, opacity: 0.5 }} aria-hidden="true">
            📸
          </span>
          <div>
            <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink-muted)", margin: 0 }}>
              아직 POPOK 인스타그램에 소개된 소식이 없어요.
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--ink-faint)", margin: "4px 0 0 0" }}>
              새로운 이야기가 올라오면 이곳에서 가장 먼저 만나보실 수 있어요.
            </p>
          </div>
        </div>
      ) : (
      <div className="ig-posts-grid">
        {stories.map((story) => (
          <a
            key={story.id}
            href={story.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="ig-post-card"
          >
            <div style={{ width: "100%", aspectRatio: "1", overflow: "hidden", background: "#FAF8F5" }}>
              <img
                src={story.imageUrl}
                alt={story.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div className="ig-post-info" style={{ padding: "14px" }}>
              <span
                className="mono"
                style={{
                  fontSize: "0.58rem",
                  fontWeight: 800,
                  color: brandAccent,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                {story.category}
              </span>
              <h4
                className="ig-post-title"
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--navy)",
                  margin: "0 0 6px 0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  lineHeight: 1.4,
                }}
              >
                {story.title}
              </h4>
              <span style={{ fontSize: "0.7rem", color: "var(--ink-muted)" }}>
                {formatStoryDate(story.publishedAt)}
              </span>
            </div>
          </a>
        ))}
      </div>
      )}
    </section>
  );
}
