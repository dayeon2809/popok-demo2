"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";

const FIELD_LABELS: Record<string, string> = {
  contemporary_dance: "현대무용",
  ballet: "발레",
  korean_dance: "한국무용",
  interdisciplinary: "다원예술",
  unknown: "기타",
};

interface OwnerProfile {
  display_name: string | null;
  email: string | null;
}

interface AdminArtistRow {
  id: string;
  name: string;
  name_en?: string | null;
  company?: string | null;
  profileImage: string;
  genre: string;
  role: string;
  bio_short: string;
  claim_code: string;
  verified: boolean;
  slug: string | null;
  ownerId: string | null;
  submissionId: number | null;
  status: string; // "published" | "draft" — the only two real values
  worksCount: number;
  viewCount: number;
  email: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  ownerProfile: OwnerProfile | null;
  lastSignInAt: string | null;
}

type FilterKey = "all" | "owned" | "unowned" | "published" | "draft" | "verified" | "no_account";
type SortKey = "created_desc" | "views_desc" | "views_asc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "created_desc", label: "최근 등록순" },
  { key: "views_desc", label: "조회수 높은순" },
  { key: "views_asc", label: "조회수 낮은순" },
];

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "owned", label: "회원 소유" },
  { key: "unowned", label: "기존 수집" },
  { key: "published", label: "공개" },
  { key: "draft", label: "비공개" },
  { key: "verified", label: "검증됨" },
  { key: "no_account", label: "연결 계정 없음" },
];

function normalizeForDupe(str: string | null | undefined): string {
  return (str || "").trim().toLowerCase().replace(/\s+/g, "");
}

// Flags rows sharing a normalized name, email, slug, or owner_id with another
// row — admin-review-only signal, never auto-merged or auto-deleted.
function computeDuplicateIds(rows: AdminArtistRow[]): Set<string> {
  const byName = new Map<string, string[]>();
  const byEmail = new Map<string, string[]>();
  const bySlug = new Map<string, string[]>();
  const byOwner = new Map<string, string[]>();

  for (const r of rows) {
    const name = normalizeForDupe(r.name);
    if (name) byName.set(name, [...(byName.get(name) || []), r.id]);

    const email = normalizeForDupe(r.email);
    if (email) byEmail.set(email, [...(byEmail.get(email) || []), r.id]);

    const slug = normalizeForDupe(r.slug);
    if (slug) bySlug.set(slug, [...(bySlug.get(slug) || []), r.id]);

    if (r.ownerId) byOwner.set(r.ownerId, [...(byOwner.get(r.ownerId) || []), r.id]);
  }

  const dupeIds = new Set<string>();
  for (const group of [byName, byEmail, bySlug, byOwner]) {
    for (const ids of group.values()) {
      if (ids.length > 1) ids.forEach((id) => dupeIds.add(id));
    }
  }
  return dupeIds;
}

function formatRelativeTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "방금 전";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}일 전`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}개월 전`;
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear}년 전`;
}

const badgeStyle = (bg: string, color: string): React.CSSProperties => ({
  display: "inline-block",
  fontSize: "0.68rem",
  padding: "3px 9px",
  borderRadius: "12px",
  fontWeight: 800,
  background: bg,
  color,
  whiteSpace: "nowrap",
});

export default function AdminArtistsPage() {
  const router = useRouter();

  const showClaimCodes = false;

  const [passcode, setPasscode] = useState("");
  const [artists, setArtists] = useState<AdminArtistRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [sortOption, setSortOption] = useState<SortKey>("created_desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [moreMenuId, setMoreMenuId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", name_en: "", genre: "", role: "", bio_short: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState("");
  const [deletingHasOwner, setDeletingHasOwner] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem("admin_passcode");
    if (!cached) {
      router.push("/admin");
    } else {
      setPasscode(cached);
      fetchArtists(cached);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchArtists = async (authCode?: string, sortOverride?: SortKey) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/artists?sort=${sortOverride || sortOption}`, {
        headers: {
          "x-admin-passcode": authCode || passcode || sessionStorage.getItem("admin_passcode") || "",
        },
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setArtists(json.data);
      } else {
        setError(json.error || "아티스트 목록을 불러오지 못했습니다.");
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const authHeader = () => ({ "x-admin-passcode": passcode || sessionStorage.getItem("admin_passcode") || "" });

  const duplicateIds = useMemo(() => computeDuplicateIds(artists), [artists]);

  const handleOpenDeleteConfirm = (id: string, name: string, hasOwner: boolean) => {
    setMoreMenuId(null);
    setDeletingId(id);
    setDeletingName(name);
    setDeletingHasOwner(hasOwner);
  };

  const handleDeleteSubmit = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const delRes = await fetch(`/api/admin/artists/${deletingId}`, { method: "DELETE", headers: authHeader() });
      const delData = await delRes.json();
      if (!delRes.ok || !delData.success) {
        alert(delData.error || "아티스트 삭제에 실패했습니다.");
        setIsDeleting(false);
        return;
      }
      setDeletingId(null);
      setDeletingName("");
      await fetchArtists();
    } catch (err) {
      alert("삭제 처리 중 네트워크 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (artist: AdminArtistRow) => {
    setMoreMenuId(null);
    const nextStatus = artist.status === "published" ? "draft" : "published";
    setStatusUpdatingId(artist.id);
    try {
      const res = await fetch(`/api/admin/artists/${artist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "상태 변경에 실패했습니다.");
        return;
      }
      await fetchArtists();
    } catch (err) {
      alert("상태 변경 중 네트워크 오류가 발생했습니다.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleStartEdit = (artist: AdminArtistRow) => {
    setMoreMenuId(null);
    setExpandedId(artist.id);
    setEditingId(artist.id);
    setEditForm({
      name: artist.name || "",
      name_en: artist.name_en || "",
      genre: artist.genre || "",
      role: artist.role || "",
      bio_short: artist.bio_short || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/artists/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "수정에 실패했습니다.");
        return;
      }
      setEditingId(null);
      await fetchArtists();
    } catch (err) {
      alert("수정 중 네트워크 오류가 발생했습니다.");
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredArtists = artists.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchesSearch =
        a.name.toLowerCase().includes(q) ||
        (a.company || "").toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q) ||
        (a.ownerProfile?.email || "").toLowerCase().includes(q) ||
        (a.ownerId || "").toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    switch (activeFilter) {
      case "owned": return !!a.ownerId;
      case "unowned": return !a.ownerId;
      case "published": return a.status === "published";
      case "draft": return a.status === "draft";
      case "verified": return a.verified;
      case "no_account": return !a.ownerProfile;
      default: return true;
    }
  });

  if (loading) {
    return (
      <div style={{ padding: "80px 0" }}>
        <LoadingSpinner message="아티스트 목록을 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px 0" }}>
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "20px", borderBottom: "1.5px solid var(--border)", paddingBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--navy)" }}>아티스트 관리 (Artists CMS)</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }}>데이터베이스에 등록된 아티스트 레코드를 모니터링하고 관리합니다.</p>
        </div>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink-faint)" }}>
          총 {filteredArtists.length}개 아티스트
        </span>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                border: activeFilter === f.key ? "1.5px solid var(--navy)" : "1.5px solid var(--border)",
                background: activeFilter === f.key ? "var(--navy)" : "#fff",
                color: activeFilter === f.key ? "#fff" : "var(--ink-muted)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={sortOption}
          onChange={(e) => {
            const next = e.target.value as SortKey;
            setSortOption(next);
            fetchArtists(undefined, next);
          }}
          style={{
            padding: "6px 12px",
            borderRadius: "8px",
            border: "1.5px solid var(--border)",
            fontSize: "0.78rem",
            fontWeight: 700,
            fontFamily: "inherit",
            background: "#fff",
            color: "var(--navy)",
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="이름, 소속, 슬러그 ID, 이메일, 연결 계정 이메일, owner_id로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: "1.5px solid var(--border)",
            borderRadius: "10px",
            fontSize: "0.9rem",
            outline: "none",
          }}
        />
      </div>

      {/* Artists Table */}
      <div style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid var(--border)" }}>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>프로필</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>이름</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>소유 유형</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>연결 계정</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>최근 로그인</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>작품 수</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>조회수</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>최근 수정일</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>상태</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)", textAlign: "right" }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredArtists.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: "40px", textAlign: "center", color: "var(--ink-muted)" }}>
                  조건에 맞는 아티스트가 없습니다.
                </td>
              </tr>
            ) : (
              filteredArtists.map((a) => {
                const isExpanded = expandedId === a.id;
                const isEditing = editingId === a.id;
                const isDupe = duplicateIds.has(a.id);
                const lastLoginDisplay = a.ownerId
                  ? (formatRelativeTime(a.lastSignInAt) || "기록 없음")
                  : "—";

                return (
                  <Fragment key={a.id}>
                    <tr style={{ borderBottom: isExpanded ? "none" : "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{
                          width: "40px", height: "40px", borderRadius: "50%",
                          background: `url(${a.profileImage || "/images/placeholders/cake-placeholder.png"}) center/cover no-repeat`,
                          border: "1px solid var(--border)",
                        }} />
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 800, color: "var(--navy)" }}>{a.name}</div>
                        {a.name_en && <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)", marginTop: "2px" }}>{a.name_en}</div>}
                        {isDupe && (
                          <div style={{ marginTop: "4px" }}>
                            <span style={badgeStyle("#FEF3DC", "var(--needs-review)")}>중복 가능성</span>
                          </div>
                        )}
                      </td>

                      {/* 소유 유형 */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                          <span style={badgeStyle(a.ownerId ? "#E0EAFE" : "#F1F5F9", a.ownerId ? "#2454C7" : "var(--ink-muted)")}>
                            {a.ownerId ? "회원 소유" : "기존 수집 데이터"}
                          </span>
                          <span style={badgeStyle(a.ownerId ? "#E0F0E8" : "#F1F5F9", a.ownerId ? "var(--verified)" : "var(--ink-faint)")}>
                            {a.ownerId ? "✔ Google 연결됨" : "⚪ 미연결"}
                          </span>
                          {a.submissionId != null && (
                            <span style={badgeStyle("#F1F5F9", "var(--ink-muted)")}>신청 기반</span>
                          )}
                        </div>
                      </td>

                      {/* 연결 계정 */}
                      <td style={{ padding: "12px 14px" }}>
                        {a.ownerId ? (
                          a.ownerProfile ? (
                            <div>
                              <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: "0.82rem" }}>{a.ownerProfile.display_name || "-"}</div>
                              <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>{a.ownerProfile.email || "-"}</div>
                            </div>
                          ) : (
                            <span style={{ color: "var(--ink-faint)" }}>연결 계정 없음</span>
                          )
                        ) : (
                          <span style={{ color: "var(--ink-faint)" }}>기존 수집 데이터</span>
                        )}
                      </td>

                      {/* 최근 로그인 */}
                      <td style={{ padding: "12px 14px", color: "var(--ink-muted)" }}>
                        {lastLoginDisplay}
                      </td>

                      {/* 작품 수 */}
                      <td style={{ padding: "12px 14px", color: "var(--navy)", fontWeight: 700 }}>
                        {a.worksCount}
                      </td>

                      {/* 조회수 */}
                      <td style={{ padding: "12px 14px", color: "var(--navy)", fontWeight: 700 }}>
                        {a.viewCount.toLocaleString("ko-KR")}
                      </td>

                      {/* 최근 수정일 */}
                      <td style={{ padding: "12px 14px", color: "var(--ink-muted)" }}>
                        {formatRelativeTime(a.updatedAt) || "-"}
                      </td>

                      {/* 상태 */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                          <span style={badgeStyle(a.status === "published" ? "#E0F0E8" : "#F1F5F9", a.status === "published" ? "var(--verified)" : "var(--ink-muted)")}>
                            {a.status === "published" ? "공개" : "비공개"}
                          </span>
                          {a.verified && (
                            <span style={badgeStyle("#E0EAFE", "#2454C7")}>검증됨</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "12px 14px", textAlign: "right", position: "relative" }}>
                        <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                          <button onClick={() => handleStartEdit(a)} style={actionBtnStyle}>수정</button>
                          {a.slug ? (
                            <Link href={`/artists/${a.slug}`} target="_blank" style={{ ...actionBtnStyle, textDecoration: "none", display: "inline-block" }}>
                              공개 프로필
                            </Link>
                          ) : (
                            <span style={{ ...actionBtnStyle, opacity: 0.4, cursor: "not-allowed" }}>공개 프로필</span>
                          )}
                          <button onClick={() => setExpandedId(isExpanded ? null : a.id)} style={actionBtnStyle}>
                            {isExpanded ? "접기" : "상세 보기"}
                          </button>
                          <button onClick={() => setMoreMenuId(moreMenuId === a.id ? null : a.id)} style={actionBtnStyle}>
                            더보기
                          </button>
                        </div>

                        {moreMenuId === a.id && (
                          <div style={{
                            position: "absolute", top: "100%", right: "14px", marginTop: "4px",
                            background: "#fff", border: "1.5px solid var(--border)", borderRadius: "10px",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, minWidth: "180px",
                            padding: "6px", textAlign: "left",
                          }}>
                            <button
                              onClick={() => handleToggleStatus(a)}
                              disabled={statusUpdatingId === a.id}
                              style={dropdownItemStyle}
                            >
                              {statusUpdatingId === a.id ? "변경 중..." : a.status === "published" ? "비공개로 전환" : "공개로 전환"}
                            </button>
                            <button
                              onClick={() => handleOpenDeleteConfirm(a.id, a.name, !!a.ownerId)}
                              style={{ ...dropdownItemStyle, color: "#EF4444" }}
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${a.id}-expanded`} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td colSpan={10} style={{ padding: "0 14px 18px", background: "#FAFBFC" }}>
                          {isEditing ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "14px 0", maxWidth: "480px" }}>
                              <label style={editLabelStyle}>
                                활동명
                                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={editInputStyle} />
                              </label>
                              <label style={editLabelStyle}>
                                영문명
                                <input value={editForm.name_en} onChange={(e) => setEditForm({ ...editForm, name_en: e.target.value })} style={editInputStyle} />
                              </label>
                              <label style={editLabelStyle}>
                                장르
                                <input value={editForm.genre} onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })} style={editInputStyle} />
                              </label>
                              <label style={editLabelStyle}>
                                역할
                                <input value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} style={editInputStyle} />
                              </label>
                              <label style={editLabelStyle}>
                                한줄 소개
                                <textarea value={editForm.bio_short} onChange={(e) => setEditForm({ ...editForm, bio_short: e.target.value })} rows={2} style={{ ...editInputStyle, fontFamily: "inherit", resize: "vertical" as const }} />
                              </label>
                              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                                <button onClick={() => setEditingId(null)} disabled={savingEdit} style={{ ...actionBtnStyle, padding: "8px 16px" }}>취소</button>
                                <button
                                  onClick={handleSaveEdit}
                                  disabled={savingEdit}
                                  style={{ ...actionBtnStyle, padding: "8px 16px", background: "var(--navy)", color: "#fff", border: "none" }}
                                >
                                  {savingEdit ? "저장 중..." : "저장"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ padding: "14px 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "0.8rem" }}>
                              <div><span style={detailLabelStyle}>ID</span><div style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{a.id}</div></div>
                              <div><span style={detailLabelStyle}>슬러그</span><div>{a.slug || "-"}</div></div>
                              <div><span style={detailLabelStyle}>소속</span><div>{a.company || "-"}</div></div>
                              <div><span style={detailLabelStyle}>분야</span><div>{a.genre ? (FIELD_LABELS[a.genre] ?? a.genre) : "미정"}</div></div>
                              <div><span style={detailLabelStyle}>역할</span><div>{a.role || "-"}</div></div>
                              <div><span style={detailLabelStyle}>이메일 (아티스트)</span><div>{a.email || "-"}</div></div>
                              <div><span style={detailLabelStyle}>owner_id</span><div style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>{a.ownerId || "-"}</div></div>
                              <div><span style={detailLabelStyle}>submission_id</span><div>{a.submissionId ?? "-"}</div></div>
                              <div><span style={detailLabelStyle}>등록일</span><div>{a.createdAt ? new Date(a.createdAt).toLocaleString("ko-KR") : "-"}</div></div>
                              <div><span style={detailLabelStyle}>최근 수정</span><div>{a.updatedAt ? new Date(a.updatedAt).toLocaleString("ko-KR") : "-"}</div></div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirm Modal */}
      {deletingId && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.4)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#fff", border: "1.5px solid var(--border)", borderRadius: "16px",
            padding: "28px", maxWidth: "420px", width: "90%", textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>⚠️</div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", marginBottom: "12px" }}>
              정말 이 아티스트를 삭제할까요?
            </h3>
            {deletingHasOwner && (
              <p style={{
                fontSize: "0.82rem", color: "#B45309", background: "#FFFBEB", border: "1px solid #FDE68A",
                borderRadius: "10px", padding: "12px", lineHeight: 1.6, marginBottom: "16px", textAlign: "left",
              }}>
                이 프로필은 로그인 계정과 연결되어 있습니다. 삭제하면 사용자의 내 포퐄이 사라질 수 있습니다. 삭제보다 "더보기 → 비공개로 전환"을 먼저 고려해주세요.
              </p>
            )}
            <p style={{ fontSize: "0.86rem", color: "var(--ink-muted)", lineHeight: 1.6, marginBottom: "24px" }}>
              선택한 아티스트 <strong>"{deletingName}"</strong> 레코드가 데이터베이스에서 완전히 삭제되며, 이 작업은 되돌릴 수 없습니다.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                disabled={isDeleting}
                onClick={() => { setDeletingId(null); setDeletingName(""); }}
                style={{
                  flex: 1, padding: "12px", background: "transparent", color: "var(--ink-muted)",
                  border: "1.5px solid var(--border-dark)", borderRadius: "10px",
                  fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                취소
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteSubmit}
                style={{
                  flex: 1, padding: "12px", background: "#EF4444", color: "#fff",
                  border: "none", borderRadius: "10px",
                  fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {isDeleting ? "삭제 중..." : "확인 및 삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
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

const dropdownItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "8px 10px",
  fontSize: "0.8rem",
  fontWeight: 700,
  color: "var(--navy)",
  background: "none",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontFamily: "inherit",
};

const editLabelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "var(--ink-muted)",
};

const editInputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1.5px solid var(--border)",
  borderRadius: "8px",
  fontSize: "0.85rem",
  outline: "none",
};

const detailLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.68rem",
  fontWeight: 800,
  color: "var(--ink-faint)",
  textTransform: "uppercase",
  marginBottom: "2px",
};
