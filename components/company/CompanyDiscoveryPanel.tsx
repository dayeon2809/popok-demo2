"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMobileBodyScrollLock } from "@/hooks/useMobileBodyScrollLock";
import { getCompanyDetailHref } from "@/lib/companyRoute";
import { COMPANY_RECOMMENDATION_QUESTIONS, recommendCompanies, type CompanyRecommendationResult } from "@/lib/companyRecommendation";
import { normalizeWorks } from "@/lib/works";
import type { Company } from "@/types";

const FALLBACK_IMAGE = "/images/placeholders/cake-placeholder.png";

interface ResultCardProps {
  result: CompanyRecommendationResult;
}

function ResultCard({ result }: ResultCardProps) {
  const [failed, setFailed] = useState(false);
  const { company, percentage, reasons } = result;

  const normalizedWorks = normalizeWorks(company.works);
  const workImage = normalizedWorks.find((w) => w.image_url)?.image_url || "";
  const image = company.profile_image_url || workImage || (company.representative_images && company.representative_images[0]) || "";
  const href = getCompanyDetailHref(company.slug || company.id);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", background: "#FFFFFF" }}>
      <Link
        href={href}
        style={{ textDecoration: "none", display: "block" }}
      >
        <div style={{ width: "100%", aspectRatio: "4 / 3", background: "#EAE6DD", overflow: "hidden" }}>
          {image ? (
            <img
              src={failed ? FALLBACK_IMAGE : image}
              alt={company.name}
              loading="lazy"
              onError={() => setFailed(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F1E8", color: "var(--border-dark)" }}>
              POPOK
            </div>
          )}
        </div>
        <div style={{ padding: "12px 14px 12px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "6px", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.92rem", fontWeight: 850, color: "var(--navy)" }}>{company.name}</span>
            {company.genre && (
              <span style={{ fontSize: "0.68rem", color: "var(--accent-dark)", fontWeight: 700 }}>{company.genre}</span>
            )}
          </div>
          {percentage > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <span style={{
                fontSize: "0.65rem", fontWeight: 800, color: "#FFFFFF",
                background: "var(--navy)", padding: "1px 6px", borderRadius: "4px"
              }}>
                적합도 {percentage}%
              </span>
            </div>
          )}
          {reasons && reasons.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
              {reasons.slice(0, 2).map((reason) => (
                <span
                  key={reason}
                  style={{
                    fontSize: "0.65rem", fontWeight: 700, color: "var(--accent-dark)",
                    background: "var(--accent-light)", padding: "2px 8px", borderRadius: "999px",
                  }}
                >
                  {reason}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

interface CompanyDiscoveryPanelProps {
  companies: Company[];
  defaultQuery?: string;
  autoSearch?: boolean;
  onClose: () => void;
}

export default function CompanyDiscoveryPanel({
  companies,
  defaultQuery = "",
  autoSearch = false,
  onClose,
}: CompanyDiscoveryPanelProps) {
  useMobileBodyScrollLock();
  const [query, setQuery] = useState(defaultQuery);
  const [results, setResults] = useState<CompanyRecommendationResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Sync selected options if defaultQuery is loaded
  useEffect(() => {
    if (defaultQuery) {
      const allLabels = COMPANY_RECOMMENDATION_QUESTIONS.flatMap((q) => q.options.map((o) => o.label));
      const matched = allLabels.filter((label) => defaultQuery.includes(label));
      setSelectedOptions(matched);
    }
  }, [defaultQuery]);

  const handleOptionToggle = (label: string) => {
    setSelectedOptions((prev) => {
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
    const allLabels = COMPANY_RECOMMENDATION_QUESTIONS.flatMap((q) => q.options.map((o) => o.label));
    const matched = allLabels.filter((label) => val.includes(label));
    setSelectedOptions(matched);
  };



  const runSearch = (q: string) => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) return;

    // Find options matching terms in query
    const matchedOptionIds: string[] = [];
    COMPANY_RECOMMENDATION_QUESTIONS.forEach((question) => {
      question.options.forEach((option) => {
        if (option.terms.some((term) => trimmed.includes(term.toLowerCase()))) {
          matchedOptionIds.push(option.id);
        }
      });
    });

    const recs = matchedOptionIds.length ? recommendCompanies(companies, matchedOptionIds, 12) : [];
    const recIds = new Set(recs.map((r) => r.company.id));

    // Fallback/backfill direct text match
    const textMatches: CompanyRecommendationResult[] = companies
      .filter((c) => !recIds.has(c.id))
      .filter((c) => {
        const nameMatch = c.name?.toLowerCase().includes(trimmed) || c.name_en?.toLowerCase().includes(trimmed);
        const genreMatch = c.genre?.toLowerCase().includes(trimmed) || c.category?.toLowerCase().includes(trimmed);
        const bioMatch = c.bio_short?.toLowerCase().includes(trimmed) || c.bio?.toLowerCase().includes(trimmed);
        const worksMatch = c.works?.some((w) => w.title?.toLowerCase().includes(trimmed));
        return nameMatch || genreMatch || bioMatch || worksMatch;
      })
      .map((c) => ({
        company: c,
        score: 1,
        maxScore: 1,
        percentage: 80,
        reasons: ["소개/활동 내 검색어 포함"],
        matchedItems: [],
      }));

    setResults([...recs, ...textMatches].slice(0, 6));
    setSearched(true);
  };

  useEffect(() => {
    if (autoSearch && defaultQuery.trim()) {
      runSearch(defaultQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              COMPANY DISCOVERY
            </span>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--navy)", margin: 0 }}>
              단체 탐색 결과
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
            runSearch(query);
          }}
          style={{ display: "flex", gap: "8px", padding: "16px 20px" }}
        >
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="장르, 분위기, 작업 방식 등으로 단체 검색..."
            style={{
              flex: 1, border: "1.5px solid var(--border-dark)", borderRadius: "999px",
              padding: "10px 16px", fontSize: "0.88rem", fontFamily: "inherit", color: "var(--navy)", outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              border: "none", background: "var(--navy)", color: "#FFFFFF", borderRadius: "999px",
              padding: "10px 20px", fontSize: "0.85rem", fontWeight: 800, cursor: "pointer",
              flexShrink: 0,
            }}
          >
            탐색
          </button>
        </form>

        <div style={{ padding: "0 20px 24px" }}>
          {searched && (
            <>
              <p style={{ fontSize: "0.88rem", color: "var(--navy)", fontWeight: 700, margin: "4px 0 16px" }}>
                {results.length > 0
                  ? `요청과 관련된 단체를 ${results.length}개 찾았어요.`
                  : "현재 POPOK에 등록된 단체 정보 안에서는 정확히 일치하는 단체를 찾지 못했어요."}
              </p>

              {results.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px" }}>
                  {results.map((result) => (
                    <ResultCard key={result.company.id} result={result} />
                  ))}
                </div>
              ) : null}
            </>
          )}

          {!searched && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingTop: "4px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                나와 맞는 단체 찾기 질문 & 키워드
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {COMPANY_RECOMMENDATION_QUESTIONS.map((question) => (
                  <div key={question.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)" }}>
                      Q. {question.title}
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {question.options.map((opt) => {
                        const isSelected = selectedOptions.includes(opt.label);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleOptionToggle(opt.label)}
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
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
