"use client";
// components/ArtistModal.tsx

import { useEffect, useState } from "react";
import type { ArtistWithWorks } from "@/types";
import { FIELD_LABELS, TYPE_LABELS } from "@/types";
import { LoadingSpinner, ErrorMessage } from "./ui/States";
import { useMobileBodyScrollLock } from "@/hooks/useMobileBodyScrollLock";

function colorFromName(name: string): string {
  const colors = ["#F5A623","#1E2D40","#4A8C6F","#9B59B6","#E06060","#2980B9","#F39C12","#16A085"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

interface ArtistModalProps {
  artist: ArtistWithWorks | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
}

export default function ArtistModal({ artist: a, loading, error, onClose }: ArtistModalProps) {
  const [toggledReviews, setToggledReviews] = useState<Record<string, boolean>>({});
  useMobileBodyScrollLock();

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        {/* 닫기 버튼은 항상 표시 */}
        <button
          onClick={onClose}
          aria-label="닫기"
          style={{
            position: "absolute", top: "14px", right: "14px", zIndex: 10,
            border: "none", background: "rgba(255,255,255,0.88)", color: "var(--navy)",
            width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer",
            fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "inherit", fontWeight: 700, backdropFilter: "blur(4px)",
          }}
        >
          ×
        </button>

        {loading && (
          <div style={{ padding: "60px 0" }}>
            <LoadingSpinner message="아티스트 정보를 불러오는 중..." />
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: "40px 20px" }}>
            <ErrorMessage message={error} />
          </div>
        )}

        {a && !loading && (
          <>
            {/* 사진 헤더 */}
            {(() => {
              const color = colorFromName(a.name);
              return (
                <div style={{
                  width: "100%", height: "200px", borderRadius: "22px 22px 0 0", overflow: "hidden",
                  background: (a.profileImage || a.photo_url)
                    ? `url(${a.profileImage || a.photo_url}) center/cover no-repeat`
                    : `linear-gradient(135deg, ${color}1A 0%, ${color}50 100%)`,
                  display: "flex", alignItems: "flex-end",
                  position: "relative",
                }}>
                  {!(a.profileImage || a.photo_url) && (
                    <span style={{
                      position: "absolute", top: "50%", left: "50%",
                      transform: "translate(-50%,-50%)",
                      fontSize: "5rem", fontWeight: 800, color, opacity: 0.25,
                    }}>{a.name.charAt(0)}</span>
                  )}
                  <div style={{ padding: "14px 20px", display: "flex", gap: "6px" }}>
                    <span className="tag">{a.field ? (FIELD_LABELS[a.field] ?? a.field) : ""}</span>
                    <span className="tag-navy">{a.type ? (TYPE_LABELS[a.type] ?? a.type) : ""}</span>
                  </div>
                </div>
              );
            })()}

            {/* 이름 + 링크 */}
            <div style={{ padding: "22px 28px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                <div>
                  <h2 style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                    {a.name}
                  </h2>
                  {a.name_en && (
                    <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }}>{a.name_en}</p>
                  )}
                </div>
                <span style={{
                  fontSize: "0.64rem", padding: "4px 10px", borderRadius: "20px",
                  fontWeight: 700, whiteSpace: "nowrap", marginTop: "4px",
                  background: (a.verified === true || a.verification_status === "verified") ? "#E0F0E8" : "#FEF3DC",
                  color: (a.verified === true || a.verification_status === "verified") ? "var(--verified)" : "var(--needs-review)",
                }}>
                  {(a.verified === true || a.verification_status === "verified") ? "✓ 검증됨" : "검토 필요"}
                </span>
              </div>

              {/* 단체/소속 */}
              {(a.company || a.organization_or_affiliation || a.festival_or_venue) && (
                <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", marginTop: "8px" }}>
                  📍 {a.company || a.organization_or_affiliation || a.festival_or_venue}
                  {a.year ? ` · ${a.year}` : ""}
                </p>
              )}

              {/* 링크 버튼 */}
              {(a.website || a.website_url || a.instagram || a.instagram_url || a.video_url) && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }}>
                  {(a.website || a.website_url) && (
                    <a href={a.website || a.website_url!} target="_blank" rel="noopener noreferrer" style={linkBtnStyle("navy")}>
                      🌐 웹사이트
                    </a>
                  )}
                  {(a.instagram || a.instagram_url) && (
                    <a href={a.instagram || a.instagram_url!} target="_blank" rel="noopener noreferrer" style={linkBtnStyle("accent")}>
                      📷 Instagram
                    </a>
                  )}
                  {a.video_url && (
                    <a href={a.video_url} target="_blank" rel="noopener noreferrer" style={linkBtnStyle("outline")}>
                      ▶ 영상
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* 본문 */}
            <div style={{ padding: "0 28px 32px" }}>
              <Divider />

              {/* 소개 */}
              {(a.bio || a.bio_short) && (
                <div style={{ marginBottom: "20px" }}>
                  <SectionLabel>소개</SectionLabel>
                  <p style={{ fontSize: "0.9rem", color: "var(--ink)", lineHeight: 1.75 }}>{a.bio || a.bio_short}</p>
                </div>
              )}

              {/* 작품 목록 */}
              {a.works && a.works.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <SectionLabel>작품 목록 ({a.works.length})</SectionLabel>
                  {a.works.map((w, i) => {
                    const title = typeof w === "string" ? w : (w as any).title || "";
                    const year = typeof w === "string" ? null : (w as any).year;
                    const venue = typeof w === "string" ? "" : (w as any).venue || (w as any).festival || "";
                    const sourceUrl = typeof w === "string" ? "" : (w as any).source_url || "";
                    
                    return (
                      <div key={i} style={{
                        padding: "10px 0", borderBottom: "1px solid var(--border)",
                        display: "flex", gap: "14px", alignItems: "flex-start",
                      }}>
                        <span style={{ fontSize: "0.7rem", color: "var(--ink-faint)", fontWeight: 600, minWidth: "36px", paddingTop: "2px" }}>
                          {year ?? i + 1}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--navy)" }}>〈{title}〉</span>
                            {venue && (
                              <span style={{ marginLeft: "8px", fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                                {venue}
                              </span>
                            )}
                          </div>
                          
                          {/* 관련 리뷰 보기 Toggle Button & List */}
                          {(() => {
                            const workReviews = a.reviews ? a.reviews.filter(r => r.workTitle === title) : [];
                            if (workReviews.length === 0) return null;
                            const isExpanded = !!toggledReviews[title];
                            return (
                              <div style={{ marginTop: "4px" }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setToggledReviews(prev => ({ ...prev, [title]: !prev[title] }));
                                  }}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--accent-dark)",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    padding: 0,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "2px",
                                  }}
                                >
                                  관련 리뷰 보기 {isExpanded ? "▲" : "▼"}
                                </button>
                                {isExpanded && (
                                  <ul style={{
                                    listStyle: "none",
                                    padding: "6px 10px",
                                    margin: "4px 0 0",
                                    background: "var(--accent-light)",
                                    borderRadius: "6px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "3px",
                                    border: "1px solid var(--accent)",
                                  }}>
                                    {workReviews.map((rev, revIdx) => (
                                      <li key={revIdx} style={{ fontSize: "0.78rem", display: "flex", alignItems: "center" }}>
                                        <span style={{ marginRight: "4px", color: "var(--accent-dark)" }}>•</span>
                                        <a
                                          href={rev.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            color: "var(--ink)",
                                            textDecoration: "underline",
                                            fontWeight: 500,
                                          }}
                                        >
                                          {rev.source}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        {sourceUrl && (
                          <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: "0.68rem", color: "var(--accent-dark)", textDecoration: "none", fontWeight: 700 }}>
                            출처↗
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 🤖 AI Summary */}
              <div style={{ marginBottom: "20px", background: "var(--accent-light)", padding: "16px", borderRadius: "12px", border: "1.5px solid var(--accent)" }}>
                <SectionLabel style={{ color: "var(--accent-dark)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                  🤖 AI Summary
                </SectionLabel>
                {a.aiSummary ? (
                  <div>
                    <p style={{ fontSize: "0.85rem", color: "var(--ink)", lineHeight: 1.6, marginBottom: "8px", whiteSpace: "pre-line" }}>
                      {a.aiSummary}
                    </p>
                    <p style={{ fontSize: "0.68rem", color: "var(--ink-faint)", fontWeight: 500, borderTop: "1px solid var(--border)", paddingTop: "6px", marginTop: "6px" }}>
                      * 이 요약은 대표작 소개와 공개된 자료를 바탕으로 생성된 AI 요약입니다.
                    </p>
                  </div>
                ) : (
                  <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>아직 AI Summary가 준비되지 않았습니다.</p>
                )}
              </div>

              {/* 인터뷰 및 기타 기사 */}
              <div style={{ marginBottom: "20px" }}>
                <SectionLabel>인터뷰 및 기타 기사</SectionLabel>
                {(() => {
                  const generalReviews = a.reviews ? a.reviews.filter(r => r.workTitle === "GENERAL") : [];
                  if (generalReviews.length > 0) {
                    return (
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "5px" }}>
                        {generalReviews.map((rev, revIdx) => (
                          <li key={revIdx} style={{ fontSize: "0.82rem", display: "flex", alignItems: "center" }}>
                            <span style={{ marginRight: "5px", color: "var(--accent-dark)" }}>•</span>
                            <a
                              href={rev.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "var(--ink)",
                                textDecoration: "underline",
                                fontWeight: 600,
                              }}
                            >
                              {rev.source}
                            </a>
                          </li>
                        ))}
                      </ul>
                    );
                  } else {
                    return (
                      <p style={{ fontSize: "0.8rem", color: "var(--ink-faint)" }}>등록된 리뷰가 없습니다.</p>
                    );
                  }
                })()}
              </div>

              {/* 태그 */}
              {a.tags && a.tags.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <SectionLabel>태그</SectionLabel>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {a.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>
              )}

              {/* 출처 */}
              {a.source_file && (
                <div style={{ paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "0.64rem", color: "var(--ink-faint)", fontWeight: 500 }}>
                    source: {a.source_file}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── 내부 스타일 유틸 ──
function Divider() {
  return <div style={{ height: "1.5px", background: "var(--border)", margin: "18px 0" }} />;
}
function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{
      fontSize: "0.67rem", fontWeight: 700, color: "var(--ink-muted)",
      letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px",
      ...style,
    }}>{children}</p>
  );
}
function linkBtnStyle(variant: "navy" | "accent" | "outline"): React.CSSProperties {
  const base: React.CSSProperties = {
    textDecoration: "none", padding: "8px 16px", borderRadius: "8px",
    fontSize: "0.8rem", fontWeight: 700, display: "inline-block",
  };
  if (variant === "navy")    return { ...base, background: "var(--navy)",   color: "#fff" };
  if (variant === "accent")  return { ...base, background: "var(--accent)", color: "var(--navy)" };
  return { ...base, border: "1.5px solid var(--border)", color: "var(--ink)" };
}
