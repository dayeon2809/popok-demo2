"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMobileBodyScrollLock } from "@/hooks/useMobileBodyScrollLock";
import { analytics } from "@/lib/analytics";
import type { DiscoveryMode, DiscoveryResponse, DiscoveryResultView } from "@/lib/aiDiscovery";

const FALLBACK_IMAGE = "/images/placeholders/cake-placeholder.png";
const MODE_TITLE: Record<DiscoveryMode, string> = {
  discover: "AI 아티스트 탐색",
  similar: "비슷한 작업 찾기",
  collaborator: "협업할 만한 사람 찾기",
};

interface KeywordOption {
  id: string;
  label: string;
  terms: string[];
}
interface KeywordGroup {
  id: string;
  label: string;
  options: KeywordOption[];
}
const ARTIST_KEYWORDS: KeywordGroup[] = [
  { id: "mood", label: "분위기", options: [
    { id: "experimental", label: "실험적", terms: ["실험", "experimental", "다원", "융복합"] },
    { id: "minimal", label: "미니멀", terms: ["미니멀", "minimal", "절제", "고요"] },
    { id: "powerful", label: "강렬한", terms: ["강렬", "에너지", "역동", "powerful"] },
  ]},
  { id: "method", label: "작업 방식", options: [
    { id: "audience", label: "관객 참여", terms: ["관객 참여", "관객참여", "인터랙티브", "참여형"] },
    { id: "body-centered", label: "신체 중심", terms: ["몸", "신체", "움직임", "안무"] },
    { id: "technology", label: "기술 결합", terms: ["기술", "디지털", "미디어", "technology", "ai"] },
  ]},
  { id: "genre", label: "장르", options: [
    { id: "contemporary", label: "현대무용", terms: ["현대무용", "현대 무용", "contemporary"] },
    { id: "ballet", label: "발레", terms: ["발레", "ballet"] },
    { id: "performance", label: "퍼포먼스", terms: ["퍼포먼스", "performance", "다원예술"] },
  ]},
  { id: "subject", label: "주제", options: [
    { id: "body", label: "몸", terms: ["몸", "신체"] },
    { id: "ai", label: "AI", terms: ["ai", "인공지능", "기술"] },
    { id: "memory", label: "기억", terms: ["기억", "회상", "역사"] },
    { id: "society", label: "사회", terms: ["사회", "공동체", "정치", "연대"] },
  ]},
];

interface FetchState {
  loading: boolean;
  error: string | null;
  response: DiscoveryResponse | null;
}

async function fetchDiscovery(query: string, contextArtistId: string | null, mode: DiscoveryMode): Promise<
  { ok: true; data: DiscoveryResponse } | { ok: false; error: string }
> {
  try {
    const res = await fetch("/api/ai/discover-artists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, contextArtistId, limit: 6, mode }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return { ok: false, error: json?.error || "지금은 추천 결과를 가져오지 못했어요." };
    }
    return { ok: true, data: json.data as DiscoveryResponse };
  } catch {
    return { ok: false, error: "네트워크 오류로 결과를 가져오지 못했어요." };
  }
}

interface ResultCardProps {
  result: DiscoveryResultView;
  position: number;
  onFindSimilar: (result: DiscoveryResultView) => void;
}

function ResultCard({ result, position, onFindSimilar }: ResultCardProps) {
  const [failed, setFailed] = useState(false);
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", background: "#FFFFFF" }}>
      <Link
        href={result.href}
        onClick={() => analytics.aiDiscoveryResultClicked(result.artistId, position)}
        style={{ textDecoration: "none", display: "block" }}
      >
        <div style={{ width: "100%", aspectRatio: "4 / 3", background: "#EAE6DD", overflow: "hidden" }}>
          {result.image && (
            <img
              src={failed ? FALLBACK_IMAGE : result.image}
              alt={result.name}
              loading="lazy"
              onError={() => setFailed(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </div>
        <div style={{ padding: "12px 14px 4px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "0.92rem", fontWeight: 850, color: "var(--navy)" }}>{result.name}</span>
            {result.genre && (
              <span style={{ fontSize: "0.68rem", color: "var(--accent-dark)", fontWeight: 700 }}>{result.genre}</span>
            )}
          </div>
          {result.reason && (
            <p style={{
              fontSize: "0.8rem", color: "var(--ink-muted)", margin: "4px 0 0", lineHeight: 1.5,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {result.reason}
            </p>
          )}
        </div>
      </Link>
      <div style={{ padding: "8px 14px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {result.matchedKeywords.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {result.matchedKeywords.map((kw) => (
              <span
                key={kw}
                style={{
                  fontSize: "0.65rem", fontWeight: 700, color: "var(--accent-dark)",
                  background: "var(--accent-light)", padding: "2px 8px", borderRadius: "999px",
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => onFindSimilar(result)}
          style={{
            alignSelf: "flex-start", fontSize: "0.75rem", fontWeight: 800, color: "var(--navy)",
            background: "none", border: "1px solid var(--border-dark)", borderRadius: "999px",
            padding: "5px 12px", cursor: "pointer",
          }}
        >
          비슷한 작업 다시 찾기
        </button>
      </div>
    </div>
  );
}

interface AiDiscoveryPanelProps {
  mode: DiscoveryMode;
  contextArtistId?: string | null;
  contextArtistName?: string | null;
  defaultQuery?: string;
  /** Runs the search immediately with defaultQuery instead of waiting for user input. */
  autoSearch?: boolean;
  placeholder?: string;
  suggestions?: string[];
  onClose: () => void;
}

export default function AiDiscoveryPanel({
  mode,
  contextArtistId = null,
  contextArtistName = null,
  defaultQuery = "",
  autoSearch = false,
  placeholder = "관객 참여형 작업을 하는 안무가, 영상 협업 경험이 있는 무용수...",
  suggestions = [
    "AI와 신체를 결합하는 작업을 하는 아티스트",
    "어두운 분위기의 현대무용 작업",
    "미니멀한 무대와 신체 중심의 작업",
  ],
  onClose,
}: AiDiscoveryPanelProps) {
  useMobileBodyScrollLock();
  const [query, setQuery] = useState(defaultQuery);
  const [activeMode, setActiveMode] = useState<DiscoveryMode>(mode);
  const [activeContextId, setActiveContextId] = useState<string | null>(contextArtistId);
  const [state, setState] = useState<FetchState>({ loading: false, error: null, response: null });
  const openedTracked = useRef(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  // Initialize selected keywords if defaultQuery is loaded
  useEffect(() => {
    if (defaultQuery) {
      const allLabels = ARTIST_KEYWORDS.flatMap((g) => g.options.map((o) => o.label));
      const matched = allLabels.filter((label) => defaultQuery.includes(label));
      setSelectedKeywords(matched);
    }
  }, [defaultQuery]);

  const handleKeywordToggle = (label: string) => {
    setSelectedKeywords((prev) => {
      const exists = prev.includes(label);
      let updated: string[];
      if (exists) {
        updated = prev.filter((k) => k !== label);
      } else {
        updated = [...prev, label];
      }
      setQuery(updated.join(", "));
      return updated;
    });
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    const allLabels = ARTIST_KEYWORDS.flatMap((g) => g.options.map((o) => o.label));
    const matched = allLabels.filter((label) => val.includes(label));
    setSelectedKeywords(matched);
  };

  useEffect(() => {
    if (!openedTracked.current) {
      analytics.aiDiscoveryOpened(mode === "discover" ? "home" : "artist_page");
      openedTracked.current = true;
    }
  }, [mode]);

  const runSearch = async (q: string, ctxId: string | null, m: DiscoveryMode) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setState({ loading: true, error: null, response: null });
    analytics.aiDiscoverySearched(m, trimmed);

    const result = await fetchDiscovery(trimmed, ctxId, m);
    if (!result.ok) {
      setState({ loading: false, error: result.error, response: null });
      analytics.aiDiscoveryFailed(m);
      return;
    }
    setState({ loading: false, error: null, response: result.data });
    if (result.data.results.length === 0) analytics.aiDiscoveryNoResults(m);
  };

  useEffect(() => {
    if (autoSearch && defaultQuery.trim()) {
      runSearch(defaultQuery, contextArtistId, mode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFindSimilar = (result: DiscoveryResultView) => {
    analytics.aiSimilarArtistClicked(result.artistId);
    setActiveMode("similar");
    setActiveContextId(result.artistId);
    setQuery(`${result.name}와(과) 비슷한 작업`);
    runSearch("이 아티스트와 비슷한 작업", result.artistId, "similar");
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(23, 20, 17, 0.55)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "24px 16px", overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "760px", background: "#FFFFFF", borderRadius: "18px",
          border: "1px solid var(--border)", boxShadow: "0 24px 60px rgba(23,20,17,0.25)",
          margin: "20px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 0" }}>
          <div>
            <span style={{
              display: "inline-block", fontSize: "0.62rem", fontWeight: 850, color: "var(--accent-dark)",
              background: "var(--accent-light)", padding: "2px 8px", borderRadius: "999px", letterSpacing: "0.04em", marginBottom: "6px",
            }}>
              AI DISCOVERY
            </span>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--navy)", margin: 0 }}>
              {MODE_TITLE[activeMode]}
              {contextArtistName ? ` · ${contextArtistName}` : ""}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{ background: "none", border: "none", fontSize: "1.4rem", color: "var(--ink-muted)", cursor: "pointer", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query, activeContextId, activeMode);
          }}
          className="discovery-search-form"
          style={{ display: "flex", gap: "8px", padding: "16px 20px" }}
        >
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={placeholder}
            style={{
              flex: 1, border: "1.5px solid var(--border-dark)", borderRadius: "999px",
              padding: "10px 16px", fontSize: "0.88rem", fontFamily: "inherit", color: "var(--navy)", outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={state.loading}
            style={{
              border: "none", background: "var(--navy)", color: "#FFFFFF", borderRadius: "999px",
              padding: "10px 20px", fontSize: "0.85rem", fontWeight: 800, cursor: state.loading ? "wait" : "pointer",
              flexShrink: 0,
            }}
          >
            {state.loading ? "찾는 중..." : "탐색"}
          </button>
        </form>

        <div style={{ padding: "0 20px 24px" }}>
          {state.loading && (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-muted)", fontSize: "0.85rem" }}>
              POPOK에 등록된 아티스트와 작업을 살펴보고 있어요...
            </div>
          )}

          {!state.loading && state.error && (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginBottom: "12px" }}>{state.error}</p>
              <button
                type="button"
                onClick={() => runSearch(query, activeContextId, activeMode)}
                style={{
                  border: "1px solid var(--navy)", background: "none", color: "var(--navy)",
                  borderRadius: "999px", padding: "8px 18px", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer",
                }}
              >
                다시 시도
              </button>
            </div>
          )}

          {!state.loading && !state.error && state.response && (
            <>
              <p style={{ fontSize: "0.88rem", color: "var(--navy)", fontWeight: 700, margin: "4px 0 16px" }}>
                {state.response.summary}
              </p>

              {state.response.results.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px" }}>
                  {state.response.results.map((result, idx) => (
                    <ResultCard key={result.artistId} result={result} position={idx} onFindSimilar={handleFindSimilar} />
                  ))}
                </div>
              ) : null}

              {state.response.suggestedQueries.length > 0 && (
                <div style={{ marginTop: "18px" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-faint)", display: "block", marginBottom: "8px" }}>
                    이렇게도 찾아보세요
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {state.response.suggestedQueries.map((sq) => (
                      <button
                        key={sq}
                        type="button"
                        onClick={() => {
                          setQuery(sq);
                          setActiveMode("discover");
                          setActiveContextId(null);
                          runSearch(sq, null, "discover");
                        }}
                        style={{
                          fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", background: "#FAF9F5",
                          border: "1px solid var(--border)", borderRadius: "999px", padding: "6px 14px", cursor: "pointer",
                        }}
                      >
                        {sq}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!state.loading && !state.error && !state.response && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "4px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                키워드로 탐색하기
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {ARTIST_KEYWORDS.flatMap((group) => group.options).map((opt) => {
                  const isSelected = selectedKeywords.includes(opt.label);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleKeywordToggle(opt.label)}
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "var(--navy)",
                        background: isSelected ? "var(--accent)" : "#FAF9F5",
                        border: isSelected ? "1.5px solid var(--accent-dark)" : "1px solid var(--border)",
                        borderRadius: "999px",
                        padding: "6px 14px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
