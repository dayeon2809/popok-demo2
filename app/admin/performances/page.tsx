"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner, ErrorMessage, EmptyState } from "@/components/ui/States";
import { usePerformances } from "@/lib/api";
import { getPerformancePosterUrl } from "@/lib/performances";

export default function AdminPerformancesPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const { performances, loading, error, refetch } = usePerformances();

  useEffect(() => {
    const cached = sessionStorage.getItem("admin_passcode");
    if (!cached) {
      router.push("/admin");
    } else {
      setPasscode(cached);
    }
  }, [router]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);

    try {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSyncResult(data);
        refetch(); // Refresh the list of performances
      } else {
        setSyncError(data.error || "동기화 도중 알 수 없는 에러가 발생했습니다.");
      }
    } catch (err) {
      setSyncError("네트워크 연결 실패로 동기화 작업을 수행할 수 없습니다.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "30px", 
        borderBottom: "1.5px solid var(--border)", 
        paddingBottom: "16px",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--navy)" }}>공연 관리 (Performances CMS)</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }}>
            Airtable Performances 테이블의 데이터를 모니터링합니다. 상세 편집은 Airtable에서 진행해주세요.
          </p>
        </div>
        
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            padding: "10px 20px",
            background: syncing ? "var(--border)" : "var(--navy)",
            color: syncing ? "var(--ink-faint)" : "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 800,
            cursor: syncing ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {syncing ? "동기화 진행 중..." : "Airtable 데이터 동기화 (Sync)"}
        </button>
      </div>

      {/* Sync Status Notifications */}
      {syncError && (
        <div style={{
          padding: "12px 16px", background: "#FEF2F2",
          border: "1px solid #FCA5A5", borderRadius: "8px",
          color: "#B91C1C", fontSize: "0.82rem", marginBottom: "20px"
        }}>
          ⚠️ <strong>동기화 실패:</strong> {syncError}
        </div>
      )}

      {syncResult && (
        <div style={{
          padding: "16px", background: "#F0FDF4",
          border: "1px solid #BBF7D0", borderRadius: "8px",
          color: "#166534", fontSize: "0.82rem", marginBottom: "20px",
          display: "flex", flexDirection: "column", gap: "4px"
        }}>
          <h4 style={{ fontWeight: 800, color: "var(--verified)" }}>✓ 동기화 완료</h4>
          <div>• <strong>저장된 아티스트 수:</strong> {syncResult.savedArtists}명</div>
          <div>• <strong>저장된 공연 수:</strong> {syncResult.savedPerformances}개</div>
        </div>
      )}

      {/* Content Rendering */}
      {loading && <LoadingSpinner message="공연 데이터를 불러오는 중..." />}
      {error && !loading && <ErrorMessage message={error} />}
      {!loading && !error && performances.length === 0 && (
        <EmptyState message="등록된 공연 정보가 없습니다. Airtable에서 공연 정보를 입력한 후 동기화를 진행해주세요." />
      )}

      {!loading && !error && performances.length > 0 && (
        <div style={{ 
          background: "#fff", 
          border: "1.5px solid var(--border)", 
          borderRadius: "12px", 
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.01)"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1.5px solid var(--border)" }}>
                  <th style={thStyle}>포스터 / 공연명</th>
                  <th style={thStyle}>주관 단체</th>
                  <th style={thStyle}>공연 장소</th>
                  <th style={thStyle}>공연 일정</th>
                  <th style={thStyle}>상태 (Status)</th>
                  <th style={thStyle}>예매 링크</th>
                </tr>
              </thead>
              <tbody>
                {performances.map((p) => {
                  const isPublished = p.status === "published";
                  const posterUrl = getPerformancePosterUrl(p);
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--border)", verticalAlign: "middle" }}>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "36px",
                            height: "48px",
                            borderRadius: "4px",
                            background: posterUrl ? `url(${posterUrl}) center/cover no-repeat` : "#F1F5F9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.8rem",
                            fontWeight: 800,
                            color: "var(--ink-faint)",
                            border: "1px solid var(--border)",
                            flexShrink: 0
                          }}>
                            {!posterUrl && p.title.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: "var(--navy)", fontSize: "0.9rem" }}>{p.title}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--ink-faint)", marginTop: "2px" }}>ID: {p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{p.company || "-"}</td>
                      <td style={tdStyle}>{p.venue || "-"}</td>
                      <td style={tdStyle}>
                        {p.startDate ? (
                          <>
                            <div>{p.startDate}</div>
                            {p.endDate && p.endDate !== p.startDate && (
                              <div style={{ color: "var(--ink-muted)", fontSize: "0.76rem", marginTop: "2px" }}>~ {p.endDate}</div>
                            )}
                          </>
                        ) : (
                          <span style={{ color: "var(--ink-faint)" }}>미정</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          background: isPublished ? "#E0F0E8" : "#FEF3DC",
                          color: isPublished ? "var(--verified)" : "var(--needs-review)",
                        }}>
                          {isPublished ? "공개 (Published)" : "임시 (Draft)"}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {p.ticketUrl ? (
                          <a 
                            href={p.ticketUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: "var(--accent-dark)", fontWeight: 700, textDecoration: "none" }}
                          >
                            바로가기 ↗
                          </a>
                        ) : (
                          <span style={{ color: "var(--ink-faint)" }}>없음</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "14px 16px",
  fontWeight: 700,
  color: "var(--ink-muted)",
  borderBottom: "1.5px solid var(--border)"
};

const tdStyle: React.CSSProperties = {
  padding: "16px",
  color: "var(--ink)",
};
