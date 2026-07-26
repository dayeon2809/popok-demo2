"use client";

import { useState } from "react";

interface OrganizedWork {
  title: string;
  shortDescription: string;
  role: string;
  genre: string;
  keywords: string[];
  caption: string;
}

export interface AiOrganizeWorkInput {
  title?: string;
  description?: string;
  role?: string;
  year?: string;
  fileName?: string;
  artistGenre?: string;
  artistBioShort?: string;
}

interface AiOrganizeWorkButtonProps {
  input: AiOrganizeWorkInput;
  /** Applies the suggestion's title/description/role onto the work — review-first, never automatic. */
  onApply: (suggestion: { title: string; description: string; role: string }) => void;
}

// "AI로 정리하기" — feature/home-feed-v2's upload-first dashboard. Calls
// /api/ai/organize-work (which reuses the project's existing OpenAI client)
// and shows the suggestion for the uploader to review before anything is
// applied to the actual work fields — nothing here saves by itself.
export default function AiOrganizeWorkButton({ input, onApply }: AiOrganizeWorkButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<OrganizedWork | null>(null);

  const runOrganize = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/organize-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error || "지금은 정리하지 못했어요.");
        setSuggestion(null);
      } else {
        setSuggestion(json.data);
      }
    } catch {
      setError("네트워크 오류로 정리하지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (!suggestion) runOrganize();
  };

  if (!open) {
    return (
      <div>
        <button
          type="button"
          onClick={handleOpen}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            border: "1px solid var(--border-dark)", background: "#FFFFFF", color: "var(--navy)",
            borderRadius: "999px", padding: "6px 14px", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer",
          }}
        >
          ✨ 포퐄 AI로 작품 정리하기
        </button>
        <p style={{ fontSize: "0.68rem", color: "var(--ink-faint)", margin: "4px 0 0" }}>
          연도, 역할, 설명을 초안으로 만들어드려요.
        </p>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "14px", background: "#FAF9F5", marginTop: "8px" }}>
      {loading && (
        <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", margin: 0 }}>POPOK AI가 정리하고 있어요...</p>
      )}

      {!loading && error && (
        <div>
          <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", margin: "0 0 8px" }}>{error}</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={runOrganize} style={smallBtnStyle}>다시 시도</button>
            <button type="button" onClick={() => setOpen(false)} style={smallBtnStyle}>닫기</button>
          </div>
        </div>
      )}

      {!loading && !error && suggestion && (
        <div>
          <div style={{ fontSize: "0.8rem", color: "var(--navy)", lineHeight: 1.6, marginBottom: "10px" }}>
            {suggestion.title && <div><strong>제목:</strong> {suggestion.title}</div>}
            {suggestion.shortDescription && <div><strong>소개:</strong> {suggestion.shortDescription}</div>}
            {suggestion.role && <div><strong>역할:</strong> {suggestion.role}</div>}
            {suggestion.keywords.length > 0 && (
              <div style={{ marginTop: "6px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {suggestion.keywords.map((kw) => (
                  <span key={kw} style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--accent-dark)", background: "var(--accent-light)", padding: "2px 8px", borderRadius: "999px" }}>
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                onApply({
                  title: suggestion.title,
                  description: suggestion.shortDescription,
                  role: suggestion.role,
                });
                setOpen(false);
              }}
              className="btn-lime"
              style={{ ...smallBtnStyle, border: "none" }}
            >
              전체 적용
            </button>
            <button type="button" onClick={runOrganize} style={smallBtnStyle}>다시 생성</button>
            <button type="button" onClick={() => setOpen(false)} style={smallBtnStyle}>건너뛰기</button>
          </div>
        </div>
      )}
    </div>
  );
}

const smallBtnStyle: React.CSSProperties = {
  border: "1px solid var(--border-dark)", background: "#FFFFFF", color: "var(--navy)",
  borderRadius: "999px", padding: "6px 14px", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer",
};
