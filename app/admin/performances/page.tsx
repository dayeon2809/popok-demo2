"use client";

import { useEffect, useMemo, useState } from "react";
import { LoadingSpinner, ErrorMessage, EmptyState } from "@/components/ui/States";

interface AdminPerformanceRow {
  id: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  venue: string | null;
  description: string | null;
  genre: string | null;
  posterUrl: string | null;
  organizer: string | null;
  externalUrl: string | null;
  companyId: string | null;
  companyName: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  lifecycleStatus: "upcoming" | "ongoing" | "ended";
  deletionPending: boolean;
}

interface CompanyOption {
  id: string;
  name: string;
}

interface FormState {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  venue: string;
  description: string;
  genre: string;
  externalUrl: string;
  companyId: string;
  organizer: string;
  posterUrl: string;
  isPublished: boolean;
  isFeatured: boolean;
  displayOrder: string;
}

type LifecycleFilter = "all" | "upcoming" | "ongoing" | "ended";

const LIFECYCLE_LABELS: Record<AdminPerformanceRow["lifecycleStatus"], string> = {
  upcoming: "예정",
  ongoing: "진행 중",
  ended: "종료",
};

const LIFECYCLE_FILTERS: { key: LifecycleFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "upcoming", label: "예정" },
  { key: "ongoing", label: "진행 중" },
  { key: "ended", label: "종료" },
];

const ALLOWED_POSTER_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const ALLOWED_POSTER_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_POSTER_SIZE = 5 * 1024 * 1024; // 5MB

function emptyForm(): FormState {
  return {
    id: crypto.randomUUID(),
    title: "",
    startDate: "",
    endDate: "",
    venue: "",
    description: "",
    genre: "",
    externalUrl: "",
    companyId: "",
    organizer: "",
    posterUrl: "",
    isPublished: false,
    isFeatured: false,
    displayOrder: "0",
  };
}

function rowToForm(row: AdminPerformanceRow): FormState {
  return {
    id: row.id,
    title: row.title,
    startDate: row.startDate || "",
    endDate: row.endDate || "",
    venue: row.venue || "",
    description: row.description || "",
    genre: row.genre || "",
    externalUrl: row.externalUrl || "",
    companyId: row.companyId || "",
    organizer: row.organizer || "",
    posterUrl: row.posterUrl || "",
    isPublished: row.isPublished,
    isFeatured: row.isFeatured,
    displayOrder: String(row.displayOrder ?? 0),
  };
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return value.replace(/-/g, ".");
}

const lifecycleBadgeStyle = (status: AdminPerformanceRow["lifecycleStatus"]): React.CSSProperties => {
  const colors: Record<string, { bg: string; color: string }> = {
    upcoming: { bg: "#EFF6FF", color: "#1D4ED8" },
    ongoing: { bg: "#ECFDF5", color: "#047857" },
    ended: { bg: "#F3F4F6", color: "#6B7280" },
  };
  const c = colors[status];
  return {
    display: "inline-block",
    fontSize: "0.68rem",
    fontWeight: 800,
    padding: "3px 8px",
    borderRadius: "999px",
    background: c.bg,
    color: c.color,
  };
};

const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: "4px 10px",
  borderRadius: "999px",
  border: `1.5px solid ${active ? "var(--navy)" : "var(--border)"}`,
  background: active ? "var(--navy)" : "#fff",
  color: active ? "#fff" : "var(--ink-muted)",
  fontSize: "0.7rem",
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
});

export default function AdminPerformancesPage() {
  const [rows, setRows] = useState<AdminPerformanceRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleFilter>("all");
  const [deletionPendingOnly, setDeletionPendingOnly] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [uploadingPoster, setUploadingPoster] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<{ ids: string[]; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const authHeader = () => ({ "x-admin-passcode": sessionStorage.getItem("admin_passcode") || "" });

  const fetchPerformances = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/performances", { headers: authHeader() });
      const data = await res.json();
      if (res.ok && data.success) {
        setRows(data.data);
      } else {
        setError(data.error || "공연 목록을 불러오지 못했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/admin/companies?status=published", { headers: authHeader() });
      const data = await res.json();
      if (res.ok && data.success) {
        setCompanies(data.data.map((c: any) => ({ id: c.id, name: c.name })));
      }
    } catch {
      // Non-fatal — the company picker just stays empty.
    }
  };

  useEffect(() => {
    fetchPerformances();
    fetchCompanies();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (deletionPendingOnly && !r.deletionPending) return false;
      if (lifecycleFilter !== "all" && r.lifecycleStatus !== lifecycleFilter) return false;
      return true;
    });
  }, [rows, lifecycleFilter, deletionPendingOnly]);

  const allVisibleSelected = filteredRows.length > 0 && filteredRows.every((r) => selectedIds.has(r.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        filteredRows.forEach((r) => next.delete(r.id));
        return next;
      }
      const next = new Set(prev);
      filteredRows.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreateForm = () => {
    setFormMode("create");
    setForm(emptyForm());
    setFormError(null);
    setPosterPreview(null);
    setFormOpen(true);
  };

  const openEditForm = (row: AdminPerformanceRow) => {
    setFormMode("edit");
    setForm(rowToForm(row));
    setFormError(null);
    setPosterPreview(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormError(null);
    setPosterPreview(null);
  };

  const handlePosterSelect = async (file: File | null) => {
    if (!file) return;

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const mimeOk = ALLOWED_POSTER_MIME.includes(file.type);
    const extOk = ALLOWED_POSTER_EXTENSIONS.includes(ext);
    if (!mimeOk && !extOk) {
      alert("JPG, JPEG, PNG, WEBP 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_POSTER_SIZE) {
      alert("포스터 파일 크기는 5MB를 초과할 수 없습니다.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPosterPreview(localPreview);
    setUploadingPoster(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "artist-media");
      formData.append("path", `performances/${form.id}`);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        setForm((f) => ({ ...f, posterUrl: data.url }));
      } else {
        alert(data.error || "포스터 업로드에 실패했습니다.");
        setPosterPreview(null);
      }
    } catch {
      alert("네트워크 오류로 포스터 업로드에 실패했습니다.");
      setPosterPreview(null);
    } finally {
      setUploadingPoster(false);
    }
  };

  const removePoster = () => {
    setForm((f) => ({ ...f, posterUrl: "" }));
    setPosterPreview(null);
  };

  const validateForm = (): string | null => {
    if (!form.title.trim()) return "공연명을 입력해 주세요.";
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      return "종료일은 시작일보다 빠를 수 없습니다.";
    }
    const url = form.externalUrl.trim();
    if (url && !/^https?:\/\/.+/i.test(url)) {
      return "외부 링크는 http:// 또는 https://로 시작해야 합니다.";
    }
    if ((form.isPublished || form.isFeatured) && !url) {
      return "공개 또는 메인 노출을 하려면 외부 링크가 필요합니다.";
    }
    if (form.isFeatured && !form.isPublished) {
      return "메인 노출은 공개 상태에서만 설정할 수 있습니다.";
    }
    if (form.displayOrder.trim() && !Number.isInteger(Number(form.displayOrder))) {
      return "노출 순서는 정수여야 합니다.";
    }
    return null;
  };

  const buildPayload = () => ({
    id: form.id,
    title: form.title.trim(),
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    venue: form.venue.trim(),
    description: form.description.trim(),
    genre: form.genre.trim(),
    externalUrl: form.externalUrl.trim(),
    companyId: form.companyId || null,
    organizer: form.organizer.trim(),
    posterUrl: form.posterUrl,
    isPublished: form.isPublished,
    isFeatured: form.isFeatured,
    displayOrder: form.displayOrder.trim() === "" ? 0 : Number(form.displayOrder),
  });

  const submitForm = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const url = formMode === "create" ? "/api/admin/performances" : `/api/admin/performances/${form.id}`;
      const method = formMode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        closeForm();
        await fetchPerformances();
      } else {
        setFormError(data.error || "저장에 실패했습니다.");
      }
    } catch {
      setFormError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const patchRow = async (id: string, patch: Record<string, any>) => {
    try {
      const res = await fetch(`/api/admin/performances/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchPerformances();
      } else {
        alert(data.error || "수정에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  const runDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      if (confirmDelete.ids.length === 1) {
        const res = await fetch(`/api/admin/performances/${confirmDelete.ids[0]}`, {
          method: "DELETE",
          headers: authHeader(),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          alert(data.error || "삭제에 실패했습니다.");
          setDeleting(false);
          return;
        }
      } else {
        const res = await fetch("/api/admin/performances/bulk-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({ ids: confirmDelete.ids }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          alert(data.error || "삭제에 실패했습니다.");
          setDeleting(false);
          return;
        }
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        confirmDelete.ids.forEach((id) => next.delete(id));
        return next;
      });
      setConfirmDelete(null);
      await fetchPerformances();
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner message="공연 목록을 불러오는 중..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--navy)" }}>이주의 공연 관리</h1>
          <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", marginTop: "4px" }}>
            홈 화면 &ldquo;이번 주 공연&rdquo;에 노출할 공연을 등록·관리합니다. 공개 + 메인 노출 + 외부 링크가 모두 있는 공연만 홈에 표시됩니다.
          </p>
        </div>
        <button onClick={openCreateForm} style={primaryBtnStyle}>
          + 신규 등록
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {LIFECYCLE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setLifecycleFilter(f.key)}
              style={toggleBtnStyle(lifecycleFilter === f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: 700, color: "var(--ink-muted)", cursor: "pointer" }}>
          <input type="checkbox" checked={deletionPendingOnly} onChange={(e) => setDeletionPendingOnly(e.target.checked)} />
          삭제 예정만 보기
        </label>

        {selectedIds.size > 0 && (
          <button
            onClick={() => setConfirmDelete({ ids: Array.from(selectedIds), label: `선택한 ${selectedIds.size}개 공연` })}
            style={{ ...dangerBtnStyle, marginLeft: "auto" }}
          >
            선택 삭제 ({selectedIds.size})
          </button>
        )}
      </div>

      {filteredRows.length === 0 ? (
        <EmptyState message="등록된 공연이 없습니다." />
      ) : (
        <div style={{ overflowX: "auto", border: "1.5px solid var(--border)", borderRadius: "12px", background: "#fff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ background: "#f8f9fa", borderBottom: "1.5px solid var(--border)" }}>
                <th style={thStyle}><input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} /></th>
                <th style={thStyle}>포스터</th>
                <th style={thStyle}>공연명</th>
                <th style={thStyle}>날짜</th>
                <th style={thStyle}>장소</th>
                <th style={thStyle}>연결 단체</th>
                <th style={thStyle}>외부 링크</th>
                <th style={thStyle}>공개</th>
                <th style={thStyle}>메인 노출</th>
                <th style={thStyle}>상태</th>
                <th style={thStyle}>순서</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={tdStyle}>
                    <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelectOne(row.id)} />
                  </td>
                  <td style={tdStyle}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "6px", overflow: "hidden", background: "#FAF9F5", border: "1px solid var(--border)" }}>
                      {row.posterUrl ? (
                        <img src={row.posterUrl} alt={row.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "var(--ink-faint)" }}>
                          NO IMG
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "var(--navy)", maxWidth: "220px" }}>
                    {row.title}
                    {row.deletionPending && (
                      <span style={{ ...lifecycleBadgeStyle("ended"), marginLeft: "6px", background: "#FEF2F2", color: "#B91C1C" }}>삭제 예정</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap", color: "var(--ink-muted)" }}>
                    {formatDate(row.startDate)}{row.endDate && row.endDate !== row.startDate ? ` - ${formatDate(row.endDate)}` : ""}
                  </td>
                  <td style={{ ...tdStyle, color: "var(--ink-muted)" }}>{row.venue || "-"}</td>
                  <td style={tdStyle}>{row.companyName || row.organizer || "-"}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{row.externalUrl ? "✅" : "—"}</td>
                  <td style={tdStyle}>
                    <button onClick={() => patchRow(row.id, { isPublished: !row.isPublished })} style={toggleBtnStyle(row.isPublished)}>
                      {row.isPublished ? "공개" : "비공개"}
                    </button>
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => patchRow(row.id, { isFeatured: !row.isFeatured })} style={toggleBtnStyle(row.isFeatured)}>
                      {row.isFeatured ? "노출 중" : "미노출"}
                    </button>
                  </td>
                  <td style={tdStyle}>
                    <span style={lifecycleBadgeStyle(row.lifecycleStatus)}>{LIFECYCLE_LABELS[row.lifecycleStatus]}</span>
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      defaultValue={row.displayOrder}
                      onBlur={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isInteger(n) && n !== row.displayOrder) patchRow(row.id, { displayOrder: n });
                      }}
                      style={{ width: "56px", padding: "4px 6px", border: "1px solid var(--border)", borderRadius: "6px", fontSize: "0.78rem", fontFamily: "inherit" }}
                    />
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <button onClick={() => openEditForm(row)} style={linkBtnStyle}>수정</button>
                    <button onClick={() => setConfirmDelete({ ids: [row.id], label: row.title })} style={{ ...linkBtnStyle, color: "#DC2626", marginLeft: "10px" }}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <div style={modalOverlayStyle} onClick={closeForm}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", marginBottom: "18px" }}>
              {formMode === "create" ? "공연 신규 등록" : "공연 수정"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <FormField label="공연명 *">
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={inputStyle} />
              </FormField>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <FormField label="시작일">
                  <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} style={inputStyle} />
                </FormField>
                <FormField label="종료일">
                  <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} style={inputStyle} />
                </FormField>
              </div>

              <FormField label="장소">
                <input value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} style={inputStyle} />
              </FormField>

              <FormField label="한 줄 소개">
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={inputStyle} />
              </FormField>

              <FormField label="장르 (선택)">
                <input value={form.genre} onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))} style={inputStyle} />
              </FormField>

              <FormField label="외부 링크 (예매 페이지 / 공식 홈페이지 / 인스타그램 게시물)">
                <input
                  value={form.externalUrl}
                  onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </FormField>

              <FormField label="연결 단체 (POPOK 등록 단체)">
                <select value={form.companyId} onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))} style={inputStyle}>
                  <option value="">선택 안 함</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="미등록 단체명 (연결 단체가 없을 때, 선택)">
                <input value={form.organizer} onChange={(e) => setForm((f) => ({ ...f, organizer: e.target.value }))} style={inputStyle} />
              </FormField>

              <FormField label="포스터 이미지 (선택, JPG/PNG/WEBP, 5MB 이하)">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "72px", height: "96px", borderRadius: "6px", overflow: "hidden", background: "#FAF9F5", border: "1px solid var(--border)", flexShrink: 0 }}>
                    {(posterPreview || form.posterUrl) ? (
                      <img src={posterPreview || form.posterUrl} alt="포스터 미리보기" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "var(--ink-faint)", textAlign: "center" }}>
                        포스터 없음
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handlePosterSelect(e.target.files?.[0] || null)}
                      disabled={uploadingPoster}
                    />
                    {uploadingPoster && <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>업로드 중...</span>}
                    {form.posterUrl && !uploadingPoster && (
                      <button type="button" onClick={removePoster} style={{ ...linkBtnStyle, color: "#DC2626", textAlign: "left" }}>포스터 제거</button>
                    )}
                  </div>
                </div>
              </FormField>

              <div style={{ display: "flex", gap: "20px", paddingTop: "4px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((f) => ({ ...f, isPublished: checked, isFeatured: checked ? f.isFeatured : false }));
                    }}
                  />
                  공개
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked, isPublished: e.target.checked ? true : f.isPublished }))}
                  />
                  메인(홈) 노출
                </label>
              </div>

              <FormField label="노출 순서 (정수, 작을수록 먼저 표시)">
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
                  style={{ ...inputStyle, width: "120px" }}
                />
              </FormField>

              {formError && (
                <p style={{ fontSize: "0.82rem", color: "#B91C1C", margin: 0 }}>⚠️ {formError}</p>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button onClick={closeForm} style={secondaryBtnStyle}>취소</button>
                <button onClick={submitForm} disabled={saving || uploadingPoster} style={{ ...primaryBtnStyle, opacity: saving || uploadingPoster ? 0.6 : 1 }}>
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={modalOverlayStyle} onClick={() => !deleting && setConfirmDelete(null)}>
          <div style={{ ...modalStyle, maxWidth: "380px" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--navy)", marginBottom: "10px" }}>삭제 확인</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginBottom: "20px" }}>
              {confirmDelete.label}을(를) 삭제합니다. 연결된 포스터 이미지도 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setConfirmDelete(null)} disabled={deleting} style={secondaryBtnStyle}>취소</button>
              <button onClick={runDelete} disabled={deleting} style={{ ...dangerBtnStyle, opacity: deleting ? 0.6 : 1 }}>
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "6px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  fontSize: "0.72rem",
  fontWeight: 800,
  color: "var(--ink-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  verticalAlign: "middle",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1.5px solid var(--border)",
  borderRadius: "8px",
  fontSize: "0.85rem",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "9px 18px",
  background: "var(--navy)",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "0.82rem",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: "9px 18px",
  background: "#fff",
  color: "var(--ink-muted)",
  border: "1.5px solid var(--border)",
  borderRadius: "8px",
  fontSize: "0.82rem",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const dangerBtnStyle: React.CSSProperties = {
  padding: "9px 18px",
  background: "#DC2626",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "0.82rem",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const linkBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  color: "var(--navy)",
  fontSize: "0.8rem",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  textDecoration: "underline",
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(23, 20, 17, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "20px",
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "14px",
  padding: "28px",
  width: "100%",
  maxWidth: "520px",
  maxHeight: "88vh",
  overflowY: "auto",
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
};
