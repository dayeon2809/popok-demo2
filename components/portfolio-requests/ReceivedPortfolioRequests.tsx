"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PORTFOLIO_REQUEST_STATUS_LABEL } from "@/lib/portfolioRequests";

type RequestType = "company" | "artist";

interface ReceivedRequest {
  type: RequestType;
  id: string;
  message: string | null;
  status: string;
  created_at: string;
  from: {
    id: string;
    name: string;
    slug: string | null;
    role: string | null;
    profile_image_url: string | null;
  } | null;
  via: { id: string; name: string; profile_image_url: string | null } | null; // company, for type "company"
}

const TYPE_LABEL: Record<RequestType, string> = { company: "단체 요청", artist: "아티스트 요청" };
const FILTERS: { key: "all" | RequestType; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "artist", label: "아티스트" },
  { key: "company", label: "단체" },
];

// "받은 포퐄" / 단체 요청함 — merges company_portfolio_requests (companies the
// viewer currently reps) and artist_portfolio_requests (sent directly to the
// viewer's artist profile). Opening this tab does NOT mark anything viewed —
// only opening/clicking an individual card does (see handleOpen).
export default function ReceivedPortfolioRequests({ onToast }: { onToast: (msg: string) => void }) {
  const [requests, setRequests] = useState<ReceivedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | RequestType>("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/portfolio-requests/received");
      const data = await res.json();
      if (data.success) setRequests(data.data || []);
    } catch {
      // fail soft — empty list, no page-breaking error
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

  // Marks a request viewed the first time its card is opened/clicked or
  // "포퐄 보기" is followed — never as a side effect of just fetching the list.
  const markViewedIfPending = (req: ReceivedRequest) => {
    if (req.status !== "pending") return;
    setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, status: "viewed" } : r)));
    fetch(`/api/portfolio-requests/${req.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: req.type, status: "viewed" }),
    }).catch(() => {});
  };

  const handleDecision = async (req: ReceivedRequest, status: "accepted" | "declined") => {
    if (actingId) return;
    setActingId(req.id);
    try {
      const res = await fetch(`/api/portfolio-requests/${req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: req.type, status }),
      });
      const data = await res.json();
      if (!data.success) {
        onToast(data.error || "처리에 실패했습니다.");
        return;
      }
      setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, status } : r)));
      onToast(status === "accepted" ? "요청을 수락했습니다." : "요청을 거절했습니다.");
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
          아직 받은 포퐄이 없습니다.
        </div>
      ) : (
        filtered.map((r) => {
          const portfolioLink = r.from ? `/artists/${r.from.slug || r.from.id}` : "#";
          const decided = r.status === "accepted" || r.status === "declined";
          return (
            <div
              key={`${r.type}_${r.id}`}
              onClick={() => markViewedIfPending(r)}
              style={{ background: "#FFFFFF", border: "1.5px solid var(--border)", borderRadius: "14px", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px", cursor: r.status === "pending" ? "pointer" : "default" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {r.from?.profile_image_url ? (
                    <img src={r.from.profile_image_url} alt="" style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
                  ) : (
                    <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#FAF9F5", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>🎭</div>
                  )}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.92rem", fontWeight: 900, color: "var(--navy)" }}>{r.from?.name || "알 수 없는 아티스트"}</span>
                      <span style={{ fontSize: "0.62rem", fontWeight: 800, color: "var(--ink-muted)", background: "var(--bg-warm)", padding: "2px 8px", borderRadius: "8px" }}>
                        {TYPE_LABEL[r.type]}
                      </span>
                    </div>
                    {r.from?.role && <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>{r.from.role}</div>}
                    {r.via && <div style={{ fontSize: "0.7rem", color: "var(--ink-faint)", marginTop: "2px" }}>보낸 곳: {r.via.name}</div>}
                  </div>
                </div>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: decided ? "var(--navy)" : "var(--ink-muted)", background: "var(--bg-warm)", padding: "4px 10px", borderRadius: "10px", whiteSpace: "nowrap" }}>
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
                  {new Date(r.created_at).toLocaleDateString("ko-KR")}
                </span>
                <div style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                  <a
                    href={portfolioLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markViewedIfPending(r)}
                    style={{ padding: "7px 14px", fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)", border: "1px solid var(--border)", borderRadius: "6px", textDecoration: "none" }}
                  >
                    포퐄 보기 ↗
                  </a>
                  {!decided && (
                    <>
                      <button
                        type="button"
                        disabled={actingId === r.id}
                        onClick={() => handleDecision(r, "accepted")}
                        style={{ padding: "7px 14px", fontSize: "0.78rem", fontWeight: 800, color: "#FFFFFF", background: "var(--navy)", border: "none", borderRadius: "6px", cursor: "pointer" }}
                      >
                        수락
                      </button>
                      <button
                        type="button"
                        disabled={actingId === r.id}
                        onClick={() => handleDecision(r, "declined")}
                        style={{ padding: "7px 14px", fontSize: "0.78rem", fontWeight: 800, color: "#991B1B", background: "#FFFFFF", border: "1px solid #FCA5A5", borderRadius: "6px", cursor: "pointer" }}
                      >
                        거절
                      </button>
                    </>
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
