"use client";

import { useEffect, useState } from "react";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";

interface Stats {
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  publishedArtists: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        if (res.ok && data.success) {
          setStats(data.stats);
        } else {
          setStatsError(data.error || "통계 데이터를 불러오는 데 실패했습니다.");
        }
      } catch {
        setStatsError("네트워크 오류가 발생했습니다.");
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "30px", borderBottom: "1.5px solid var(--border)", paddingBottom: "16px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--navy)" }}>관리자 대시보드</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }}>POPOK 플랫폼의 주요 상태 통계입니다.</p>
      </div>

      {statsLoading && <div style={{ padding: "40px 0" }}><LoadingSpinner message="통계 정보를 조회하는 중..." /></div>}
      {statsError && <div style={{ padding: "20px 0" }}><ErrorMessage message={statsError} /></div>}

      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
          <StatCard label="대기 중인 신청" value={stats.pendingSubmissions} color="#D97706" href="/admin/submissions" />
          <StatCard label="승인 완료 신청" value={stats.approvedSubmissions} color="var(--verified)" />
          <StatCard label="반려 처리 신청" value={stats.rejectedSubmissions} color="#DC2626" />
          <StatCard label="공개 아티스트" value={stats.publishedArtists} color="var(--navy)" />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, href }: { label: string; value: number; color: string; href?: string }) {
  return (
    <div style={cardStyle}>
      <span style={{ fontSize: "0.8rem", fontWeight: 700, color }}>{label}</span>
      <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "#1F2937", margin: "10px 0 4px" }}>{value}</div>
      {href && <a href={href} style={{ fontSize: "0.78rem", color: "var(--navy)", fontWeight: 700, textDecoration: "none" }}>목록 보기 →</a>}
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