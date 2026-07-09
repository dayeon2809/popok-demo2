"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  getLoggedInUser, 
  updateProfile, 
  getUserComments, 
  getUserRatings,
  getUserArtistComments
} from "@/lib/supabase";
import { getPerformances } from "@/lib/performances";
import PerformanceCard from "@/components/PerformanceCard";
import artistsData from "@/data/artists.json";
import type { UserProfile, Performance, PerformanceComment, PerformanceRating, Artist, ArtistComment } from "@/types";

function colorFromName(name: string): string {
  const colors = ["#F5A623","#1E2D40","#4A8C6F","#9B59B6","#E06060","#2980B9","#F39C12","#16A085"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"saves" | "saved_artists" | "comments" | "ratings">("saves");
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  
  // Data State
  const [savedPerformances, setSavedPerformances] = useState<Performance[]>([]);
  const [savedArtists, setSavedArtists] = useState<Artist[]>([]);
  const [myComments, setMyComments] = useState<PerformanceComment[]>([]);
  const [myArtistComments, setMyArtistComments] = useState<ArtistComment[]>([]);
  const [myRatings, setMyRatings] = useState<PerformanceRating[]>([]);
  const [allPerformances, setAllPerformances] = useState<Performance[]>([]);

  useEffect(() => {
    const cachedUser = getLoggedInUser();
    if (!cachedUser) {
      router.push("/login?redirect=/profile");
      return;
    }
    setUser(cachedUser);
    setEditNickname(cachedUser.nickname);
    setEditAvatarUrl(cachedUser.avatarUrl);

    // Load performance data
    const performancesList = getPerformances();
    setAllPerformances(performancesList);

    // Filter saved performances
    const savedIds = cachedUser.savedPerformances || [];
    const saved = performancesList.filter(p => savedIds.includes(p.id));
    setSavedPerformances(saved);

    // Filter saved artists
    const savedArtistIds = cachedUser.savedArtists || [];
    const savedArt = (artistsData as Artist[]).filter(a => savedArtistIds.includes(a.id));
    setSavedArtists(savedArt);

    // Comments & Ratings
    setMyComments(getUserComments());
    setMyArtistComments(getUserArtistComments());
    setMyRatings(getUserRatings());
  }, [router]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNickname.trim()) return;

    const avatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(editNickname.trim())}`;
    const updated = updateProfile(editNickname.trim(), avatar);
    if (updated) {
      setUser(updated);
      setEditAvatarUrl(avatar);
      setIsEditing(false);
      window.dispatchEvent(new Event("poc-auth-change")); // Update GNB
    }
  };

  if (!user) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center", color: "var(--ink-muted)" }}>
        인증 정보를 불러오는 중...
      </div>
    );
  }

  // Find performance title by id for lists
  const getPerformanceTitle = (perfId: string) => {
    const found = allPerformances.find(p => p.id === perfId);
    return found ? found.title : "알 수 없는 공연";
  };

  // Find artist name by id for lists
  const getArtistName = (artId: string) => {
    const found = (artistsData as Artist[]).find(a => a.id === artId);
    return found ? found.name : "알 수 없는 아티스트";
  };

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 32px 80px" }}>
      
      {/* ── PROFILE CARD ── */}
      <div style={{
        background: "#fff",
        border: "1.5px solid var(--border)",
        borderRadius: "16px",
        padding: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "24px",
        marginBottom: "40px",
        boxShadow: "0 4px 20px rgba(30,45,64,0.02)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          {/* Avatar */}
          <img 
            src={editAvatarUrl} 
            alt={user.nickname} 
            style={{ 
              width: "80px", 
              height: "80px", 
              borderRadius: "50%", 
              border: "2px solid var(--accent)",
              background: "var(--accent-light)",
              objectFit: "cover"
            }} 
          />
          
          {/* User Meta */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                style={{ padding: "8px 12px", fontSize: "0.95rem", width: "160px" }}
                maxLength={15}
                required
              />
              <button 
                type="submit" 
                style={{
                  padding: "8px 16px", background: "var(--navy)", color: "#fff",
                  border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.82rem",
                  cursor: "pointer"
                }}
              >
                저장
              </button>
              <button 
                type="button" 
                onClick={() => { setIsEditing(false); setEditNickname(user.nickname); }}
                style={{
                  padding: "8px 16px", background: "transparent", color: "var(--ink-muted)",
                  border: "1.5px solid var(--border)", borderRadius: "8px", fontWeight: 700, fontSize: "0.82rem",
                  cursor: "pointer"
                }}
              >
                취소
              </button>
            </form>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--navy)" }}>{user.nickname}</h2>
                <button 
                  onClick={() => setIsEditing(true)}
                  style={{
                    background: "transparent", border: "none", color: "var(--accent-dark)",
                    fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", textDecoration: "underline"
                  }}
                >
                  수정
                </button>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }}>{user.email}</p>
            </div>
          )}
        </div>
        
        {/* Statistics badge */}
        <div style={{ display: "flex", gap: "14px", background: "#F8FAFC", padding: "16px 20px", borderRadius: "12px", border: "1px solid var(--border)", flexWrap: "wrap" }}>
          <div style={{ textAlign: "center", minWidth: "50px" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)" }}>{savedPerformances.length}</div>
            <div style={{ fontSize: "0.68rem", color: "var(--ink-muted)", marginTop: "2px", fontWeight: 700 }}>저장 공연</div>
          </div>
          <div style={{ width: "1px", background: "var(--border)" }} />
          <div style={{ textAlign: "center", minWidth: "50px" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)" }}>{savedArtists.length}</div>
            <div style={{ fontSize: "0.68rem", color: "var(--ink-muted)", marginTop: "2px", fontWeight: 700 }}>저장 아티스트</div>
          </div>
          <div style={{ width: "1px", background: "var(--border)" }} />
          <div style={{ textAlign: "center", minWidth: "50px" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)" }}>{myComments.length + myArtistComments.length}</div>
            <div style={{ fontSize: "0.68rem", color: "var(--ink-muted)", marginTop: "2px", fontWeight: 700 }}>작성 댓글</div>
          </div>
          <div style={{ width: "1px", background: "var(--border)" }} />
          <div style={{ textAlign: "center", minWidth: "50px" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)" }}>{myRatings.length}</div>
            <div style={{ fontSize: "0.68rem", color: "var(--ink-muted)", marginTop: "2px", fontWeight: 700 }}>매긴 평점</div>
          </div>
        </div>
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div style={{
        display: "flex",
        borderBottom: "1.5px solid var(--border)",
        marginBottom: "28px",
        gap: "24px",
        overflowX: "auto",
        whiteSpace: "nowrap"
      }}>
        {[
          { id: "saves", label: `저장한 공연 (${savedPerformances.length})` },
          { id: "saved_artists", label: `저장한 아티스트 (${savedArtists.length})` },
          { id: "comments", label: `작성한 댓글 (${myComments.length + myArtistComments.length})` },
          { id: "ratings", label: `매긴 평점 (${myRatings.length})` }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: "transparent",
                border: "none",
                paddingBottom: "12px",
                borderBottom: isActive ? "3px solid var(--navy)" : "3px solid transparent",
                color: isActive ? "var(--navy)" : "var(--ink-muted)",
                fontSize: "0.95rem",
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s"
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB PANELS ── */}
      
      {/* Panel 1: Saved Performances */}
      {activeTab === "saves" && (
        <div>
          {savedPerformances.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", background: "#fff", borderRadius: "12px", border: "1.5px dashed var(--border)" }}>
              <span style={{ fontSize: "2rem", display: "block", marginBottom: "12px" }}>🎟️</span>
              <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)" }}>저장한 공연이 없습니다. 공연 탐색 페이지에서 맘에 드는 공연을 담아보세요.</p>
              <Link href="/performances" style={{
                display: "inline-block", marginTop: "14px", padding: "8px 18px", background: "var(--navy)",
                color: "#fff", textDecoration: "none", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 700
              }}>공연 탐색하러 가기</Link>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "24px"
            }}>
              {savedPerformances.map(p => (
                <Link href={`/performances/${p.id}`} key={p.id} style={{ textDecoration: "none", color: "inherit" }}>
                  <PerformanceCard performance={p} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Panel 2: Saved Artists */}
      {activeTab === "saved_artists" && (
        <div>
          {savedArtists.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", background: "#fff", borderRadius: "12px", border: "1.5px dashed var(--border)" }}>
              <span style={{ fontSize: "2rem", display: "block", marginBottom: "12px" }}>🧑‍🎨</span>
              <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)" }}>저장한 아티스트가 없습니다. 아티스트 DB에서 맘에 드는 아티스트를 담아보세요.</p>
              <Link href="/artists" style={{
                display: "inline-block", marginTop: "14px", padding: "8px 18px", background: "var(--navy)",
                color: "#fff", textDecoration: "none", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 700
              }}>아티스트 DB 가기</Link>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "24px"
            }}>
              {savedArtists.map(artist => {
                const artistColor = colorFromName(artist.name);
                return (
                  <Link href={`/artists/${artist.id}`} key={artist.id} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{
                      background: "#fff",
                      border: "1.5px solid var(--border)",
                      borderRadius: "16px",
                      padding: "24px",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      transition: "all 0.15s",
                      height: "100%",
                      boxShadow: "0 4px 12px rgba(30,45,64,0.02)"
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
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: (artist.profileImage || artist.photo_url)
                          ? `url(${artist.profileImage || artist.photo_url}) center/cover no-repeat`
                          : `linear-gradient(135deg, ${artistColor}2A 0%, ${artistColor}4B 100%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.2rem",
                        fontWeight: 800,
                        color: artistColor,
                        flexShrink: 0
                      }}>
                        {!(artist.profileImage || artist.photo_url) && artist.name.charAt(0)}
                      </div>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--navy)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {artist.name}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--ink-muted)", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {artist.company || "아티스트"}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Panel 3: My Comments */}
      {activeTab === "comments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* 1. 공연 댓글 */}
          <div>
            <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--navy)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              🎬 공연 한 줄 평 ({myComments.length})
            </h4>
            {myComments.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", background: "#fff", borderRadius: "12px", border: "1.5px dashed var(--border)", color: "var(--ink-muted)", fontSize: "0.85rem" }}>
                작성한 공연 댓글이 없습니다.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {myComments.map(c => (
                  <div 
                    key={c.id} 
                    style={{ 
                      background: "#fff", 
                      border: "1.5px solid var(--border)", 
                      borderRadius: "12px", 
                      padding: "20px",
                      boxShadow: "0 2px 8px rgba(30,45,64,0.01)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--ink-muted)" }}>
                        공연: <Link href={`/performances/${c.performanceId}`} style={{ color: "var(--navy)", textDecoration: "underline" }}>
                          〈{getPerformanceTitle(c.performanceId)}〉
                        </Link>
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>
                        {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.88rem", color: "var(--ink)", lineHeight: "1.5" }}>
                      {c.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. 아티스트 응원 댓글 */}
          <div>
            <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--navy)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              🧑‍🎨 아티스트 응원 및 댓글 ({myArtistComments.length})
            </h4>
            {myArtistComments.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", background: "#fff", borderRadius: "12px", border: "1.5px dashed var(--border)", color: "var(--ink-muted)", fontSize: "0.85rem" }}>
                작성한 아티스트 응원 댓글이 없습니다.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {myArtistComments.map(c => (
                  <div 
                    key={c.id} 
                    style={{ 
                      background: "#fff", 
                      border: "1.5px solid var(--border)", 
                      borderRadius: "12px", 
                      padding: "20px",
                      boxShadow: "0 2px 8px rgba(30,45,64,0.01)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--ink-muted)" }}>
                        아티스트: <Link href={`/artists/${c.artistId}`} style={{ color: "var(--navy)", textDecoration: "underline" }}>
                          {getArtistName(c.artistId)}
                        </Link>
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>
                        {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.88rem", color: "var(--ink)", lineHeight: "1.5" }}>
                      {c.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panel 4: My Ratings */}
      {activeTab === "ratings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {myRatings.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", background: "#fff", borderRadius: "12px", border: "1.5px dashed var(--border)" }}>
              <span style={{ fontSize: "2rem", display: "block", marginBottom: "12px" }}>⭐</span>
              <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)" }}>아직 매긴 평점이 없습니다.</p>
            </div>
          ) : (
            myRatings.map(r => (
              <div 
                key={r.id} 
                style={{ 
                  background: "#fff", 
                  border: "1.5px solid var(--border)", 
                  borderRadius: "12px", 
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "0 2px 8px rgba(30,45,64,0.01)"
                }}
              >
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--navy)" }}>
                  <Link href={`/performances/${r.performanceId}`} style={{ color: "inherit", textDecoration: "none" }}>
                    〈{getPerformanceTitle(r.performanceId)}〉
                  </Link>
                </span>
                
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.1rem", color: "#F5A623" }}>
                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                  </span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--ink)" }}>{r.rating}점</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
