"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";

interface Stats {
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  publishedArtists: number;
  lastSync: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Stats State
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem("admin_passcode");
    if (cached) {
      setIsAuthenticated(true);
      fetchStats(cached);
    }
  }, []);

  const fetchStats = async (code: string) => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-passcode": code }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
      } else {
        setStatsError(data.error || "통계 데이터를 불러오는 데 실패했습니다.");
        if (res.status === 401) {
          sessionStorage.removeItem("admin_passcode");
          setIsAuthenticated(false);
        }
      }
    } catch (err) {
      setStatsError("네트워크 오류가 발생했습니다.");
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem("admin_passcode", passcode);
        setIsAuthenticated(true);
        fetchStats(passcode);
      } else {
        setError(data.error || "패스코드가 올바르지 않습니다.");
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ── 1. Render Passcode Gate (If NOT Logged In) ───────────────────
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "#fafafa"
      }}>
        <div style={{
          maxWidth: "400px",
          width: "100%",
          background: "#fff",
          borderRadius: "16px",
          padding: "36px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          border: "1.5px solid var(--border)",
        }}>
          <h1 style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "var(--navy)",
            textAlign: "center",
            marginBottom: "10px"
          }}>
            POPOK Admin
          </h1>
          <p style={{
            fontSize: "0.85rem",
            color: "var(--ink-muted)",
            textAlign: "center",
            marginBottom: "28px"
          }}>
            관리자 비밀번호를 입력해주세요.
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{
                display: "block",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--ink-muted)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}>
                관리자 패스코드
              </label>
              <input
                type="password"
                placeholder="••••"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1.5px solid var(--border)",
                  fontSize: "1.1rem",
                  letterSpacing: "0.3em",
                  textAlign: "center",
                  fontFamily: "inherit",
                }}
                autoFocus
                disabled={loading}
              />
            </div>

            {error && (
              <p style={{ fontSize: "0.8rem", color: "#B91C1C", margin: 0, textAlign: "center" }}>
                ⚠️ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !passcode}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--navy)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 700,
                cursor: (loading || !passcode) ? "not-allowed" : "pointer",
                opacity: (loading || !passcode) ? 0.6 : 1,
                fontFamily: "inherit",
              }}
            >
              {loading ? "확인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── 2. Render Dashboard (If Logged In) ───────────────────────────
  return (
    <div>
      <div style={{ marginBottom: "30px", borderBottom: "1.5px solid var(--border)", paddingBottom: "16px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--navy)" }}>관리자 대시보드 (Dashboard)</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }}>POPOK 플랫폼의 주요 상태 통계입니다.</p>
      </div>

      {statsLoading && <div style={{ padding: "40px 0" }}><LoadingSpinner message="통계 정보를 조회하는 중..." /></div>}
      {statsError && <div style={{ padding: "20px 0" }}><ErrorMessage message={statsError} /></div>}

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
          {/* Card 1: Pending */}
          <div style={cardStyle}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#D97706" }}>대기 중인 신청</span>
            <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#1F2937", margin: "10px 0 4px 0" }}>
              {stats.pendingSubmissions}
            </div>
            <a href="/admin/submissions" style={{ fontSize: "0.78rem", color: "var(--navy)", fontWeight: 700, textDecoration: "none" }}>
              신청서 보러가기 →
            </a>
          </div>

          {/* Card 2: Approved */}
          <div style={cardStyle}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--verified)" }}>승인 완료 신청</span>
            <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#1F2937", margin: "10px 0 4px 0" }}>
              {stats.approvedSubmissions}
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>Airtable 복사 완료</span>
          </div>

          {/* Card 3: Rejected */}
          <div style={cardStyle}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#DC2626" }}>반려 처리 신청</span>
            <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#1F2937", margin: "10px 0 4px 0" }}>
              {stats.rejectedSubmissions}
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>상태 rejected 업데이트</span>
          </div>

          {/* Card 4: Published Artists */}
          <div style={cardStyle}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--navy)" }}>공개 안무가 (DB)</span>
            <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#1F2937", margin: "10px 0 4px 0" }}>
              {stats.publishedArtists}
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>data/artists.json 기준</span>
          </div>

          {/* Card 5: Last Sync Time */}
          <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ink-muted)" }}>최근 Airtable 동기화 시점 (Last Sync)</span>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--navy)", margin: "8px 0" }}>
              {stats.lastSync ? new Date(stats.lastSync).toLocaleString("ko-KR") : "동기화 이력이 없습니다."}
            </div>
            <a href="/admin/sync" style={{ fontSize: "0.78rem", color: "var(--navy)", fontWeight: 700, textDecoration: "none" }}>
              동기화 실행 페이지로 이동 →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid var(--border)",
  borderRadius: "12px",
  padding: "24px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.01)",
  display: "flex",
  flexDirection: "column",
};
