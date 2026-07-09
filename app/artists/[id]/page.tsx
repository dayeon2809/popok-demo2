"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ArtistWithWorks, ArtistComment, UserProfile } from "@/types";
import { FIELD_LABELS, TYPE_LABELS } from "@/types";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";
import { 
  getLoggedInUser,
  getArtistComments,
  addArtistComment,
  deleteArtistComment,
  toggleLikeArtistComment,
  toggleSaveArtist,
  isArtistSaved
} from "@/lib/supabase";

function colorFromName(name: string): string {
  const colors = ["#F5A623","#1E2D40","#4A8C6F","#9B59B6","#E06060","#2980B9","#F39C12","#16A085"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

export default function ArtistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId]           = useState("");
  const [artist, setArtist]   = useState<ArtistWithWorks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [toggledReviews, setToggledReviews] = useState<Record<string, boolean>>({});

  // Authenticated User & Community states
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState<ArtistComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [selectedWork, setSelectedWork] = useState<any | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${artist?.name} - Piece of Cake`,
        text: artist?.bio_short || artist?.bio || "Piece of Cake에서 아티스트 포트폴리오를 확인해보세요.",
        url: window.location.href,
      }).catch((err) => {
        console.log("Error sharing:", err);
      });
    } else {
      setShowShareModal(true);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const parseVideoUrl = (url: string) => {
    if (!url) return { type: "link", originalUrl: "" };
    const trimmed = url.trim();
    try {
      const u = new URL(trimmed);
      
      // YouTube support (watch, youtu.be, embed, shorts)
      if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
        let id = "";
        if (u.hostname.includes("youtu.be")) {
          id = u.pathname.substring(1).split("?")[0];
        } else if (u.pathname.includes("/shorts/")) {
          id = u.pathname.split("/shorts/")[1].split("?")[0];
        } else if (u.pathname.includes("/embed/")) {
          id = u.pathname.split("/embed/")[1].split("?")[0];
        } else {
          id = u.searchParams.get("v") || "";
        }
        
        if (id) {
          return {
            type: "youtube",
            embedUrl: `https://www.youtube.com/embed/${id}`,
            originalUrl: trimmed,
          };
        }
      }
      
      // Vimeo support (vimeo.com, player.vimeo.com)
      if (u.hostname.includes("vimeo.com")) {
        let id = "";
        if (u.pathname.includes("/video/")) {
          id = u.pathname.split("/video/")[1].split("?")[0];
        } else {
          id = u.pathname.substring(1).split("?")[0];
        }
        
        if (id && /^\d+$/.test(id)) {
          return {
            type: "vimeo",
            embedUrl: `https://player.vimeo.com/video/${id}`,
            originalUrl: trimmed,
          };
        }
      }
    } catch (e) {
      // ignore
    }
    return {
      type: "link",
      originalUrl: trimmed,
    };
  };

  useEffect(() => { params.then(({ id: pid }) => setId(decodeURIComponent(pid))); }, [params]);

  // Load artist data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/artists/${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then(({ data, error: err, detail }) => {
        if (err) {
          setError(`${err}${detail ? ` (${detail})` : ""}`);
        } else {
          setArtist(data);
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(`네트워크 오류: ${String(e)}`);
        setLoading(false);
      });
  }, [id]);

  // Load community data
  const loadCommunityData = useCallback(() => {
    if (!id) return;
    const user = getLoggedInUser();
    setCurrentUser(user);
    
    // Save state
    setIsSaved(isArtistSaved(id));

    // Comments list
    setComments(getArtistComments(id));
  }, [id]);

  useEffect(() => {
    loadCommunityData();

    // Listen to login/logout changes in GNB
    const handleAuthChange = () => {
      loadCommunityData();
    };
    window.addEventListener("poc-auth-change", handleAuthChange);
    return () => window.removeEventListener("poc-auth-change", handleAuthChange);
  }, [loadCommunityData]);

  // Community Interactivities
  const triggerLoginRedirect = () => {
    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  };

  const handleSave = () => {
    if (!currentUser) {
      triggerLoginRedirect();
      return;
    }
    const saved = toggleSaveArtist(id);
    setIsSaved(saved);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      triggerLoginRedirect();
      return;
    }
    if (!newCommentText.trim()) return;

    addArtistComment(id, newCommentText);
    setNewCommentText("");
    setComments(getArtistComments(id));
  };

  const handleCommentDelete = (commentId: string) => {
    if (!currentUser) return;
    if (confirm("댓글을 삭제하시겠습니까?")) {
      deleteArtistComment(commentId);
      setComments(getArtistComments(id));
    }
  };

  const handleCommentLike = (commentId: string) => {
    if (!currentUser) {
      triggerLoginRedirect();
      return;
    }
    toggleLikeArtistComment(commentId);
    setComments(getArtistComments(id));
  };

  if (loading) return (
    <div style={{ maxWidth: "800px", margin: "80px auto" }}>
      <LoadingSpinner message="아티스트 정보를 불러오는 중..." />
    </div>
  );

  if (error || !artist) return (
    <div style={{ maxWidth: "800px", margin: "80px auto" }}>
      <ErrorMessage message={error ?? "아티스트를 찾을 수 없습니다."} />
    </div>
  );

  const color = colorFromName(artist.name);

  const parseWorksIntoTitles = (w: string): string[] => {
    const bracketMatches = Array.from(w.matchAll(/<([^>]+)>/g)).map(m => m[1].trim());
    if (bracketMatches.length > 0) {
      return bracketMatches;
    }
    return w.split(/[,\n]/).map(item => item.trim()).filter(Boolean);
  };

  // Generate list of works to display as cards
  const displayWorks = (() => {
    const rawWorks: any[] = [];

    if (artist.portfolio_works && artist.portfolio_works.length > 0) {
      artist.portfolio_works.forEach((w) => {
        const titles = parseWorksIntoTitles(w.title);
        if (titles.length > 1) {
          titles.forEach((t) => {
            rawWorks.push({
              title: t,
              year: w.year || "",
              role: w.role || "",
              description: w.description || "",
              image_url: w.image_url || "",
              video_url: w.video_url || ""
            });
          });
        } else {
          rawWorks.push(w);
        }
      });
      return rawWorks;
    }

    if (artist.works && artist.works.length > 0) {
      artist.works.forEach((w) => {
        const titleStr = typeof w === "string" ? w : (w as any).title || "";
        const role = typeof w === "string" ? "" : (w as any).role || "";
        const description = typeof w === "string" ? "" : (w as any).description || "";
        const video_url = typeof w === "string" ? "" : (w as any).video_url || "";
        const img_url = typeof w === "string" ? "" : (w as any).image_url || "";

        const titles = parseWorksIntoTitles(titleStr);
        titles.forEach((title) => {
          let cleanTitle = title.trim();
          let year = typeof w === "string" ? "" : String((w as any).year || "");

          if (typeof w === "string") {
            const yearMatch = cleanTitle.match(/\((\d{4})\)/);
            if (yearMatch) {
              year = yearMatch[1];
              cleanTitle = cleanTitle.replace(/\((\d{4})\)/, "").trim();
            } else if (cleanTitle.includes("(연도미상)")) {
              cleanTitle = cleanTitle.replace("(연도미상)", "").trim();
            }
          }

          rawWorks.push({
            title: cleanTitle,
            year: year,
            role: role,
            description: description,
            image_url: img_url,
            video_url: video_url
          });
        });
      });
      return rawWorks;
    }
    return [];
  })();

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 32px 80px" }}>
      <Link href="/artists" style={{
        textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px",
        color: "var(--ink-muted)", fontSize: "0.82rem", fontWeight: 600, marginBottom: "32px",
      }}>← Artist DB</Link>

      {/* 사진 헤더 */}
      <div style={{
        width: "100%", height: "280px", borderRadius: "18px", overflow: "hidden",
        background: (artist.profileImage || artist.photo_url)
          ? `url(${artist.profileImage || artist.photo_url}) center/cover no-repeat`
          : `linear-gradient(135deg, ${color}18 0%, ${color}45 100%)`,
        display: "flex", alignItems: "flex-end",
        position: "relative", marginBottom: "32px",
      }}>
        {!(artist.profileImage || artist.photo_url) && (
          <span style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            fontSize: "6rem", fontWeight: 800, color, opacity: 0.2,
          }}>{artist.name.charAt(0)}</span>
        )}
        <div style={{ padding: "20px 24px", display: "flex", gap: "8px" }}>
          <span className="tag">{artist.field ? (FIELD_LABELS[artist.field] ?? artist.field) : ""}</span>
          <span className="tag-navy">{artist.type ? (TYPE_LABELS[artist.type] ?? artist.type) : ""}</span>
        </div>
      </div>

      {/* 이름 + 상태 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h1 className="display" style={{ fontSize: "clamp(1.8rem,5vw,3rem)", color: "var(--navy)" }}>
              {artist.name}
            </h1>
            
            {/* Save Button */}
            <button
              onClick={handleSave}
              style={{
                background: isSaved ? "var(--accent-light)" : "transparent",
                color: isSaved ? "var(--accent-dark)" : "var(--ink-muted)",
                border: "1.5px solid",
                borderColor: isSaved ? "var(--accent)" : "var(--border-dark)",
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: "0.74rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontFamily: "inherit",
                transition: "all 0.15s",
                marginTop: "4px"
              }}
            >
              <span>{isSaved ? "♥ 저장됨" : "♡ 저장"}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              style={{
                background: "transparent",
                color: "var(--ink-muted)",
                border: "1.5px solid var(--border-dark)",
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: "0.74rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontFamily: "inherit",
                transition: "all 0.15s",
                marginTop: "4px",
                marginLeft: "8px"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "var(--navy)";
                e.currentTarget.style.color = "var(--navy)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "var(--border-dark)";
                e.currentTarget.style.color = "var(--ink-muted)";
              }}
            >
              <span>공유</span>
            </button>
          </div>
          
          {artist.name_en && <p style={{ fontSize: "0.95rem", color: "var(--ink-muted)", marginTop: "4px" }}>{artist.name_en}</p>}
          {(artist.company || artist.organization_or_affiliation || artist.festival_or_venue) && (
            <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", marginTop: "8px" }}>
              📍 {artist.company || artist.organization_or_affiliation || artist.festival_or_venue}
              {artist.year ? ` · ${artist.year}` : ""}
            </p>
          )}
        </div>
        <span style={{
          fontSize: "0.68rem", padding: "5px 12px", borderRadius: "20px",
          fontWeight: 700, whiteSpace: "nowrap", marginTop: "6px",
          background: (artist.verified === true || artist.verification_status === "verified") ? "#E0F0E8" : "#FEF3DC",
          color: (artist.verified === true || artist.verification_status === "verified") ? "var(--verified)" : "var(--needs-review)",
        }}>
          {(artist.verified === true || artist.verification_status === "verified") ? "✓ 검증됨" : "검토 필요"}
        </span>
      </div>

      {/* 링크 버튼 */}
      {(artist.website || artist.website_url || artist.instagram || artist.instagram_url || artist.video_url) && (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "36px" }}>
          {(artist.website || artist.website_url) && <ELink href={artist.website || artist.website_url!} v="navy">🌐 웹사이트</ELink>}
          {(artist.instagram || artist.instagram_url) && <ELink href={artist.instagram || artist.instagram_url!} v="accent">📷 Instagram</ELink>}
          {artist.video_url && <ELink href={artist.video_url} v="outline">▶ 영상</ELink>}
        </div>
      )}

      <div style={{ height: "1.5px", background: "var(--border)", marginBottom: "32px" }} />

      {/* 소개 */}
      {(artist.bio || artist.bio_short) && (
        <section style={{ marginBottom: "32px" }}>
          <SLabel>소개</SLabel>
          <p style={{ fontSize: "0.95rem", color: "var(--ink)", lineHeight: 1.8 }}>{artist.bio || artist.bio_short}</p>
        </section>
      )}

      {/* 대표작 섹션 */}
      {displayWorks && displayWorks.length > 0 && (
        <section style={{ marginBottom: "40px" }}>
          <SLabel>대표작 포트폴리오</SLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
            {displayWorks.map((work, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedWork(work)}
                style={{
                  background: "#fff",
                  border: "1.5px solid var(--border)",
                  borderRadius: "14px",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(245, 166, 35, 0.12)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Work Image */}
                <div style={{
                  width: "100%",
                  height: "160px",
                  overflow: "hidden",
                  borderBottom: "1.5px solid var(--border)",
                  position: "relative"
                }}>
                  <img
                    src={work.image_url || "/images/placeholders/cake-placeholder.png"}
                    alt={work.title}
                    onError={(e) => {
                      e.currentTarget.src = "/images/placeholders/cake-placeholder.png";
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                {/* Work Info */}
                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--navy)", margin: 0, lineHeight: 1.3 }}>
                      〈{work.title}〉
                    </h4>
                    {work.year && (
                      <span style={{ fontSize: "0.75rem", color: "var(--ink-faint)", fontWeight: 700, whiteSpace: "nowrap" }}>
                        {work.year}
                      </span>
                    )}
                  </div>
                  {work.role && (
                    <p style={{ fontSize: "0.75rem", color: "var(--accent-dark)", fontWeight: 700, marginBottom: "8px" }}>
                      역할: {work.role}
                    </p>
                  )}
                  {work.description && (
                    <p style={{
                      fontSize: "0.82rem",
                      color: "var(--ink-muted)",
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {work.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 작품 목록 */}
      {artist.works && artist.works.length > 0 && (
        <section style={{ marginBottom: "32px", borderTop: "1.5px solid var(--border)", paddingTop: "24px" }}>
          <SLabel>전체 작품 목록</SLabel>
          {artist.reviews && artist.reviews.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {(() => {
                const flattenedList: Array<{
                  title: string;
                  year: any;
                  venue: string;
                  role: string;
                  sourceUrl: string;
                }> = [];

                artist.works.forEach((w) => {
                  const titleStr = typeof w === "string" ? w : (w as any).title || "";
                  const year = typeof w === "string" ? null : (w as any).year;
                  const venue = typeof w === "string" ? "" : (w as any).venue || (w as any).festival || "";
                  const role = typeof w === "string" ? "" : (w as any).role || "";
                  const sourceUrl = typeof w === "string" ? "" : (w as any).source_url || "";

                  const titles = parseWorksIntoTitles(titleStr);
                  titles.forEach((t) => {
                    let cleanTitle = t.trim();
                    let cleanYear = year;

                    if (typeof w === "string") {
                      const yearMatch = cleanTitle.match(/\((\d{4})\)/);
                      if (yearMatch) {
                        cleanYear = yearMatch[1];
                        cleanTitle = cleanTitle.replace(/\((\d{4})\)/, "").trim();
                      } else if (cleanTitle.includes("(연도미상)")) {
                        cleanTitle = cleanTitle.replace("(연도미상)", "").trim();
                      }
                    }

                    flattenedList.push({
                      title: cleanTitle,
                      year: cleanYear,
                      venue,
                      role,
                      sourceUrl
                    });
                  });
                });

                return flattenedList.map((item, i) => (
                  <div key={i} style={{
                    padding: "12px 0", borderBottom: "1px solid var(--border)",
                    display: "flex", gap: "16px", alignItems: "flex-start",
                  }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)", fontWeight: 600, minWidth: "40px", paddingTop: "2px" }}>
                      {item.year ?? i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--navy)" }}>〈{item.title}〉</span>
                        {item.venue && (
                          <span style={{ marginLeft: "10px", fontSize: "0.8rem", color: "var(--ink-muted)" }}>
                            {item.venue}
                          </span>
                        )}
                        {item.role && item.role !== "choreographer" && (
                          <span className="tag" style={{ marginLeft: "8px", fontSize: "0.62rem" }}>{item.role}</span>
                        )}
                      </div>

                      {/* 관련 리뷰 보기 Toggle Button & List */}
                      {(() => {
                        const workReviews = artist.reviews ? artist.reviews.filter(r => r.workTitle === item.title) : [];
                        if (workReviews.length === 0) return null;
                        const isExpanded = !!toggledReviews[item.title];
                        return (
                          <div style={{ marginTop: "6px" }}>
                            <button
                              type="button"
                              onClick={() => {
                                setToggledReviews(prev => ({ ...prev, [item.title]: !prev[item.title] }));
                              }}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--accent-dark)",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                padding: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              관련 리뷰 보기 {isExpanded ? "▲" : "▼"}
                            </button>
                            {isExpanded && (
                              <ul style={{
                                listStyle: "none",
                                padding: "8px 12px",
                                margin: "6px 0 0",
                                background: "var(--accent-light)",
                                borderRadius: "8px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                                border: "1px solid var(--accent)",
                              }}>
                                {workReviews.map((rev, revIdx) => (
                                  <li key={revIdx} style={{ fontSize: "0.82rem", display: "flex", alignItems: "center" }}>
                                    <span style={{ marginRight: "6px", color: "var(--accent-dark)" }}>•</span>
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
                    {item.sourceUrl && (
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: "0.7rem", color: "var(--accent-dark)", textDecoration: "none", fontWeight: 700 }}>
                        출처↗
                      </a>
                    )}
                  </div>
                ));
              })()}
            </div>
          ) : (
            <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
              {(() => {
                const allTitles: string[] = [];
                artist.works.forEach((w) => {
                  const titleStr = typeof w === "string" ? w : (w as any).title || "";
                  const titles = parseWorksIntoTitles(titleStr);
                  titles.forEach((t) => {
                    let cleanTitle = t.trim();
                    if (typeof w === "string") {
                      cleanTitle = cleanTitle.replace(/\((\d{4})\)/, "").replace("(연도미상)", "").trim();
                    }
                    allTitles.push(cleanTitle);
                  });
                });
                return allTitles.join(" · ");
              })()}
            </p>
          )}
        </section>
      )}

      {/* works 없을 때 */}
      {(!artist.works || artist.works.length === 0) && (
        <section style={{ marginBottom: "32px" }}>
          <SLabel>작품 목록</SLabel>
          <p style={{ fontSize: "0.85rem", color: "var(--ink-faint)" }}>등록된 작품이 없습니다.</p>
        </section>
      )}

      {/* 🤖 AI Summary */}
      <section style={{ marginBottom: "32px", background: "var(--accent-light)", padding: "20px", borderRadius: "14px", border: "1.5px solid var(--accent)" }}>
        <h3 style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--accent-dark)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
          🤖 AI Summary
        </h3>
        {artist.aiSummary ? (
          <div>
            <p style={{ fontSize: "0.95rem", color: "var(--ink)", lineHeight: 1.8, marginBottom: "12px", whiteSpace: "pre-line" }}>
              {artist.aiSummary}
            </p>
            <p style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 500, borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "8px" }}>
              * 이 요약은 대표작 소개와 공개된 자료를 바탕으로 생성된 AI 요약입니다.
            </p>
          </div>
        ) : (
          <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)" }}>아직 AI Summary가 준비되지 않았습니다.</p>
        )}
      </section>

      {/* 인터뷰 및 기타 기사 */}
      <section style={{ marginBottom: "32px" }}>
        <SLabel>인터뷰 및 기타 기사</SLabel>
        {(() => {
          const generalReviews = artist.reviews ? artist.reviews.filter(r => r.workTitle === "GENERAL") : [];
          if (generalReviews.length > 0) {
            return (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                {generalReviews.map((rev, revIdx) => (
                  <li key={revIdx} style={{ fontSize: "0.88rem", display: "flex", alignItems: "center" }}>
                    <span style={{ marginRight: "6px", color: "var(--accent-dark)" }}>•</span>
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
              <p style={{ fontSize: "0.85rem", color: "var(--ink-faint)" }}>등록된 리뷰가 없습니다.</p>
            );
          }
        })()}
      </section>

      {/* 태그 */}
      {artist.tags && artist.tags.length > 0 && (
        <section style={{ marginBottom: "32px" }}>
          <SLabel>태그</SLabel>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {artist.tags.map((t) => <span key={t} className="tag">{t}</span>)}
          </div>
        </section>
      )}

      {/* 출처 */}
      {artist.source_file && (
        <div style={{ paddingTop: "20px", borderTop: "1px solid var(--border)", marginBottom: "40px" }}>
          <p style={{ fontSize: "0.68rem", color: "var(--ink-faint)", fontWeight: 500 }}>
            source: {artist.source_file}
          </p>
          <p style={{ fontSize: "0.65rem", color: "var(--ink-faint)", marginTop: "4px" }}>
            record id: {artist.recordId}
          </p>
        </div>
      )}

      <div style={{ height: "1.5px", background: "var(--border)", margin: "40px 0" }} />

      {/* ── 4. ARTIST COMMENTS SECTION (한 줄 응원) ── */}
      <section style={{ marginBottom: "48px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)", marginBottom: "16px" }}>💬 아티스트 한 줄 응원 및 댓글 ({comments.length})</h3>

        {/* Add Comment Form */}
        <form onSubmit={handleCommentSubmit} style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <input
            type="text"
            placeholder={currentUser ? "이 아티스트에게 한 줄 응원을 남겨보세요..." : "응원 댓글을 남기려면 먼저 로그인해주세요."}
            disabled={!currentUser}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            style={{ flex: 1, padding: "12px 16px", fontSize: "0.9rem" }}
          />
          {currentUser ? (
            <button
              type="submit"
              style={{
                padding: "0 24px",
                background: "var(--navy)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "0.88rem",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              작성
            </button>
          ) : (
            <button
              type="button"
              onClick={triggerLoginRedirect}
              style={{
                padding: "0 24px",
                background: "transparent",
                color: "var(--navy)",
                border: "1.5px solid var(--navy)",
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "0.88rem",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              로그인
            </button>
          )}
        </form>

        {/* Comments List */}
        {comments.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", background: "#F8FAFC", borderRadius: "12px", border: "1.5px dashed var(--border)", color: "var(--ink-muted)", fontSize: "0.85rem" }}>
            첫 번째 댓글을 작성하여 아티스트에게 따뜻한 응원을 보내보세요!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {comments.map((c) => {
              const isAuthor = currentUser?.id === c.userId;
              const hasLiked = currentUser ? c.likesUsers?.includes(currentUser.id) : false;
              
              return (
                <div 
                  key={c.id}
                  style={{
                    background: "#fff",
                    border: "1.5px solid var(--border)",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    boxShadow: "0 2px 8px rgba(30,45,64,0.01)"
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--navy)" }}>{c.userName}</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--ink-faint)" }}>
                        {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.88rem", color: "var(--ink)", lineHeight: 1.5 }}>{c.content}</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    {/* Like button */}
                    <button
                      onClick={() => handleCommentLike(c.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: hasLiked ? "#EF4444" : "var(--ink-faint)",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontFamily: "inherit"
                      }}
                    >
                      <span>{hasLiked ? "❤️" : "🤍"}</span>
                      <span>{c.likesCount || 0}</span>
                    </button>

                    {/* Delete button */}
                    {isAuthor && (
                      <button
                        onClick={() => handleCommentDelete(c.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#DC2626",
                          cursor: "pointer",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          textDecoration: "underline",
                          fontFamily: "inherit"
                        }}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 대표작 보기 모달 */}
      {selectedWork && (
        <div className="modal-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedWork(null)}>
          <div className="modal-box" style={{ padding: "28px", position: "relative", maxWidth: "640px" }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedWork(null)}
              style={{
                position: "absolute", top: "20px", right: "20px",
                background: "transparent", border: "none", fontSize: "1.2rem",
                cursor: "pointer", color: "var(--ink-muted)"
              }}
            >
              ✕
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Modal Work Image */}
              <img
                src={selectedWork.image_url || "/images/placeholders/cake-placeholder.png"}
                alt={selectedWork.title}
                onError={(e) => {
                  e.currentTarget.src = "/images/placeholders/cake-placeholder.png";
                }}
                style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: "12px", border: "1.5px solid var(--border)" }}
              />

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                  <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--navy)" }}>
                    〈{selectedWork.title}〉
                  </h3>
                  {selectedWork.year && (
                    <span style={{ fontSize: "0.9rem", color: "var(--ink-muted)", fontWeight: 700 }}>
                      {selectedWork.year}년 작
                    </span>
                  )}
                </div>
                {selectedWork.role && (
                  <p style={{ fontSize: "0.85rem", color: "var(--accent-dark)", fontWeight: 700, marginBottom: "12px" }}>
                    참여 역할: {selectedWork.role}
                  </p>
                )}
                {selectedWork.description && (
                  <p style={{ fontSize: "0.92rem", color: "var(--ink)", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                    {selectedWork.description}
                  </p>
                )}
              </div>

              {/* Video Embed or Link */}
              {selectedWork.video_url && (() => {
                const parsed = parseVideoUrl(selectedWork.video_url);
                if (parsed.type === "youtube" || parsed.type === "vimeo") {
                  return (
                    <div style={{ marginTop: "10px" }}>
                      <h4 style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                        🎬 관련 영상 ({parsed.type === "youtube" ? "YouTube" : "Vimeo"})
                      </h4>
                      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "10px", background: "#000" }}>
                        <iframe
                          src={parsed.embedUrl}
                          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  );
                } else if (parsed.originalUrl) {
                  return (
                    <div style={{ marginTop: "10px" }}>
                      <h4 style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                        🎬 관련 영상 링크
                      </h4>
                      <a
                        href={parsed.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "10px 18px",
                          background: "var(--navy)",
                          color: "#fff",
                          borderRadius: "10px",
                          textDecoration: "none",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          transition: "background 0.15s"
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = "var(--ink)"}
                        onMouseOut={(e) => e.currentTarget.style.background = "var(--navy)"}
                      >
                        영상 보러가기 ↗
                      </a>
                    </div>
                  );
                }
                return null;
              })()}

            </div>
          </div>
        </div>
      )}

      {/* 공유 모달 */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-box" style={{ padding: "28px", position: "relative", maxWidth: "400px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowShareModal(false)}
              style={{
                position: "absolute", top: "16px", right: "16px",
                background: "transparent", border: "none", fontSize: "1.1rem",
                cursor: "pointer", color: "var(--ink-muted)"
              }}
            >
              ✕
            </button>

            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", marginBottom: "8px" }}>
              프로필 공유하기
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginBottom: "20px" }}>
              링크나 QR 코드를 이용해 아티스트 프로필을 공유하세요.
            </p>

            {/* QR Code */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                alt="QR Code"
                style={{ width: "140px", height: "140px", borderRadius: "8px", border: "1.5px solid var(--border)", padding: "4px" }}
              />
            </div>

            {/* Copy Button */}
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                readOnly
                type="text"
                value={typeof window !== "undefined" ? window.location.href : ""}
                style={{
                  flex: 1, padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: "10px", outline: "none", fontSize: "0.8rem", background: "#f8fafc"
                }}
              />
              <button
                onClick={copyShareLink}
                style={{
                  padding: "8px 16px", background: "var(--navy)", color: "#fff", border: "none", borderRadius: "8px",
                  fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap"
                }}
              >
                {copiedShare ? "복사됨!" : "링크 복사"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px", ...style }}>
      {children}
    </p>
  );
}
function ELink({ href, v, children }: { href: string; v: "navy"|"accent"|"outline"; children: React.ReactNode }) {
  const s: React.CSSProperties = { textDecoration: "none", padding: "10px 20px", borderRadius: "9px", fontSize: "0.85rem", fontWeight: 700, display: "inline-block" };
  const styles = { navy: { ...s, background: "var(--navy)", color: "#fff" }, accent: { ...s, background: "var(--accent)", color: "var(--navy)" }, outline: { ...s, border: "1.5px solid var(--border)", color: "var(--ink)" } };
  return <a href={href} target="_blank" rel="noopener noreferrer" style={styles[v]}>{children}</a>;
}
