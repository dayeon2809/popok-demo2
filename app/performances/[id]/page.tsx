"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePerformance } from "@/lib/api";
import { getPerformancePosterUrl } from "@/lib/performances";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";
import { 
  getLoggedInUser, 
  addComment, 
  deleteComment, 
  getComments, 
  toggleLikeComment,
  getRatings,
  addRating,
  getAverageRating,
  toggleSavePerformance,
  isPerformanceSaved
} from "@/lib/supabase";
import artistsData from "@/data/artists.json";
import type { Artist, UserProfile, PerformanceComment, PerformanceRating } from "@/types";

function colorFromName(name: string): string {
  const colors = ["#F5A623", "#1E2D40", "#4A8C6F", "#9B59B6", "#E06060", "#2980B9", "#F39C12", "#16A085"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

export default function PerformanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const { performance: p, loading, error } = usePerformance(id);

  // Authenticated User state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Interactive UI states
  const [isSaved, setIsSaved] = useState(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [avgRating, setAvgRating] = useState({ average: 0, count: 0 });
  const [comments, setComments] = useState<PerformanceComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  
  // Review Links Toggle state
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    params.then(({ id: pid }) => setId(decodeURIComponent(pid)));
  }, [params]);

  // Load interactive state once performance ID & user are ready
  const loadInteractiveState = useCallback(() => {
    if (!id) return;
    const user = getLoggedInUser();
    setCurrentUser(user);
    
    // Saves
    setIsSaved(isPerformanceSaved(id));

    // Ratings
    setAvgRating(getAverageRating(id));
    const ratings = getRatings(id);
    const myRating = ratings.find(r => r.userId === user?.id);
    if (myRating) {
      setUserRating(myRating.rating);
    } else {
      setUserRating(0);
    }

    // Comments
    setComments(getComments(id));
  }, [id]);

  useEffect(() => {
    loadInteractiveState();

    // Listen for GNB logins/logouts
    const handleAuthChange = () => {
      loadInteractiveState();
    };
    window.addEventListener("poc-auth-change", handleAuthChange);
    return () => window.removeEventListener("poc-auth-change", handleAuthChange);
  }, [loadInteractiveState]);

  if (loading) {
    return (
      <div style={{ maxWidth: "800px", margin: "80px auto" }}>
        <LoadingSpinner message="공연 정보를 불러오는 중..." />
      </div>
    );
  }

  if (error || !p) {
    return (
      <div style={{ maxWidth: "800px", margin: "80px auto" }}>
        <ErrorMessage message={error ?? "공연을 찾을 수 없습니다."} />
      </div>
    );
  }

  const color = colorFromName(p.title);
  const initial = p.title.charAt(0);
  const posterUrl = getPerformancePosterUrl(p);

  // Format dates
  const datesText = p.startDate
    ? p.endDate && p.endDate !== p.startDate
      ? `${p.startDate} ~ ${p.endDate}`
      : p.startDate
    : "일정 미정";

  // Look up artists in artists.json (flexible mapping: matches name, slug/id, or Airtable recordId)
  const matchedArtists: Artist[] = [];
  const unmatchedNames: string[] = [];

  if (p.artistIds && p.artistIds.length > 0) {
    p.artistIds.forEach((artistIdStr) => {
      const cleanId = artistIdStr.trim();
      const matched = (artistsData as Artist[]).find((a) => {
        return (
          a.name.trim().toLowerCase() === cleanId.toLowerCase() ||
          a.id.trim().toLowerCase() === cleanId.toLowerCase() ||
          a.recordId?.trim().toLowerCase() === cleanId.toLowerCase()
        );
      });

      if (matched) {
        if (!matchedArtists.some((ma) => ma.id === matched.id)) {
          matchedArtists.push(matched);
        }
      } else {
        unmatchedNames.push(cleanId);
      }
    });
  }

  // Interactive Handlers
  const triggerLoginRedirect = () => {
    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  };

  const handleSave = () => {
    if (!currentUser) {
      triggerLoginRedirect();
      return;
    }
    const saved = toggleSavePerformance(p.id);
    setIsSaved(saved);
  };

  const handleRate = (ratingValue: number) => {
    if (!currentUser) {
      triggerLoginRedirect();
      return;
    }
    addRating(p.id, ratingValue);
    setUserRating(ratingValue);
    setAvgRating(getAverageRating(p.id));
    // Trigger profile tab updates if any
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      triggerLoginRedirect();
      return;
    }
    if (!newCommentText.trim()) return;
    
    addComment(p.id, newCommentText);
    setNewCommentText("");
    setComments(getComments(p.id));
  };

  const handleCommentDelete = (commentId: string) => {
    if (!currentUser) return;
    if (confirm("댓글을 삭제하시겠습니까?")) {
      deleteComment(commentId);
      setComments(getComments(p.id));
    }
  };

  const handleCommentLike = (commentId: string) => {
    if (!currentUser) {
      triggerLoginRedirect();
      return;
    }
    toggleLikeComment(commentId);
    setComments(getComments(p.id));
  };

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 32px 80px" }}>
      {/* Back Button */}
      <Link href="/performances" style={{
        textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px",
        color: "var(--ink-muted)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "32px",
      }}>← 전체 공연 목록</Link>

      {/* ── 1. POSTER & 2. CORE PERFORMANCE INFO ── */}
      <div className="responsive-stack-320" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "40px",
        marginBottom: "48px"
      }}>
        {/* Left: Poster */}
        <div style={{
          width: "100%",
          aspectRatio: "3/4",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 12px 36px rgba(0,0,0,0.08)",
          border: "1px solid var(--border)",
          background: posterUrl
            ? `url(${posterUrl}) center/cover no-repeat`
            : `linear-gradient(135deg, ${color}1E 0%, ${color}45 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative"
        }}>
          {!posterUrl && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "20px" }}>
              <span style={{ fontSize: "5rem", fontWeight: 900, color, opacity: 0.5 }}>{initial}</span>
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {/* Genre Tags */}
          {p.genre && p.genre.length > 0 && (
            <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
              {p.genre.map((g) => (
                <span key={g} className="tag" style={{ fontSize: "0.68rem" }}>{g}</span>
              ))}
            </div>
          )}

          {/* Title & Company */}
          <h1 className="display" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "var(--navy)", marginBottom: "8px" }}>
            {p.title}
          </h1>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-dark)", margin: 0 }}>
              {p.company || "무용단 정보 없음"}
            </p>
            
            {/* Save Button */}
            <button
              onClick={handleSave}
              style={{
                background: isSaved ? "var(--accent-light)" : "transparent",
                color: isSaved ? "var(--accent-dark)" : "var(--ink-muted)",
                border: "1.5px solid",
                borderColor: isSaved ? "var(--accent)" : "var(--border-dark)",
                borderRadius: "20px",
                padding: "6px 14px",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontFamily: "inherit",
                transition: "all 0.15s"
              }}
            >
              <span>{isSaved ? "♥ 저장됨" : "♡ 저장"}</span>
            </button>
          </div>

          {/* Details metadata */}
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "14px", 
            padding: "20px", 
            background: "#F8FAFC", 
            borderRadius: "12px",
            border: "1px solid var(--border)",
            marginBottom: "28px"
          }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ fontWeight: 700, color: "var(--ink-muted)", width: "70px", flexShrink: 0 }}>일정</span>
              <span style={{ color: "var(--navy)", fontWeight: 600 }}>{datesText}</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ fontWeight: 700, color: "var(--ink-muted)", width: "70px", flexShrink: 0 }}>장소</span>
              <span style={{ color: "var(--navy)", fontWeight: 600 }}>
                {p.venue} {p.city && `(${p.city})`}
              </span>
            </div>
          </div>

          {/* Booking Button */}
          {p.ticketUrl ? (
            <a
              href={p.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: "none",
                display: "block",
                textAlign: "center",
                background: "var(--navy)",
                color: "#fff",
                padding: "15px 32px",
                borderRadius: "10px",
                fontSize: "0.95rem",
                fontWeight: 800,
                boxShadow: "0 4px 12px rgba(30,45,64,0.12)",
                transition: "transform 0.15s"
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "none")}
            >
              🎟️ 공연 예매하기 (Booking)
            </a>
          ) : (
            <button
              disabled
              style={{
                background: "var(--border)",
                color: "var(--ink-faint)",
                padding: "15px 32px",
                borderRadius: "10px",
                fontSize: "0.95rem",
                fontWeight: 700,
                border: "none",
                width: "100%",
                cursor: "not-allowed"
              }}
            >
              예매 정보 준비 중
            </button>
          )}
        </div>
      </div>

      {/* Description Body */}
      {p.description && (
        <section style={{ marginBottom: "40px" }}>
          <p style={{ fontSize: "0.95rem", color: "var(--ink)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
            {p.description}
          </p>
        </section>
      )}

      <div style={{ height: "1.5px", background: "var(--border)", marginBottom: "40px" }} />

      {/* ── 3. RELATED ARTISTS ── */}
      <section style={{ marginBottom: "48px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)", marginBottom: "16px" }}>관련 안무가 / 아티스트</h3>
        
        {matchedArtists.length === 0 && unmatchedNames.length === 0 && (
          <p style={{ fontSize: "0.85rem", color: "var(--ink-faint)" }}>연동된 참여 아티스트 정보가 없습니다.</p>
        )}

        {/* Matched Choreographers Grid */}
        {matchedArtists.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: unmatchedNames.length > 0 ? "24px" : 0
          }}>
            {matchedArtists.map((artist) => {
              const artistColor = colorFromName(artist.name);
              return (
                <Link
                  href={`/artists/${artist.id}`}
                  key={artist.id}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    background: "#fff",
                    border: "1.5px solid var(--border)",
                    borderRadius: "12px",
                    transition: "all 0.15s"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: (artist.profileImage || artist.photo_url)
                      ? `url(${artist.profileImage || artist.photo_url}) center/cover no-repeat`
                      : `linear-gradient(135deg, ${artistColor}2A 0%, ${artistColor}4B 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.9rem",
                    fontWeight: 800,
                    color: artistColor,
                    flexShrink: 0
                  }}>
                    {!(artist.profileImage || artist.photo_url) && artist.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "var(--navy)" }}>{artist.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)", marginTop: "2px" }}>{artist.company || "아티스트"}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Unmatched Text Representation */}
        {unmatchedNames.length > 0 && (
          <div style={{
            padding: "16px 20px",
            background: "#F8FAFC",
            borderRadius: "10px",
            border: "1px solid var(--border)"
          }}>
            <p style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "8px", textTransform: "uppercase" }}>
              기타 참여 아티스트
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {unmatchedNames.map((name) => (
                <span 
                  key={name} 
                  style={{ 
                    fontSize: "0.8rem", 
                    fontWeight: 600, 
                    color: "var(--ink)", 
                    background: "#E8EDF2",
                    padding: "4px 10px",
                    borderRadius: "6px"
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <div style={{ height: "1.5px", background: "var(--border)", marginBottom: "40px" }} />

      {/* ── 4. RATINGS SECTION ── */}
      <section style={{ marginBottom: "48px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)", marginBottom: "16px" }}>⭐ 관객 평점</h3>
        
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "36px",
          background: "#FFFBEB",
          border: "1.5px solid #FDE68A",
          borderRadius: "14px",
          padding: "24px",
          flexWrap: "wrap"
        }}>
          {/* Average Displays */}
          <div style={{ textAlign: "center", minWidth: "120px" }}>
            <div style={{ fontSize: "2.8rem", fontWeight: 800, color: "#D97706", lineHeight: 1 }}>
              {avgRating.count > 0 ? avgRating.average : "0.0"}
            </div>
            <div style={{ display: "flex", justifyContent: "center", color: "#F5A623", fontSize: "1.1rem", margin: "6px 0 2px" }}>
              {avgRating.count > 0 ? (
                <>
                  {"★".repeat(Math.round(avgRating.average))}
                  {"☆".repeat(5 - Math.round(avgRating.average))}
                </>
              ) : "☆☆☆☆☆"}
            </div>
            <span style={{ fontSize: "0.78rem", color: "#92400E", fontWeight: 600 }}>({avgRating.count}명 참여)</span>
          </div>

          <div style={{ width: "1.5px", height: "80px", background: "#FDE68A", display: "none" }} className="divider-vert" />

          {/* User Input Rating */}
          <div style={{ flex: 1, minWidth: "220px" }}>
            <p style={{ fontSize: "0.88rem", fontWeight: 800, color: "#92400E", marginBottom: "8px" }}>
              이 공연에 별점 남기기
            </p>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "4px", fontSize: "1.8rem", cursor: "pointer" }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= userRating;
                  return (
                    <span 
                      key={star} 
                      onClick={() => handleRate(star)}
                      style={{ color: filled ? "#F5A623" : "#D1D5DB" }}
                      title={`${star}점 매기기`}
                    >
                      ★
                    </span>
                  );
                })}
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink-muted)", marginLeft: "8px" }}>
                {userRating > 0 ? `${userRating}점을 매기셨습니다.` : "별점을 선택해주세요."}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. COMMENTS SECTION (한 줄 댓글) ── */}
      <section style={{ marginBottom: "48px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)", marginBottom: "16px" }}>💬 관객 한 줄 감상 ({comments.length})</h3>

        {/* Add Comment Form */}
        <form onSubmit={handleCommentSubmit} style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <input
            type="text"
            placeholder={currentUser ? "이 공연에 대한 한 줄 느낌을 작성해보세요..." : "한 줄 평을 남기려면 먼저 로그인해주세요."}
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
            첫 번째 댓글을 작성하여 공연 감상을 나눠보세요!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {comments.map((c: any) => {
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

      <div style={{ height: "1.5px", background: "var(--border)", marginBottom: "40px" }} />

      {/* ── 6. RELATED ARTICLES (Review Links) ── */}
      {p.reviews && p.reviews.length > 0 && (
        <section style={{ marginBottom: "48px" }}>
          <button 
            onClick={() => setShowReviews(!showReviews)}
            style={{
              background: "transparent", border: "none", color: "var(--accent-dark)",
              fontSize: "1rem", fontWeight: 800, cursor: "pointer", display: "flex",
              alignItems: "center", gap: "6px", padding: 0, fontFamily: "inherit"
            }}
          >
            📰 관련 언론 기사 및 리뷰 ({p.reviews.length}) {showReviews ? "▲" : "▼"}
          </button>
          
          {showReviews && (
            <ul style={{
              listStyle: "none", padding: "16px 20px", marginTop: "12px",
              background: "#F8FAFC", borderRadius: "12px", border: "1px solid var(--border)",
              display: "flex", flexDirection: "column", gap: "10px"
            }}>
              {p.reviews.map((rev, idx) => (
                <li key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--accent)" }}>•</span>
                  <a href={rev.url} target="_blank" rel="noopener noreferrer" style={{
                    color: "var(--navy)", fontWeight: 700, textDecoration: "underline", fontSize: "0.9rem"
                  }}>
                    {rev.source}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ── 7. PERFORMANCE AI SUMMARY ── */}
      {p.aiSummary ? (
        <section style={{ 
          marginBottom: "48px", 
          background: "var(--accent-light)", 
          padding: "24px", 
          borderRadius: "14px", 
          border: "1.5px solid var(--accent)" 
        }}>
          <h3 style={{ 
            fontSize: "0.82rem", 
            fontWeight: 800, 
            color: "var(--accent-dark)", 
            textTransform: "uppercase", 
            letterSpacing: "0.08em", 
            marginBottom: "12px", 
            display: "flex", 
            alignItems: "center", 
            gap: "6px" 
          }}>
            🤖 Performance AI Summary
          </h3>
          <div>
            <p style={{ fontSize: "0.95rem", color: "var(--ink)", lineHeight: 1.8, marginBottom: "8px", whiteSpace: "pre-line" }}>
              {p.aiSummary}
            </p>
            <p style={{ fontSize: "0.72rem", color: "var(--ink-faint)", fontWeight: 500, borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "12px" }}>
              * 이 요약은 제공된 아웃라인과 매체 보도자료를 기반으로 추출된 AI 요약 정보입니다.
            </p>
          </div>
        </section>
      ) : (
        <section style={{ 
          marginBottom: "48px", 
          background: "#F8FAFC", 
          padding: "20px", 
          borderRadius: "14px", 
          border: "1.5px solid var(--border)" 
        }}>
          <h3 style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
            🤖 AI Summary
          </h3>
          <p style={{ fontSize: "0.88rem", color: "var(--ink-faint)" }}>아직 이 공연에 대한 AI Summary가 준비되지 않았습니다.</p>
        </section>
      )}

      {/* ── Future Roadmap Comments ── */}
      {/* 
        TODO: 향후 구현 예정
        - 공연 사진 업로드
        - 공연 영상 첨부
        - 공연 인증 (티켓 인증 등)
        - 공연 본 사람 표시
        - 공연 같이 보기 구인 매칭
        - 팔로우 및 커뮤니티 피드
        - 시맨틱 추천 AI 모델 연동
        - 리뷰 AI 요약 생성기 연동
      */}
    </div>
  );
}
