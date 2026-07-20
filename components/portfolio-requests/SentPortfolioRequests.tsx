"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PORTFOLIO_REQUEST_STATUS_LABEL } from "@/lib/portfolioRequests";

type RequestType = "company" | "artist";

interface SentRequest {
  type: RequestType;
  id: string;
  message: string | null;
  status: string;
  created_at: string;
  to:
    | { id: string; name: string; slug: string | null; profile_image_url: string | null; role?: string | null }
    | null;
}

const TYPE_LABEL: Record<RequestType, string> = { company: "단체 요청", artist: "아티스트 요청" };
const FILTERS: { key: "all" | RequestType; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "artist", label: "아티스트" },
  { key: "company", label: "단체" },
];

export default function SentPortfolioRequests({ onToast }: { onToast: (msg: string) => void }) {
  const [requests, setRequests] = useState<SentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | RequestType>("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/portfolio-requests/sent");
      const data = await res.json();
      if (data.success) setRequests(data.data || []);
    } catch {
      // fail soft
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? requests : requests.filter((r) => r.type === filter)),
    [requests, filter]
  );

  const handleWithdraw = async (r: SentRequest) => {
    if (actingId) return;
    if (!confirm("포퐄 요청을 취소하시겠습니까?")) return;
    setActingId(r.id);
    try {
      const res = await fetch(`/api/portfolio-requests/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: r.type, status: "withdrawn" }),
      });
      const data = await res.json();
      if (!data.success) {
        onToast(data.error || "취소에 실패했습니다.");
        return;
      }
      setRequests((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "withdrawn" } : x)));
      onToast("요청을 취소했습니다.");
    } catch {
      onToast("서버 통신 오류가 발생했습니다.");
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-muted)", fontSize: "0.85rem" }}>불러오는 중...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            style={{
              padding: "6px 14px",
              borderRadius: "16px",
              fontSize: "0.78rem",
              fontWeight: 800,
              border: filter === f.key ? "1.5px solid var(--navy)" : "1px solid var(--border)",
              background: filter === f.key ? "var(--navy)" : "#FFFFFF",
              color: filter === f.key ? "#FFFFFF" : "var(--navy)",
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: "60px 24px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "16px", background: "#FFFFFF", color: "var(--ink-muted)", fontSize: "0.88rem" }}>
          아직 보낸 포퐄이 없습니다.
        </div>
      ) : (
        filtered.map((r) => {
          const canWithdraw = r.status === "pending" || r.status === "viewed";
          const portfolioLink = r.type === "artist" && r.to ? `/artists/${r.to.slug || r.to.id}` : r.type === "company" && r.to ? `/companies/${r.to.slug || r.to.id}` : "#";
          return (
            <div key={`${r.type}_${r.id}`} style={{ background: "#FFFFFF", border: "1.5px solid var(--border)", borderRadius: "14px", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {r.to?.profile_image_url ? (
                    <img src={r.to.profile_image_url} alt="" style={{ width: "44px", height: "44px", borderRadius: r.type === "artist" ? "50%" : "8px", objectFit: "cover", border: "1px solid var(--border)" }} />
                  ) : (
                    <div style={{ width: "44px", height: "44px", borderRadius: r.type === "artist" ? "50%" : "8px", background: "#FAF9F5", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                      {r.type === "artist" ? "🎭" : "🏛️"}
                    </div>
                  )}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.92rem", fontWeight: 900, color: "var(--navy)" }}>{r.to?.name || "알 수 없음"}</span>
                      <span style={{ fontSize: "0.62rem", fontWeight: 800, color: "var(--ink-muted)", background: "var(--bg-warm)", padding: "2px 8px", borderRadius: "8px" }}>
                        {TYPE_LABEL[r.type]}
                      </span>
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: r.status === "declined" || r.status === "withdrawn" ? "var(--ink-faint)" : "var(--navy)", background: "var(--bg-warm)", padding: "4px 10px", borderRadius: "10px", whiteSpace: "nowrap" }}>
                  {PORTFOLIO_REQUEST_STATUS_LABEL[r.status] || r.status}
                </span>
              </div>

              {r.message && (
                <p style={{ fontSize: "0.85rem", color: "var(--navy)", lineHeight: 1.5, margin: 0, background: "#FAF9F5", padding: "12px 14px", borderRadius: "8px", whiteSpace: "pre-line" }}>
                  {r.message}
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>
                  {new Date(r.created_at).toLocaleDateString("ko-KR")} 전송
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {r.to && (
                    <a
                      href={portfolioLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: "7px 14px", fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)", border: "1px solid var(--border)", borderRadius: "6px", textDecoration: "none" }}
                    >
                      {r.type === "artist" ? "포퐄 보기 ↗" : "단체 페이지 보기 ↗"}
                    </a>
                  )}
                  {canWithdraw && (
                    <button
                      type="button"
                      disabled={actingId === r.id}
                      onClick={() => handleWithdraw(r)}
                      style={{ padding: "7px 14px", fontSize: "0.78rem", fontWeight: 800, color: "#991B1B", background: "#FFFFFF", border: "1px solid #FCA5A5", borderRadius: "6px", cursor: "pointer" }}
                    >
                      요청 취소
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
