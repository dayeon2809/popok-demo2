"use client";

import Link from "next/link";
import type { Artist } from "@/types";
import PopokCard from "@/components/PopokCard";
import { analytics } from "@/lib/analytics";

const BEFORE_ITEMS = ["공연 경력", "교육", "수상", "작품 이미지"];

interface ResultComparisonSectionProps {
  ctaHref: string;
  isLoggedIn: boolean;
  /** A real published artist to show in the "after" preview — falls back to a static mockup if none exists. */
  previewArtist: Artist | null;
}

// "이력서 하나가 이렇게 바뀝니다" — the right side renders the actual PopokCard
// component (same one every real artist page uses), not a fake screenshot or
// browser-chrome mockup, so it's a truthful preview of the real product.
export default function ResultComparisonSection({ ctaHref, isLoggedIn, previewArtist }: ResultComparisonSectionProps) {
  const displaySlug = previewArtist?.slug || previewArtist?.id || "your-name";

  return (
    <section className="home-section result-comparison-section" style={{
      maxWidth: "1120px",
      margin: "0 auto",
      padding: "64px 24px",
      borderTop: "1px solid var(--border)",
    }}>
      <h2 className="display" style={{
        fontSize: "clamp(1.6rem, 3.6vw, 2.3rem)",
        color: "var(--navy)",
        fontWeight: 950,
        letterSpacing: "-0.03em",
        margin: "0 0 36px",
        textAlign: "center",
      }}>
        이력서 하나가 이렇게 바뀝니다
      </h2>

      <div className="responsive-stack-320 comparison-grid" style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        alignItems: "stretch",
      }}>
        {/* Before: scattered PDF resume / activity info */}
        <div style={{
          background: "#FFFFFF",
          border: "1.5px solid var(--border)",
          borderRadius: "18px",
          padding: "28px 26px",
          display: "flex",
          flexDirection: "column",
        }}>
          <span className="mono" style={{ display: "block", marginBottom: "6px", color: "var(--ink-muted)", fontWeight: 700, fontSize: "0.72rem" }}>
            BEFORE
          </span>
          <p style={{ fontSize: "0.9rem", color: "var(--navy)", fontWeight: 700, margin: "0 0 18px" }}>
            기존 PDF 이력서 또는 흩어진 활동 정보
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {BEFORE_ITEMS.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--border-dark)", flexShrink: 0 }} />
                <span style={{ fontSize: "0.88rem", color: "var(--ink-muted)", fontWeight: 600 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* After: the real POPOK artist page preview (actual PopokCard component) */}
        <div style={{
          background: "var(--navy)",
          border: "1.5px solid var(--navy)",
          borderRadius: "18px",
          padding: "28px 26px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <span className="mono" style={{ display: "block", marginBottom: "6px", color: "rgba(255,255,255,0.55)", fontWeight: 700, fontSize: "0.72rem", alignSelf: "flex-start" }}>
            WITH POPOK
          </span>
          <p style={{ fontSize: "0.9rem", color: "#FFFFFF", fontWeight: 700, margin: "0 0 18px", alignSelf: "flex-start" }}>
            완성된 POPOK 아티스트 페이지
          </p>

          <div className="comparison-card-scale" style={{ width: "min(230px, 100%)" }}>
            <PopokCard
              name={previewArtist?.name || "아티스트 이름"}
              nameEn={previewArtist?.name_en || undefined}
              genre={previewArtist?.genre || "CREATIVE"}
              instagram={previewArtist?.instagram || null}
              id={previewArtist?.id || "preview"}
              slug={previewArtist?.slug || previewArtist?.id}
              profileImage={previewArtist?.profileImage || previewArtist?.profile_image_url || undefined}
            />
          </div>

          <div style={{ marginTop: "18px", width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                width: "18px", height: "18px", borderRadius: "50%", background: "var(--accent)", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 900, color: "var(--navy)",
              }}>
                ✓
              </span>
              <span className="mono" style={{ fontSize: "0.78rem", color: "#FFFFFF", fontWeight: 700 }}>
                popok.kr/{displaySlug}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                width: "18px", height: "18px", borderRadius: "50%", background: "var(--accent)", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 900, color: "var(--navy)",
              }}>
                ✓
              </span>
              <span style={{ fontSize: "0.85rem", color: "#FFFFFF", fontWeight: 700 }}>
                공유 가능한 작품과 이력
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "36px" }}>
        <Link
          href={ctaHref}
          onClick={() => analytics.homeCreatePopokClicked("result_comparison", isLoggedIn)}
          className="btn-lime"
          style={{
            textDecoration: "none",
            padding: "15px 32px",
            borderRadius: "999px",
            fontSize: "0.9rem",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          내 이력서로 만들어보기 <span style={{ fontSize: "1.05rem" }}>→</span>
        </Link>
      </div>
    </section>
  );
}
