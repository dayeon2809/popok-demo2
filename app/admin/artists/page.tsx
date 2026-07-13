"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";
import type { Artist } from "@/types";

const FIELD_LABELS: Record<string, string> = {
  contemporary_dance: "현대무용",
  ballet: "발레",
  korean_dance: "한국무용",
  interdisciplinary: "다원예술",
  unknown: "기타",
};

export default function AdminArtistsPage() {
  const router = useRouter();
  
  // Set to true to re-enable claim code UI in CMS
  const showClaimCodes = false;

  const [passcode, setPasscode] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deletion state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem("admin_passcode");
    if (!cached) {
      router.push("/admin");
    } else {
      setPasscode(cached);
      fetchArtists();
    }
  }, [router]);

  const fetchArtists = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/artists", {
        headers: {
          "x-admin-passcode": passcode || sessionStorage.getItem("admin_passcode") || "",
        }
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setArtists(json.data);
      } else {
        setError(json.error || "아티스트 목록을 불러오지 못했습니다.");
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClaimCode = async (id: string) => {
    const authCode = passcode || sessionStorage.getItem("admin_passcode") || "";
    if (!authCode) return;
    try {
      const res = await fetch(`/api/admin/artists/${id}`, {
        method: "POST",
        headers: {
          "x-admin-passcode": authCode,
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`코드가 생성되었습니다: ${data.claimCode}`);
        await fetchArtists();
      } else {
        alert(data.error || "코드 생성에 실패했습니다.");
      }
    } catch (e) {
      alert("서버 연결에 실패했습니다.");
    }
  };

  const handleOpenDeleteConfirm = (id: string, name: string) => {
    setDeletingId(id);
    setDeletingName(name);
  };

  const handleDeleteSubmit = async () => {
    if (!deletingId || !passcode) return;
    setIsDeleting(true);

    try {
      // 1. Delete artist from database
      const delRes = await fetch(`/api/admin/artists/${deletingId}`, {
        method: "DELETE",
        headers: {
          "x-admin-passcode": passcode,
        },
      });

      const delData = await delRes.json();
      if (!delRes.ok || !delData.success) {
        alert(delData.error || "아티스트 삭제에 실패했습니다.");
        setIsDeleting(false);
        return;
      }



      alert("아티스트가 삭제되었습니다.");
      setDeletingId(null);
      setDeletingName("");
      
      // Refresh the artist listing
      await fetchArtists();
    } catch (err) {
      alert("삭제 처리 중 네트워크 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter listed artists
  const filteredArtists = artists.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      (a.company || "").toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div style={{ padding: "80px 0" }}>
        <LoadingSpinner message="아티스트 목록을 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px 0" }}>
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "30px", borderBottom: "1.5px solid var(--border)", paddingBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--navy)" }}>아티스트 관리 (Artists CMS)</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }}>데이터베이스에 등록된 아티스트 레코드를 모니터링하고 삭제 관리합니다.</p>
        </div>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink-faint)" }}>
          총 {filteredArtists.length}개 아티스트
        </span>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="이름, 소속 단체, 혹은 슬러그 ID로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: "1.5px solid var(--border)",
            borderRadius: "10px",
            fontSize: "0.9rem",
            outline: "none",
          }}
        />
      </div>

      {/* Artists Table */}
      <div style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid var(--border)" }}>
              <th style={{ padding: "14px 16px", fontWeight: 800, color: "var(--navy)" }}>프로필</th>
              <th style={{ padding: "14px 16px", fontWeight: 800, color: "var(--navy)" }}>이름 / 영문명</th>
              <th style={{ padding: "14px 16px", fontWeight: 800, color: "var(--navy)" }}>소속 / 단체</th>
              <th style={{ padding: "14px 16px", fontWeight: 800, color: "var(--navy)" }}>분야 / 슬러그 ID</th>
              {showClaimCodes && <th style={{ padding: "14px 16px", fontWeight: 800, color: "var(--navy)" }}>로그인 코드</th>}
              <th style={{ padding: "14px 16px", fontWeight: 800, color: "var(--navy)" }}>상태</th>
              <th style={{ padding: "14px 16px", fontWeight: 800, color: "var(--navy)", textAlign: "right" }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredArtists.length === 0 ? (
              <tr>
                <td colSpan={showClaimCodes ? 7 : 6} style={{ padding: "40px", textAlign: "center", color: "var(--ink-muted)" }}>
                  조건에 맞는 아티스트가 없습니다.
                </td>
              </tr>
            ) : (
              filteredArtists.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}>
                  
                  {/* Photo */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: `url(${a.profileImage || "/images/placeholders/cake-placeholder.png"}) center/cover no-repeat`,
                      border: "1px solid var(--border)",
                    }} />
                  </td>

                  {/* Name / Name EN */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 800, color: "var(--navy)" }}>{a.name}</div>
                    {a.name_en && <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "2px" }}>{a.name_en}</div>}
                  </td>

                  {/* Company */}
                  <td style={{ padding: "12px 16px", color: "var(--ink)" }}>
                    {a.company || "-"}
                  </td>

                  {/* Field / Slug */}
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-dark)" }}>
                      {a.field ? (FIELD_LABELS[a.field] ?? a.field) : "미정"}
                    </span>
                    <div style={{ fontSize: "0.74rem", color: "var(--ink-faint)", marginTop: "2px", fontFamily: "monospace" }}>{a.id}</div>
                  </td>

                  {/* Login Code Column */}
                  {showClaimCodes && (
                    <td style={{ padding: "12px 16px" }}>
                      {a.claim_code ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <code style={{ background: "#F1F5F9", padding: "4px 8px", borderRadius: "6px", fontSize: "0.8rem", color: "var(--navy)", fontWeight: 700 }}>
                            {a.claim_code}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(a.claim_code || "");
                              alert("코드가 복사되었습니다.");
                            }}
                            style={{
                              padding: "3px 6px", fontSize: "0.7rem", background: "var(--border)", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 700
                            }}
                          >
                            복사
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerateClaimCode(a.id)}
                          style={{
                            padding: "4px 10px", fontSize: "0.74rem", background: "var(--navy)", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700
                          }}
                        >
                          코드 생성
                        </button>
                      )}
                    </td>
                  )}

                  {/* Status Badge */}
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      fontSize: "0.72rem",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontWeight: 700,
                      background: a.verified ? "#E0F0E8" : "#FEF3DC",
                      color: a.verified ? "var(--verified)" : "var(--needs-review)",
                    }}>
                      {a.verified ? "검증됨" : "검토 필요"}
                    </span>
                  </td>

                  {/* Delete Button */}
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => handleOpenDeleteConfirm(a.recordId || "", a.name)}
                      style={{
                        padding: "5px 10px",
                        background: "transparent",
                        color: "#EF4444",
                        border: "1.2px solid #FCA5A5",
                        borderRadius: "6px",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#FEF2F2";
                        e.currentTarget.style.borderColor = "#EF4444";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderColor = "#FCA5A5";
                      }}
                    >
                      삭제
                    </button>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Custom Confirm Modal */}
      {deletingId && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.4)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff", border: "1.5px solid var(--border)", borderRadius: "16px",
            padding: "28px", maxWidth: "400px", width: "90%", textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>⚠️</div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", marginBottom: "12px" }}>
              정말 이 아티스트를 삭제할까요?
            </h3>
            <p style={{ fontSize: "0.86rem", color: "var(--ink-muted)", lineHeight: 1.6, marginBottom: "24px" }}>
              선택한 아티스트 <strong>"{deletingName}"</strong> 레코드가 데이터베이스에서 완전히 삭제되며, 이 작업은 되돌릴 수 없습니다. 연동된 공연 정보의 링크도 모두 제거됩니다.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                disabled={isDeleting}
                onClick={() => {
                  setDeletingId(null);
                  setDeletingName("");
                }}
                style={{
                  flex: 1, padding: "12px", background: "transparent", color: "var(--ink-muted)",
                  border: "1.5px solid var(--border-dark)", borderRadius: "10px",
                  fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit"
                }}
              >
                취소
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteSubmit}
                style={{
                  flex: 1, padding: "12px", background: "#EF4444", color: "#fff",
                  border: "none", borderRadius: "10px",
                  fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                }}
              >
                {isDeleting ? "삭제 중..." : "확인 및 삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
