"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";

interface AdminCompanyRow {
  id: string;
  name: string;
  name_en: string | null;
  slug: string | null;
  status: "draft" | "published" | "archived";
  verified: boolean;
  genre: string | null;
  category: string | null;
  city_or_region: string | null;
  profile_image_url?: string | null;
  owner_id?: string | null;
  worksCount?: number;
  upcomingPerformancesCount?: number;
  hasPrimaryArtist?: boolean;
  connectedArtistsCount: number;
  fromApplication: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

interface Summary {
  total: number;
  draft: number;
  published: number;
  archived: number;
}

type FilterKey = "all" | "draft" | "published" | "archived";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "draft", label: "초안" },
  { key: "published", label: "공개" },
  { key: "archived", label: "보관" },
];

const STATUS_BADGE: Record<AdminCompanyRow["status"], { bg: string; fg: string; label: string }> = {
  draft: { bg: "#F1F5F9", fg: "var(--ink-muted)", label: "초안" },
  published: { bg: "#E0F0E8", fg: "var(--verified)", label: "공개" },
  archived: { bg: "#FEF3DC", fg: "#B45309", label: "보관" },
};

export default function AdminCompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<AdminCompanyRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const authHeader = () => ({});

  const fetchCompanies = async (filter: FilterKey = activeFilter, search: string = searchQuery) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (search.trim()) params.set("search", search.trim());
      if (ownerFilter !== "all") params.set("owner", ownerFilter);
      if (genreFilter) params.set("genre", genreFilter);
      params.set("sort", sort);
      const res = await fetch(`/api/admin/companies?${params.toString()}`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok && data.success) {
        setCompanies(data.data);
        setSummary(data.summary);
      } else {
        setError(data.error || "단체 목록을 불러오지 못했습니다.");
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchCompanies(activeFilter, searchQuery), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, searchQuery, ownerFilter, genreFilter, sort]);

  const handleUnlinkOwner = async (company: AdminCompanyRow) => {
    if (!confirm(`'${company.name}' 단체의 대표 및 관리 권한을 해제하시겠습니까?`)) return;
    setStatusUpdatingId(company.id);
    try {
      const res = await fetch(`/api/admin/companies/${company.id}/unlink-owner`, {
        method: "POST",
        headers: authHeader(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "대표 권한 해제에 실패했습니다.");
        return;
      }
      alert("단체 대표 권한이 해제되었습니다.");
      await fetchCompanies();
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleStatusAction = async (company: AdminCompanyRow, action: "publish" | "unpublish" | "archive") => {
    setStatusUpdatingId(company.id);
    try {
      const res = await fetch(`/api/admin/companies/${company.id}/${action}`, {
        method: "POST",
        headers: authHeader(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "상태 변경에 실패했습니다.");
        return;
      }
      await fetchCompanies();
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  if (loading && companies.length === 0) {
    return <div style={{ padding: "60px 0" }}><LoadingSpinner message="단체 목록을 불러오는 중..." /></div>;
  }

  if (error) {
    return <div style={{ padding: "40px 0" }}><ErrorMessage message={error} /></div>;
  }

  return (
    <div>
      <style jsx>{`
        .admin-company-controls { display: grid; grid-template-columns: minmax(220px, 1fr) repeat(3, minmax(130px, auto)); gap: 10px; margin-bottom: 20px; }
        @media (max-width: 760px) { .admin-company-controls { grid-template-columns: 1fr; } }
      `}</style>
      <div style={{ marginBottom: "20px", borderBottom: "1.5px solid var(--border)", paddingBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--navy)" }}>단체 관리 (Companies)</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }}>단체 공개 프로필과 개인 아티스트 연결 관계를 관리합니다.</p>
        </div>
        <Link href="/admin/companies/new" style={{ padding: "10px 16px", background: "var(--accent)", color: "var(--navy)", fontWeight: 800, textDecoration: "none", border: "1px solid var(--accent)" }}>새 단체 만들기</Link>
      </div>

      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "전체", value: summary.total },
            { label: "초안", value: summary.draft },
            { label: "공개", value: summary.published },
            { label: "보관", value: summary.archived },
          ].map((s) => (
            <div key={s.label} style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "10px", padding: "14px 16px" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)", fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--navy)" }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            style={{
              padding: "6px 14px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
              border: activeFilter === f.key ? "1.5px solid var(--navy)" : "1.5px solid var(--border)",
              background: activeFilter === f.key ? "var(--navy)" : "#fff",
              color: activeFilter === f.key ? "#fff" : "var(--ink-muted)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="admin-company-controls">
        <input type="search" placeholder="단체명, 영문명, slug로 검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={controlStyle} />
        <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} style={controlStyle}><option value="all">대표자 전체</option><option value="connected">대표자 연결</option><option value="unconnected">대표자 미연결</option></select>
        <input value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} placeholder="장르 정확히 입력" style={controlStyle} />
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={controlStyle}><option value="newest">최신 생성순</option><option value="name">이름순</option></select>
      </div>

      <div style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid var(--border)" }}>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>단체명</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>slug</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>상태</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>장르/지역</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>콘텐츠</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>신청 출처</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)", textAlign: "right" }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--ink-muted)" }}>
                  조건에 맞는 단체가 없습니다.
                </td>
              </tr>
            ) : (
              companies.map((c) => {
                const badge = STATUS_BADGE[c.status];
                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: 42, height: 42, flex: "0 0 42px", border: "1px solid var(--border)", background: "#eef4d5", overflow: "hidden" }}>
                          {c.profile_image_url ? <img src={c.profile_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ display: "grid", placeItems: "center", height: "100%", fontWeight: 900 }}>P</span>}
                        </div>
                        <div><div style={{ fontWeight: 800, color: "var(--navy)" }}>{c.name}</div>
                      {c.name_en && <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>{c.name_en}</div>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
                        {c.verified && (
                          <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "var(--navy)", background: "var(--accent)", padding: "2px 6px", borderRadius: "6px" }}>
                            VERIFIED
                          </span>
                        )}
                        {(c.owner_id || c.hasPrimaryArtist) && (
                          <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "#047857", background: "#ECFDF5", padding: "2px 6px", borderRadius: "6px" }}>
                            대표 연결됨
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                      {c.slug || "-"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "3px 10px", borderRadius: "999px", background: badge.bg, color: badge.fg }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--ink-muted)" }}>
                      {[c.genre, c.city_or_region].filter(Boolean).join(" · ") || "-"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--navy)", fontWeight: 700, whiteSpace: "nowrap" }}>
                      아티스트 {c.connectedArtistsCount}<br />
                      <span style={{ color: "var(--ink-muted)", fontSize: 12 }}>작품 {c.worksCount || 0} · 예정 공연 {c.upcomingPerformancesCount || 0}</span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--ink-muted)" }}>
                      {c.fromApplication ? "신청" : "-"}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {(c.owner_id || c.hasPrimaryArtist) && (
                          <button
                            type="button"
                            onClick={() => handleUnlinkOwner(c)}
                            disabled={statusUpdatingId === c.id}
                            style={{ ...actionBtnStyle, color: "#991B1B", borderColor: "#FCA5A5" }}
                          >
                            권한 해제
                          </button>
                        )}
                        {c.slug && (
                          <Link href={`/companies/${c.slug}`} target="_blank" rel="noreferrer" style={{ ...actionBtnStyle, textDecoration: "none", display: "inline-block" }}>
                            공개 페이지
                          </Link>
                        )}
                        <Link href={`/admin/companies/${c.id}`} style={{ ...actionBtnStyle, textDecoration: "none", display: "inline-block" }}>
                          수정
                        </Link>
                        {c.status === "draft" && (
                          <button onClick={() => handleStatusAction(c, "publish")} disabled={statusUpdatingId === c.id} style={actionBtnStyle}>
                            공개하기
                          </button>
                        )}
                        {c.status === "published" && (
                          <button onClick={() => handleStatusAction(c, "unpublish")} disabled={statusUpdatingId === c.id} style={actionBtnStyle}>
                            비공개
                          </button>
                        )}
                        {c.status !== "archived" && (
                          <button onClick={() => handleStatusAction(c, "archive")} disabled={statusUpdatingId === c.id} style={actionBtnStyle}>
                            보관
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const controlStyle: React.CSSProperties = { padding: "11px 13px", border: "1px solid var(--border-dark)", background: "#fff", font: "inherit", minWidth: 0 };

const actionBtnStyle: React.CSSProperties = {
  padding: "5px 10px",
  background: "transparent",
  color: "var(--navy)",
  border: "1.2px solid var(--border-dark)",
  borderRadius: "6px",
  fontSize: "0.74rem",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};
