"use client";

import type { Artist } from "@/types";
import { FIELD_LABELS, TYPE_LABELS } from "@/types";

function colorFromName(name: string): string {
  const colors = ["#F5A623","#1E2D40","#4A8C6F","#9B59B6","#E06060","#2980B9","#F39C12","#16A085"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

interface ArtistCardProps {
  artist: Artist;
  onClick?: () => void;   // 모달용 (recordId 전달은 부모가 처리)
  variant?: "grid" | "list";
}

export default function ArtistCard({ artist: a, onClick }: ArtistCardProps) {
  const color   = colorFromName(a.name);
  const initial = a.name.charAt(0);

  return (
    <div
      className="card"
      onClick={onClick}
      style={{ cursor: "pointer", display: "flex", flexDirection: "column", width: "100%" }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {/* 이미지 / 플레이스홀더 */}
      <div style={{
        width: "100%", aspectRatio: "4/3", overflow: "hidden",
        background: (a.profileImage || a.photo_url)
          ? `url(${a.profileImage || a.photo_url}) center/cover no-repeat`
          : `linear-gradient(135deg, ${color}1A 0%, ${color}40 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        {!(a.profileImage || a.photo_url) && (
          <span style={{ fontSize: "3rem", fontWeight: 800, color, opacity: 0.45 }}>{initial}</span>
        )}
        <div style={{ position: "absolute", top: "10px", right: "10px" }}>
          <span className="tag" style={{ fontSize: "0.62rem" }}>
            {a.field ? (FIELD_LABELS[a.field] ?? a.field) : ""}
          </span>
        </div>
      </div>

      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: "5px", flexGrow: 1 }}>
        <span style={{ fontSize: "0.63rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {a.type ? (TYPE_LABELS[a.type] ?? a.type) : ""}
        </span>
        <h3 style={{ fontSize: "0.98rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
          {a.name}
        </h3>
        {a.name_en && (
          <p style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>{a.name_en}</p>
        )}
        {(a.works && a.works.length > 0) ? (
          <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", marginTop: "3px" }}>
            〈{a.works[0]}〉{a.works.length > 1 && ` 외 ${a.works.length - 1}건`}
          </p>
        ) : a.representative_work ? (
          <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", marginTop: "3px" }}>
            〈{a.representative_work}〉
          </p>
        ) : null}
        <div style={{ display: "flex", gap: "4px", marginTop: "auto", paddingTop: "10px", flexWrap: "wrap" }}>
          {(a.instagram || a.instagram_url) && <span className="tag-navy">IG</span>}
          {(a.website || a.website_url)   && <span className="tag-navy">Web</span>}
          {(a.verified === true || a.verification_status === "verified") && (
            <span style={{ fontSize: "0.6rem", padding: "2px 7px", borderRadius: "20px", background: "#E0F0E8", color: "var(--verified)", fontWeight: 700 }}>✓</span>
          )}
        </div>
      </div>
    </div>
  );
}
