"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useArtists } from "@/lib/api";
import ArtistCard from "@/components/ArtistCard";
import { LoadingSpinner, ErrorMessage, EmptyState } from "@/components/ui/States";
import type { ArtistFilter, ArtistField, ArtistType } from "@/types";

const PAGE_SIZE = 36;

const TAG_GROUPS = [
  {
    label: "장르",
    tags: [
      { key: "field:contemporary_dance", label: "현대무용" },
      { key: "field:ballet",             label: "발레"     },
      { key: "field:korean_dance",       label: "한국무용" },
      { key: "field:interdisciplinary",  label: "다원예술" },
    ],
  },
  {
    label: "유형",
    tags: [
      { key: "type:individual",    label: "안무가"     },
      { key: "type:company",       label: "무용단"     },
      { key: "type:project_group", label: "프로젝트팀" },
    ],
  },
  {
    label: "기타",
    tags: [
      { key: "style:SNS",     label: "SNS활동"      },
      { key: "style:website", label: "웹사이트 있음" },
    ],
  },
];

function PagBtn({ children, onClick, disabled, active }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "8px 14px", border: "1.5px solid",
      borderColor: active ? "var(--accent)" : "var(--border)",
      background:  active ? "var(--accent)" : "transparent",
      color:       active ? "var(--navy)"   : "var(--ink-muted)",
      cursor: disabled ? "not-allowed" : "pointer",
      fontSize: "0.85rem", borderRadius: "8px",
      fontFamily: "inherit", fontWeight: 700, opacity: disabled ? 0.4 : 1,
    }}>{children}</button>
  );
}

export default function ArtistsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query,      setQuery]      = useState("");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [page,       setPage]       = useState(1);

  const typeFilter  = [...activeTags].find((t) => t.startsWith("type:"))?.split(":")[1] as ArtistType | undefined;
  const fieldFilter = [...activeTags].find((t) => t.startsWith("field:"))?.split(":")[1] as ArtistField | undefined;

  const filter: ArtistFilter = {
    query,
    type:  typeFilter  ?? "all",
    field: fieldFilter ?? "all",
  };

  const { artists, loading, error } = useArtists(filter);

  // style 필터는 클라이언트 사이드
  const styleFilters = [...activeTags].filter((t) => t.startsWith("style:")).map((t) => t.split(":")[1]);
  const filtered = artists.filter((a) => {
    if (styleFilters.includes("SNS")     && !a.instagram_url) return false;
    if (styleFilters.includes("website") && !a.website_url)   return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleTag = useCallback((key: string) => {
    setActiveTags((prev) => {
      const next   = new Set(prev);
      const prefix = key.split(":")[0];
      if (next.has(key)) {
        next.delete(key);
      } else {
        for (const k of next) if (k.startsWith(prefix + ":")) next.delete(k);
        next.add(key);
      }
      return next;
    });
    setPage(1);
  }, []);

  return (
    <>
      <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "48px 32px" }}>
        {/* 헤더 */}
        <div style={{ marginBottom: "32px" }}>
          <p className="mono" style={{ marginBottom: "6px" }}>Artist Database</p>
          <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--navy)", marginBottom: "6px" }}>
            아티스트
          </h1>
          <p style={{ color: "var(--ink-muted)", fontSize: "0.88rem", fontWeight: 500 }}>
            {loading ? "불러오는 중..." : `${filtered.length.toLocaleString()}명의 안무가, 무용단, 프리랜서 아티스트`}
          </p>
        </div>

        {/* 검색 + 필터 바 (스티키) */}
        <div style={{
          position: "sticky", top: "62px", zIndex: 50,
          background: "rgba(255,255,255,0.96)", backdropFilter: "blur(8px)",
          paddingTop: "14px", paddingBottom: "14px",
          borderBottom: "1.5px solid var(--border)", marginBottom: "24px",
        }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
            <input
              type="text"
              placeholder="이름, 작품명 검색..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              style={{ flex: "1 1 220px", padding: "10px 16px", minWidth: "180px" }}
            />
            {activeTags.size > 0 && (
              <button
                onClick={() => { setActiveTags(new Set()); setPage(1); }}
                style={{
                  padding: "10px 16px", border: "1.5px solid var(--border)",
                  background: "transparent", color: "var(--ink-muted)",
                  borderRadius: "10px", cursor: "pointer",
                  fontSize: "0.82rem", fontWeight: 700, fontFamily: "inherit",
                }}
              >필터 초기화</button>
            )}
          </div>

          {/* 태그 필터 */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "flex-start" }}>
            {TAG_GROUPS.map((group) => (
              <div key={group.label} style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.07em", marginRight: "2px" }}>
                  {group.label}
                </span>
                {group.tags.map((t) => {
                  const isActive = activeTags.has(t.key);
                  return (
                    <button key={t.key} onClick={() => toggleTag(t.key)} style={{
                      padding: "4px 10px", border: "1.5px solid",
                      borderColor: isActive ? "var(--accent)" : "var(--border-dark)",
                      background:  isActive ? "var(--accent)" : "transparent",
                      color:       isActive ? "var(--navy)"   : "var(--ink-muted)",
                      borderRadius: "20px", cursor: "pointer",
                      fontSize: "0.68rem", fontWeight: 700, fontFamily: "inherit",
                      transition: "all 0.14s",
                    }}>{t.label}</button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 상태 렌더링 */}
        {loading && <LoadingSpinner message="Airtable에서 아티스트를 불러오는 중..." />}
        {error   && !loading && <ErrorMessage message={error} />}
        {!loading && !error && filtered.length === 0 && <EmptyState message="검색 결과가 없습니다." />}

        {/* 카드 그리드 */}
        {!loading && !error && paged.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(228px, 1fr))",
            gap: "16px", marginBottom: "44px",
          }}>
            {paged.map((a) => (
              <Link
                href={`/artists/${a.id}`}
                key={a.id}
                style={{ textDecoration: "none", color: "inherit", display: "flex" }}
              >
                <ArtistCard artist={a} />
              </Link>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {!loading && totalPages > 1 && (
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
            <PagBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← 이전</PagBtn>
            {Array.from({ length: Math.min(totalPages, 9) }, (_, i) => i + 1).map((p) => (
              <PagBtn key={p} onClick={() => setPage(p)} active={page === p}>{p}</PagBtn>
            ))}
            <PagBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>다음 →</PagBtn>
          </div>
        )}
      </div>
    </>
  );
}
