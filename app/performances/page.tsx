"use client";

import Link from "next/link";
import { usePerformances } from "@/lib/api";
import PerformanceCard from "@/components/PerformanceCard";
import { LoadingSpinner, ErrorMessage, EmptyState } from "@/components/ui/States";

export default function PerformancesPage() {
  const { performances, loading, error } = usePerformances();

  return (
    <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "48px 32px" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <p className="mono" style={{ marginBottom: "6px" }}>Performance Discovery</p>
        <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--navy)", marginBottom: "8px" }}>
          공연 탐색
        </h1>
        <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem", fontWeight: 500 }}>
          {loading ? "공연을 불러오는 중..." : `${performances.length}개의 공연을 발견했습니다.`}
        </p>
      </div>

      {/* States */}
      {loading && <LoadingSpinner message="최신 공연을 불러오는 중..." />}
      {error && !loading && <ErrorMessage message={error} />}
      {!loading && !error && performances.length === 0 && (
        <EmptyState message="등록된 공연이 없습니다." />
      )}

      {/* Grid Layout */}
      {!loading && !error && performances.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "24px",
          marginBottom: "44px"
        }}>
          {performances.map((p) => (
            <Link
              href={`/performances/${p.id}`}
              key={p.id}
              style={{ textDecoration: "none", color: "inherit", display: "flex" }}
            >
              <PerformanceCard performance={p} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
