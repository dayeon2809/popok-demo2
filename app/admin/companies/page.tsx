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
  owner_id?: string | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const authHeader = () => ({ "x-admin-passcode": sessionStorage.getItem("admin_passcode") || "" });

  const fetchCompanies = async (filter: FilterKey = activeFilter, search: string = searchQuery) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (search.trim()) params.set("search", search.trim());
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
  }, [activeFilter, searchQuery]);

  const handleUnlinkOwner = async (company: AdminCompanyRow) => {
    if (!confirm(`'${company.name}' 단체의 대표 연결을 해제하시겠습니까? (owner_id = NULL)`)) return;
    setStatusUpdatingId(company.id);
    try {
      const res = await fetch(`/api/admin/companies/${company.id}/unlink-owner`, {
        method: "POST",
        headers: authHeader(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "대표 해제에 실패했습니다.");
        return;
      }
      alert("대표 연결이 해제되었습니다.");
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
      <div style={{ marginBottom: "20px", borderBottom: "1.5px solid var(--border)", paddingBottom: "16px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--navy)" }}>단체 관리 (Companies)</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }}>
          단체 공개 프로필과 개인 아티스트 연결 관계를 관리합니다.
        </p>
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

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="단체명, 영문명, slug로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "100%", padding: "12px 16px", border: "1.5px solid var(--border)", borderRadius: "10px", fontSize: "0.9rem", outline: "none" }}
        />
      </div>

      <div style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid var(--border)" }}>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>단체명</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>slug</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>상태</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>장르/지역</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>연결 아티스트</th>
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
                      <div style={{ fontWeight: 800, color: "var(--navy)" }}>{c.name}</div>
                      {c.name_en && <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>{c.name_en}</div>}
                      <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
                        {c.verified && (
                          <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "var(--navy)", background: "var(--accent)", padding: "2px 6px", borderRadius: "6px" }}>
                            VERIFIED
                          </span>
                        )}
                        {c.owner_id && (
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
                    <td style={{ padding: "12px 14px", color: "var(--navy)", fontWeight: 700 }}>
                      {c.connectedArtistsCount}
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--ink-muted)" }}>
                      {c.fromApplication ? "신청" : "-"}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {c.owner_id && (
                          <button
                            type="button"
                            onClick={() => handleUnlinkOwner(c)}
                            disabled={statusUpdatingId === c.id}
                            style={{ ...actionBtnStyle, color: "#991B1B", borderColor: "#FCA5A5" }}
                          >
                            대표 해제
                          </button>
                        )}
                        {c.slug && (
                          <Link href={`/admin/companies/${c.id}/preview`} style={{ ...actionBtnStyle, textDecoration: "none", display: "inline-block" }}>
                            미리보기
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
