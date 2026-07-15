"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";
import { ArrayField, StringArrayField, labelStyle, inputStyle } from "@/components/admin/ArrayField";
import { detectResumeFileExtension, RESUME_FILE_ACCEPT } from "@/lib/resumeFileTypes";

interface AwardItem { year?: string | number; title?: string; result?: string; organization?: string; }
interface ReviewItem { title?: string; publication?: string; year?: string | number; url?: string; }
interface LinkItem { label?: string; url?: string; }

interface ConnectedArtist {
  relationId: string;
  role: string | null;
  start_year: number | null;
  end_year: number | null;
  is_current: boolean;
  is_primary: boolean;
  artist: { id: string; name: string; slug: string | null; profileImage: string | null } | null;
}

type AiDraftStatus = "not_started" | "processing" | "ready" | "failed" | "applied";

interface CompanyAiWork {
  title?: string; title_en?: string; year?: string; description?: string; role?: string;
  venue?: string; image_url?: string; video_url?: string; external_url?: string; artist_names?: string[];
}
interface CompanyAiAward { year?: string; title?: string; result?: string; organization?: string; }
interface CompanyAiLink { label?: string; url?: string; }
interface CompanyAiReviewHint { company_name?: string; work_title?: string; artist_names?: string[]; year?: string; confidence?: number; }
interface CompanyAiNeedsReview { field?: string; reason?: string; source_excerpt?: string; source_type?: string; }
interface CompanyAiMissingInfo { field?: string; message?: string; importance?: "required" | "recommended" | "optional"; }

interface CompanyAiDraft {
  name?: string;
  name_en?: string;
  genre?: string;
  category?: string;
  city_or_region?: string;
  bio_short?: string;
  bio?: string;
  current_activity: string[];
  works: CompanyAiWork[];
  awards: CompanyAiAward[];
  links: CompanyAiLink[];
  reviewSearchHints: CompanyAiReviewHint[];
  needsReview: CompanyAiNeedsReview[];
  missingInformation: CompanyAiMissingInfo[];
}

interface ApplicationSummary {
  id: string;
  logo_url: string | null;
  portfolio_text: string | null;
  resume_file_name: string | null;
}

type SourceType =
  | "application_portfolio_text"
  | "application_resume"
  | "admin_source_text"
  | "admin_source_file"
  | "existing_company_data";

type SourceStatus = "used" | "missing" | "empty" | "extraction_failed" | "skipped_duplicate";

interface SourceSummaryEntry {
  source_type: SourceType;
  status: SourceStatus;
  file_name?: string;
  file_size?: number;
  uploaded_at?: string;
  extracted_text_length?: number;
  included_text_length?: number;
  error?: string;
}

interface AiDraftSourceSummary {
  analyzed_at: string;
  total_input_chars: number;
  truncated: boolean;
  model?: string;
  sources: SourceSummaryEntry[];
}

const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  application_portfolio_text: "사용자 직접 입력 이력",
  application_resume: "최초 첨부 파일",
  admin_source_text: "관리자 보충 자료",
  admin_source_file: "관리자 최신 첨부 파일",
  existing_company_data: "기존 입력값",
};

// Only these 4 are surfaced in the "AI가 이번 분석에 사용한 자료" checklist —
// existing_company_data is tracked in ai_draft_source_summary too but isn't
// part of the checklist per the spec's example list.
const CHECKLIST_SOURCE_TYPES: SourceType[] = [
  "application_portfolio_text",
  "application_resume",
  "admin_source_text",
  "admin_source_file",
];

const IMPORTANCE_LABEL: Record<NonNullable<CompanyAiMissingInfo["importance"]>, string> = {
  required: "필수",
  recommended: "권장",
  optional: "참고",
};

interface CompanyDetail {
  id: string;
  name: string;
  name_en: string | null;
  slug: string | null;
  status: "draft" | "published" | "archived";
  verified: boolean;
  genre: string | null;
  category: string | null;
  city_or_region: string | null;
  bio_short: string | null;
  bio: string | null;
  profile_image_url: string | null;
  motion_video_url: string | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
  portfolio_url: string | null;
  current_activity: string[];
  works: any[];
  awards: AwardItem[];
  review_links: ReviewItem[];
  links: LinkItem[];
  connectedArtists: ConnectedArtist[];
  ai_draft: CompanyAiDraft | null;
  ai_draft_status: AiDraftStatus;
  ai_draft_error: string | null;
  ai_draft_generated_at: string | null;
  ai_draft_source_summary: AiDraftSourceSummary | null;
  application: ApplicationSummary | null;
  source_file_name: string | null;
  source_file_size: number | null;
  source_text: string | null;
  source_material_updated_at: string | null;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)}MB`;
}

/** Same default-selection rule as AiProfileCompare's singleFields: precheck
 * a field only when the current value is empty and the AI actually
 * suggested something — a conflicting existing value still needs the
 * admin's explicit checkbox before overwriting it. */
function computeDefaultSelectedFields(draft: CompanyAiDraft, current: CompanyDetail | null): Set<string> {
  const next = new Set<string>();
  for (const { key } of AI_SINGLE_FIELDS) {
    const currentValue = (current as any)?.[key] || "";
    const aiValue = (draft as any)?.[key] || "";
    if (!String(currentValue).trim() && String(aiValue).trim()) {
      next.add(key);
    }
  }
  return next;
}

const AI_STATUS_LABEL: Record<AiDraftStatus, string> = {
  not_started: "분석 전",
  processing: "분석 중",
  ready: "분석 완료",
  failed: "분석 실패",
  applied: "적용 완료",
};

const AI_SINGLE_FIELDS: { key: "name_en" | "genre" | "category" | "city_or_region" | "bio_short" | "bio"; label: string }[] = [
  { key: "name_en", label: "영문명" },
  { key: "genre", label: "장르" },
  { key: "category", label: "카테고리" },
  { key: "city_or_region", label: "활동 지역" },
  { key: "bio_short", label: "짧은 소개" },
  { key: "bio", label: "상세 소개" },
];

const AI_ARRAY_FIELDS: { key: "current_activity" | "works" | "awards" | "links"; label: string }[] = [
  { key: "current_activity", label: "CURRENT ACTIVITY" },
  { key: "works", label: "WORKS" },
  { key: "awards", label: "AWARDS" },
  { key: "links", label: "LINKS" },
];

type ArrayApplyMode = "skip" | "merge" | "replace";

interface AdminArtistOption { id: string; name: string; slug: string | null; profileImage: string; }

const fieldRowStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "6px" };

export default function AdminCompanyEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const companyId = params.id;

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  const [allArtists, setAllArtists] = useState<AdminArtistOption[]>([]);
  const [artistSearch, setArtistSearch] = useState("");
  const [selectedArtistId, setSelectedArtistId] = useState("");
  const [newRelation, setNewRelation] = useState({ role: "", start_year: "", end_year: "", is_current: true, is_primary: false });
  const [addingRelation, setAddingRelation] = useState(false);

  const [structuring, setStructuring] = useState(false);
  const [selectedAiFields, setSelectedAiFields] = useState<Set<string>>(new Set());
  const [aiArrayModes, setAiArrayModes] = useState<Record<string, ArrayApplyMode>>({
    current_activity: "merge", works: "merge", awards: "merge", links: "merge",
  });
  const [applyingAiDraft, setApplyingAiDraft] = useState(false);
  // Mirrors the personal-profile AI compare flow (components/profile/AiProfileCompare.tsx):
  // finishing analysis immediately pops open a compare-and-apply dialog
  // instead of leaving the admin to scroll down and hunt for it.
  const [showAiCompareModal, setShowAiCompareModal] = useState(false);

  const [sourceTextDraft, setSourceTextDraft] = useState("");
  const sourceTextInitialized = useRef(false);
  const [savingSourceMaterials, setSavingSourceMaterials] = useState(false);
  const [uploadingSourceFile, setUploadingSourceFile] = useState(false);
  const [deletingSourceFile, setDeletingSourceFile] = useState(false);
  const sourceFileInputRef = useRef<HTMLInputElement>(null);

  const authHeader = () => ({ "x-admin-passcode": sessionStorage.getItem("admin_passcode") || "" });

  const fetchCompany = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok && data.success) {
        setCompany({
          ...data.data,
          current_activity: Array.isArray(data.data.current_activity) ? data.data.current_activity : [],
          works: Array.isArray(data.data.works) ? data.data.works : [],
          awards: Array.isArray(data.data.awards) ? data.data.awards : [],
          review_links: Array.isArray(data.data.review_links) ? data.data.review_links : [],
          links: Array.isArray(data.data.links) ? data.data.links : [],
          ai_draft: data.data.ai_draft || null,
          ai_draft_status: data.data.ai_draft_status || "not_started",
          ai_draft_error: data.data.ai_draft_error || null,
          ai_draft_generated_at: data.data.ai_draft_generated_at || null,
          ai_draft_source_summary: data.data.ai_draft_source_summary || null,
          application: data.data.application || null,
          source_file_name: data.data.source_file_name || null,
          source_file_size: data.data.source_file_size || null,
          source_text: data.data.source_text || null,
          source_material_updated_at: data.data.source_material_updated_at || null,
        });
      } else {
        setError(data.error || "단체 정보를 불러오지 못했습니다.");
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchArtists = async () => {
    try {
      const res = await fetch("/api/admin/artists", { headers: authHeader() });
      const data = await res.json();
      if (res.ok && data.data) {
        setAllArtists(data.data.map((a: any) => ({ id: a.id, name: a.name, slug: a.slug, profileImage: a.profileImage })));
      }
    } catch {
      // Non-fatal — the artist picker just stays empty.
    }
  };

  useEffect(() => {
    if (!companyId) return;
    fetchCompany();
    fetchArtists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // Seed the draft textarea from the loaded company exactly once — later
  // fetchCompany() refreshes (e.g. after adding a connected artist) must
  // never clobber an admin's in-progress, unsaved edit to source_text.
  useEffect(() => {
    if (company && !sourceTextInitialized.current) {
      setSourceTextDraft(company.source_text || "");
      sourceTextInitialized.current = true;
    }
  }, [company]);

  const updateField = <K extends keyof CompanyDetail>(field: K, value: CompanyDetail[K]) => {
    setCompany((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          name: company.name,
          name_en: company.name_en,
          slug: company.slug,
          verified: company.verified,
          genre: company.genre,
          category: company.category,
          city_or_region: company.city_or_region,
          bio_short: company.bio_short,
          bio: company.bio,
          profile_image_url: company.profile_image_url,
          motion_video_url: company.motion_video_url,
          email: company.email,
          instagram: company.instagram,
          website: company.website,
          portfolio_url: company.portfolio_url,
          current_activity: company.current_activity,
          awards: company.awards,
          review_links: company.review_links,
          links: company.links,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "저장에 실패했습니다.");
        return;
      }
      alert("저장되었습니다.");
      await fetchCompany();
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusAction = async (action: "publish" | "unpublish" | "archive") => {
    setStatusActionLoading(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/${action}`, { method: "POST", headers: authHeader() });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "상태 변경에 실패했습니다.");
        return;
      }
      await fetchCompany();
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("이 단체를 완전히 삭제하면 연결된 아티스트 관계도 함께 삭제됩니다.\n정말 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, { method: "DELETE", headers: authHeader() });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "삭제에 실패했습니다.");
        return;
      }
      router.push("/admin/companies");
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  const submitNewRelation = async (confirmReplacePrimary = false) => {
    if (!selectedArtistId) {
      alert("아티스트를 선택해 주세요.");
      return;
    }
    setAddingRelation(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/artists`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          artist_id: selectedArtistId,
          role: newRelation.role || null,
          start_year: newRelation.start_year ? Number(newRelation.start_year) : null,
          end_year: newRelation.end_year ? Number(newRelation.end_year) : null,
          is_current: newRelation.is_current,
          is_primary: newRelation.is_primary,
          confirmReplacePrimary,
        }),
      });
      const data = await res.json();

      if (res.status === 409 && data.needsConfirmation) {
        const proceed = confirm(
          `이 아티스트는 이미 다른 단체(${data.conflictingCompanyName})를 현재 대표 소속으로 설정했습니다.\n기존 대표 소속을 해제하고 이 단체를 대표 소속으로 변경하시겠습니까?`
        );
        if (proceed) await submitNewRelation(true);
        return;
      }

      if (!res.ok || !data.success) {
        alert(data.error || "관계 생성에 실패했습니다.");
        return;
      }

      setSelectedArtistId("");
      setNewRelation({ role: "", start_year: "", end_year: "", is_current: true, is_primary: false });
      await fetchCompany();
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setAddingRelation(false);
    }
  };

  const updateRelation = async (relationId: string, patch: Record<string, any>, confirmReplacePrimary = false) => {
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/artists/${relationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ ...patch, confirmReplacePrimary }),
      });
      const data = await res.json();

      if (res.status === 409 && data.needsConfirmation) {
        const proceed = confirm(
          `이 아티스트는 이미 다른 단체(${data.conflictingCompanyName})를 현재 대표 소속으로 설정했습니다.\n기존 대표 소속을 해제하고 이 단체를 대표 소속으로 변경하시겠습니까?`
        );
        if (proceed) await updateRelation(relationId, patch, true);
        return;
      }

      if (!res.ok || !data.success) {
        alert(data.error || "관계 수정에 실패했습니다.");
        return;
      }
      await fetchCompany();
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  const deleteRelation = async (relationId: string) => {
    if (!confirm("이 연결을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/artists/${relationId}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "삭제에 실패했습니다.");
        return;
      }
      await fetchCompany();
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  const handleSaveSourceMaterials = async () => {
    if (sourceTextDraft.length > 30000) {
      alert("보충 자료는 30,000자 이하로 입력해주세요.");
      return;
    }
    setSavingSourceMaterials(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ source_text: sourceTextDraft }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "자료 저장에 실패했습니다.");
        return;
      }
      await fetchCompany();
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setSavingSourceMaterials(false);
    }
  };

  const handleSourceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (sourceFileInputRef.current) sourceFileInputRef.current.value = "";

    if (!detectResumeFileExtension(file.name, file.type)) {
      alert("PDF, DOCX, TXT 파일을 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert("파일 크기는 20MB를 초과할 수 없습니다.");
      return;
    }

    setUploadingSourceFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/companies/${companyId}/source-file`, {
        method: "POST",
        headers: authHeader(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "파일 업로드에 실패했습니다.");
        return;
      }
      await fetchCompany();
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setUploadingSourceFile(false);
    }
  };

  const handleSourceFileDelete = async () => {
    if (!confirm("관리자가 추가한 첨부 파일을 삭제하시겠습니까?")) return;
    setDeletingSourceFile(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/source-file`, {
        method: "DELETE",
        headers: authHeader(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "파일 삭제에 실패했습니다.");
        return;
      }
      await fetchCompany();
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setDeletingSourceFile(false);
    }
  };

  const handleSourceFileDownload = async () => {
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/source-file`, { headers: authHeader() });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "파일을 불러오지 못했습니다.");
        return;
      }
      window.open(data.url, "_blank");
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  const handleDownloadOriginalResume = async () => {
    if (!company?.application?.id) return;
    try {
      const res = await fetch(`/api/admin/organization-applications/${company.application.id}/resume`, { headers: authHeader() });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "파일을 불러오지 못했습니다.");
        return;
      }
      window.open(data.url, "_blank");
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  const handleAiStructure = async () => {
    if (sourceTextDraft !== (company?.source_text || "")) {
      alert("변경한 분석 자료를 먼저 저장해주세요.");
      return;
    }
    setStructuring(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/ai-structure`, {
        method: "POST",
        headers: authHeader(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "AI 구조화에 실패했습니다.");
      } else if (data.data) {
        // Analysis just finished — open the compare-and-apply dialog right
        // away instead of leaving the admin to scroll down for it.
        setSelectedAiFields(computeDefaultSelectedFields(data.data, company));
        setAiArrayModes({ current_activity: "merge", works: "merge", awards: "merge", links: "merge" });
        setShowAiCompareModal(true);
      }
      await fetchCompany();
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setStructuring(false);
    }
  };

  const toggleAiField = (key: string) => {
    setSelectedAiFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleApplyAiDraft = async () => {
    setApplyingAiDraft(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/apply-ai-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          fields: Array.from(selectedAiFields),
          arrays: aiArrayModes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "AI 초안 적용에 실패했습니다.");
        return;
      }
      setSelectedAiFields(new Set());
      setShowAiCompareModal(false);
      await fetchCompany();
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setApplyingAiDraft(false);
    }
  };

  if (loading) return <div style={{ padding: "60px 0" }}><LoadingSpinner message="단체 정보를 불러오는 중..." /></div>;
  if (error || !company) return <div style={{ padding: "40px 0" }}><ErrorMessage message={error || "단체를 찾을 수 없습니다."} /></div>;

  const filteredArtists = artistSearch.trim()
    ? allArtists.filter((a) => a.name.toLowerCase().includes(artistSearch.trim().toLowerCase()))
    : allArtists;

  return (
    <div style={{ maxWidth: "820px" }}>
      <div style={{ marginBottom: "24px", borderBottom: "1.5px solid var(--border)", paddingBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <Link href="/admin/companies" style={{ fontSize: "0.78rem", color: "var(--ink-muted)", textDecoration: "none" }}>← 단체 목록으로</Link>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--navy)", marginTop: "6px" }}>{company.name} 편집</h1>
          <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", marginTop: "4px" }}>
            현재 상태: <strong>{company.status === "draft" ? "초안" : company.status === "published" ? "공개" : "보관"}</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {company.slug && (
            <Link href={`/admin/companies/${companyId}/preview`} className="admin-action-btn" style={previewLinkStyle}>
              미리보기
            </Link>
          )}
          {company.status === "draft" && (
            <button onClick={() => handleStatusAction("publish")} disabled={statusActionLoading} style={primaryBtnStyle}>단체 공개하기</button>
          )}
          {company.status === "published" && (
            <button onClick={() => handleStatusAction("unpublish")} disabled={statusActionLoading} style={secondaryBtnStyle}>비공개로 전환</button>
          )}
          {company.status !== "archived" && (
            <button onClick={() => handleStatusAction("archive")} disabled={statusActionLoading} style={secondaryBtnStyle}>보관</button>
          )}
          <button onClick={handleDelete} style={dangerBtnStyle}>완전 삭제</button>
        </div>
      </div>

      {/* SOURCE MATERIALS */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>SOURCE MATERIALS (AI 분석 자료)</h2>

        <div style={{ marginBottom: "18px" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
            최초 신청 자료
          </span>
          {!company.application ? (
            <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)" }}>연결된 신청서가 없습니다.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.82rem" }}>
                <span style={{ color: "var(--ink-muted)" }}>첨부 파일:</span>
                {company.application.resume_file_name ? (
                  <button type="button" onClick={handleDownloadOriginalResume} style={{ ...secondaryBtnStyle, padding: "4px 10px", fontSize: "0.75rem" }}>
                    {company.application.resume_file_name}
                  </button>
                ) : (
                  <span style={{ color: "var(--ink-faint)" }}>없음</span>
                )}
              </div>
              <div style={fieldRowStyle}>
                <label style={labelStyle}>사용자 직접 입력 이력</label>
                <textarea
                  readOnly
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical", background: "#F8F9FA" }}
                  value={company.application.portfolio_text || "(입력 없음)"}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.82rem" }}>
                <span style={{ color: "var(--ink-muted)" }}>제출한 로고:</span>
                {company.application.logo_url ? (
                  <img
                    src={company.application.logo_url}
                    alt=""
                    style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ color: "var(--ink-faint)" }}>없음</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: "18px" }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
            관리자 추가 이력서
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", fontSize: "0.82rem" }}>
            {company.source_file_name ? (
              <span style={{ color: "var(--navy)", fontWeight: 700 }}>
                {company.source_file_name} · {formatFileSize(company.source_file_size)}
              </span>
            ) : (
              <span style={{ color: "var(--ink-faint)" }}>등록된 파일이 없습니다.</span>
            )}
            <input
              type="file"
              ref={sourceFileInputRef}
              accept={RESUME_FILE_ACCEPT}
              onChange={handleSourceFileSelect}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => sourceFileInputRef.current?.click()}
              disabled={uploadingSourceFile}
              style={{ ...secondaryBtnStyle, padding: "6px 12px", fontSize: "0.75rem" }}
            >
              {uploadingSourceFile ? "업로드 중..." : company.source_file_name ? "파일 교체" : "파일 업로드"}
            </button>
            {company.source_file_name && (
              <>
                <button type="button" onClick={handleSourceFileDownload} style={{ ...secondaryBtnStyle, padding: "6px 12px", fontSize: "0.75rem" }}>
                  다운로드
                </button>
                <button
                  type="button"
                  onClick={handleSourceFileDelete}
                  disabled={deletingSourceFile}
                  style={{ ...dangerBtnStyle, padding: "6px 12px", fontSize: "0.75rem" }}
                >
                  {deletingSourceFile ? "삭제 중..." : "삭제"}
                </button>
              </>
            )}
          </div>
          <p style={{ fontSize: "0.72rem", color: "var(--ink-muted)", marginTop: "6px" }}>
            PDF, DOCX, TXT 파일을 업로드할 수 있습니다. 20MB 이하의 이력서 또는 포트폴리오를 업로드해주세요.
          </p>
        </div>

        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>AI 분석용 보충 자료</label>
          <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", margin: "4px 0 8px", lineHeight: 1.6 }}>
            신청서나 이력서에 없는 최신 작품, 공연, 수상, 구성원 정보를 추가할 수 있습니다. 이 내용은 AI 구조화 입력에만 사용되며, 단체 소개에 자동 공개되지 않습니다.
          </p>
          <textarea
            rows={8}
            style={{ ...inputStyle, resize: "vertical" }}
            value={sourceTextDraft}
            onChange={(e) => setSourceTextDraft(e.target.value)}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
            <span style={{
              fontSize: "0.72rem",
              color: sourceTextDraft.length > 30000 ? "#DC2626" : "var(--ink-muted)",
              fontWeight: sourceTextDraft.length > 30000 ? 700 : 400,
            }}>
              {sourceTextDraft.length.toLocaleString()} / 30,000자
            </span>
            <button
              type="button"
              onClick={handleSaveSourceMaterials}
              disabled={savingSourceMaterials || sourceTextDraft === (company.source_text || "")}
              style={{ ...primaryBtnStyle, padding: "8px 16px" }}
            >
              {savingSourceMaterials ? "저장 중..." : "자료 저장"}
            </button>
          </div>
        </div>

        <div style={{
          background: "#F8F9FA",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "14px 16px",
          fontSize: "0.8rem",
          color: "var(--navy)",
          lineHeight: 1.9,
        }}>
          <strong style={{ display: "block", marginBottom: "6px", fontSize: "0.72rem", color: "var(--ink-faint)", textTransform: "uppercase" }}>
            AI 분석 예정 자료
          </strong>
          <div>직접 입력 이력: {(company.application?.portfolio_text?.length || 0).toLocaleString()}자</div>
          <div>최초 첨부 파일: {company.application?.resume_file_name || "없음"}</div>
          <div>관리자 보충 자료: {(company.source_text?.length || 0).toLocaleString()}자</div>
          <div>관리자 최신 파일: {company.source_file_name || "없음"}</div>
        </div>

        <div style={{ marginTop: "14px", fontSize: "0.78rem", color: "var(--ink-muted)" }}>
          마지막 AI 분석 시각: {company.ai_draft_generated_at ? new Date(company.ai_draft_generated_at).toLocaleString("ko-KR") : "아직 분석하지 않음"}
          {company.ai_draft_source_summary?.truncated && (
            <span style={{ color: "#B45309", fontWeight: 700 }}> · 50,000자 제한으로 일부 자료가 잘렸습니다.</span>
          )}
        </div>

        {/* AI가 실제로 사용한 자료 체크리스트 — live 데이터가 아니라 마지막 실행 시
            저장된 ai_draft_source_summary를 기준으로 표시 (실행 이후 자료가 바뀌었을
            수 있으므로 "지금 상태"가 아니라 "그때 무엇을 읽었는지"를 보여준다). */}
        {company.ai_draft_source_summary && (
          <div style={{ marginTop: "12px" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
              AI가 이번 분석에 사용한 자료
            </span>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
              {CHECKLIST_SOURCE_TYPES.map((type) => {
                const entry = company.ai_draft_source_summary!.sources.find((s) => s.source_type === type);
                const label = SOURCE_TYPE_LABEL[type];
                if (!entry) return null;

                if (entry.status === "used") {
                  const detail = entry.file_name
                    ? ` (${entry.file_name}${typeof entry.included_text_length === "number" ? `, ${entry.included_text_length.toLocaleString()}자` : ""})`
                    : typeof entry.included_text_length === "number"
                      ? ` (${entry.included_text_length.toLocaleString()}자)`
                      : "";
                  return (
                    <li key={type} style={{ fontSize: "0.8rem", color: "var(--navy)" }}>
                      ✓ {label} 사용{detail}
                    </li>
                  );
                }
                if (entry.status === "extraction_failed") {
                  return (
                    <li key={type} style={{ fontSize: "0.8rem", color: "#B45309" }}>
                      ⚠ {label} 텍스트 추출 실패{entry.file_name ? ` (${entry.file_name})` : ""}
                    </li>
                  );
                }
                if (entry.status === "skipped_duplicate") {
                  return (
                    <li key={type} style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>
                      ↳ {label}: 최초 첨부 이력서와 내용이 같아 중복 제외
                    </li>
                  );
                }
                // missing / empty
                return (
                  <li key={type} style={{ fontSize: "0.8rem", color: "var(--ink-faint)" }}>
                    — {label} 없음
                  </li>
                );
              })}
            </ul>
          </div>
        )}

      </section>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={handleAiStructure}
          disabled={structuring || company.ai_draft_status === "processing"}
          style={{ ...secondaryBtnStyle, width: "100%", padding: "12px" }}
        >
          {structuring || company.ai_draft_status === "processing" ? "AI 분석 중..." : "AI로 신청 자료 구조화"}
        </button>
      </div>

      {/* Basic fields */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>기본 정보</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }} className="admin-form-grid">
          <div style={fieldRowStyle}>
            <label style={labelStyle}>단체명</label>
            <input style={inputStyle} value={company.name} onChange={(e) => updateField("name", e.target.value)} />
          </div>
          <div style={fieldRowStyle}>
            <label style={labelStyle}>영문명</label>
            <input style={inputStyle} value={company.name_en || ""} onChange={(e) => updateField("name_en", e.target.value)} />
          </div>
          <div style={fieldRowStyle}>
            <label style={labelStyle}>slug</label>
            <input style={inputStyle} value={company.slug || ""} onChange={(e) => updateField("slug", e.target.value)} />
          </div>
          <div style={fieldRowStyle}>
            <label style={labelStyle}>인증 여부</label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--navy)" }}>
              <input type="checkbox" checked={company.verified} onChange={(e) => updateField("verified", e.target.checked)} />
              POPOK VERIFIED
            </label>
          </div>
          <div style={fieldRowStyle}>
            <label style={labelStyle}>장르</label>
            <input style={inputStyle} value={company.genre || ""} onChange={(e) => updateField("genre", e.target.value)} />
          </div>
          <div style={fieldRowStyle}>
            <label style={labelStyle}>카테고리</label>
            <input style={inputStyle} value={company.category || ""} onChange={(e) => updateField("category", e.target.value)} />
          </div>
          <div style={fieldRowStyle}>
            <label style={labelStyle}>활동 지역</label>
            <input style={inputStyle} value={company.city_or_region || ""} onChange={(e) => updateField("city_or_region", e.target.value)} />
          </div>
          <div style={fieldRowStyle}>
            <label style={labelStyle}>대표 이미지 URL</label>
            <input style={inputStyle} value={company.profile_image_url || ""} onChange={(e) => updateField("profile_image_url", e.target.value)} />
          </div>
          <div style={fieldRowStyle}>
            <label style={labelStyle}>이메일</label>
            <input style={inputStyle} value={company.email || ""} onChange={(e) => updateField("email", e.target.value)} />
          </div>
          <div style={fieldRowStyle}>
            <label style={labelStyle}>인스타그램</label>
            <input style={inputStyle} value={company.instagram || ""} onChange={(e) => updateField("instagram", e.target.value)} />
          </div>
          <div style={fieldRowStyle}>
            <label style={labelStyle}>웹사이트</label>
            <input style={inputStyle} value={company.website || ""} onChange={(e) => updateField("website", e.target.value)} />
          </div>
          <div style={fieldRowStyle}>
            <label style={labelStyle}>포트폴리오 URL</label>
            <input style={inputStyle} value={company.portfolio_url || ""} onChange={(e) => updateField("portfolio_url", e.target.value)} />
          </div>
        </div>
        <div style={{ ...fieldRowStyle, marginTop: "14px" }}>
          <label style={labelStyle}>짧은 소개 (bio_short)</label>
          <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={company.bio_short || ""} onChange={(e) => updateField("bio_short", e.target.value)} />
        </div>
        <div style={{ ...fieldRowStyle, marginTop: "14px" }}>
          <label style={labelStyle}>상세 소개 (bio)</label>
          <textarea rows={4} style={{ ...inputStyle, resize: "vertical" }} value={company.bio || ""} onChange={(e) => updateField("bio", e.target.value)} />
        </div>
      </section>

      {/* JSONB repeating fields */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>활동 및 기록</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <StringArrayField
            label="CURRENT ACTIVITY"
            items={company.current_activity}
            onChange={(items) => updateField("current_activity", items)}
            placeholder="예: 2026 신작 창작 중"
          />
          <ArrayField<AwardItem>
            label="AWARDS"
            items={company.awards}
            onChange={(items) => updateField("awards", items)}
            newItem={() => ({})}
            renderItem={(item, set) => (
              <>
                <input style={inputStyle} placeholder="연도" value={item.year ?? ""} onChange={(e) => set({ ...item, year: e.target.value })} />
                <input style={inputStyle} placeholder="수상명" value={item.title || ""} onChange={(e) => set({ ...item, title: e.target.value })} />
                <input style={inputStyle} placeholder="결과 (예: 대상)" value={item.result || ""} onChange={(e) => set({ ...item, result: e.target.value })} />
                <input style={inputStyle} placeholder="주최 기관" value={item.organization || ""} onChange={(e) => set({ ...item, organization: e.target.value })} />
              </>
            )}
          />
          <ArrayField<ReviewItem>
            label="REVIEW LINKS"
            items={company.review_links}
            onChange={(items) => updateField("review_links", items)}
            newItem={() => ({})}
            renderItem={(item, set) => (
              <>
                <input style={inputStyle} placeholder="제목" value={item.title || ""} onChange={(e) => set({ ...item, title: e.target.value })} />
                <input style={inputStyle} placeholder="매체명" value={item.publication || ""} onChange={(e) => set({ ...item, publication: e.target.value })} />
                <input style={inputStyle} placeholder="연도" value={item.year ?? ""} onChange={(e) => set({ ...item, year: e.target.value })} />
                <input style={inputStyle} placeholder="URL" value={item.url || ""} onChange={(e) => set({ ...item, url: e.target.value })} />
              </>
            )}
          />
          <ArrayField<LinkItem>
            label="LINKS"
            items={company.links}
            onChange={(items) => updateField("links", items)}
            newItem={() => ({})}
            renderItem={(item, set) => (
              <>
                <input style={inputStyle} placeholder="라벨" value={item.label || ""} onChange={(e) => set({ ...item, label: e.target.value })} />
                <input style={inputStyle} placeholder="URL" value={item.url || ""} onChange={(e) => set({ ...item, url: e.target.value })} />
              </>
            )}
          />
          <div style={fieldRowStyle}>
            <label style={labelStyle}>WORKS (읽기 전용 원문 — 단체 상세 페이지 기획과 함께 확장 예정)</label>
            <textarea
              readOnly
              rows={6}
              style={{ ...inputStyle, fontFamily: "monospace", fontSize: "0.72rem", background: "#F8F9FA", resize: "vertical" }}
              value={JSON.stringify(company.works, null, 2)}
            />
          </div>
        </div>
      </section>

      <div style={{ marginBottom: "32px" }}>
        <button onClick={handleSave} disabled={saving} style={{ ...primaryBtnStyle, width: "100%", padding: "12px" }}>
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>

      {/* AI STRUCTURED DRAFT — full comparison lives in the modal below;
          finishing a run opens it automatically (see handleAiStructure). */}
      <section style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>AI STRUCTURED DRAFT</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              fontSize: "0.72rem", fontWeight: 800, padding: "3px 10px", borderRadius: "999px",
              background: company.ai_draft_status === "failed" ? "#FEF2F2" : company.ai_draft_status === "ready" ? "#ECFDF5" : company.ai_draft_status === "applied" ? "#EFF6FF" : "#F1F5F9",
              color: company.ai_draft_status === "failed" ? "#DC2626" : company.ai_draft_status === "ready" ? "var(--verified)" : company.ai_draft_status === "applied" ? "#1D4ED8" : "var(--ink-muted)",
            }}>
              {AI_STATUS_LABEL[company.ai_draft_status] || "분석 전"}
            </span>
            {company.ai_draft && (
              <button
                type="button"
                onClick={() => {
                  setSelectedAiFields(computeDefaultSelectedFields(company.ai_draft!, company));
                  setShowAiCompareModal(true);
                }}
                style={{ ...secondaryBtnStyle, padding: "6px 12px", fontSize: "0.75rem" }}
              >
                비교 및 적용 열기
              </button>
            )}
          </div>
        </div>

        {company.ai_draft_status === "failed" && company.ai_draft_error && (
          <p style={{ fontSize: "0.82rem", color: "#DC2626", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "10px 14px", marginTop: "16px" }}>
            {company.ai_draft_error}
          </p>
        )}

        {!company.ai_draft && (
          <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", marginTop: "16px" }}>
            아직 AI 초안이 없습니다. 위의 "AI로 신청 자료 구조화" 버튼을 눌러 생성해 주세요.
          </p>
        )}
      </section>

      {showAiCompareModal && company.ai_draft && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed", inset: 0, background: "rgba(23, 20, 17, 0.5)", zIndex: 1000,
            display: "flex", justifyContent: "center", padding: "40px 16px", overflowY: "auto",
          }}
          onClick={() => setShowAiCompareModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: "16px", maxWidth: "760px", width: "100%",
              height: "fit-content", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", margin: 0 }}>AI 분석 결과 비교</h2>
              <button
                type="button"
                onClick={() => setShowAiCompareModal(false)}
                aria-label="닫기"
                style={{ border: "none", background: "none", fontSize: "1.3rem", lineHeight: 1, cursor: "pointer", color: "var(--ink-muted)" }}
              >
                ×
              </button>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", marginBottom: "20px" }}>
              기존 데이터와 AI 제안을 비교했습니다. 반영할 항목을 선택하고 적용하세요.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Single-field comparison */}
              <div>
                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  단일 필드 비교
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {AI_SINGLE_FIELDS.map(({ key, label }) => {
                    const currentValue = (company as any)[key] || "(없음)";
                    const aiValue = company.ai_draft?.[key] || "";
                    return (
                      <div key={key} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--navy)" }}>{label}</span>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: "var(--ink-muted)" }}>
                            <input
                              type="checkbox"
                              disabled={!aiValue}
                              checked={selectedAiFields.has(key)}
                              onChange={() => toggleAiField(key)}
                            />
                            AI 제안 적용
                          </label>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.78rem" }} className="admin-form-grid">
                          <div>
                            <span style={{ color: "var(--ink-faint)", display: "block", fontSize: "0.65rem" }}>현재 값</span>
                            <span style={{ color: "var(--ink-muted)" }}>{currentValue || "(없음)"}</span>
                          </div>
                          <div>
                            <span style={{ color: "var(--ink-faint)", display: "block", fontSize: "0.65rem" }}>AI 제안</span>
                            <span style={{ color: "var(--navy)", fontWeight: 700 }}>{aiValue || "(제안 없음)"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Array field apply modes */}
              <div>
                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  배열 필드 반영 방식
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {AI_ARRAY_FIELDS.map(({ key, label }) => {
                    const aiCount = Array.isArray(company.ai_draft?.[key]) ? (company.ai_draft as any)[key].length : 0;
                    return (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px" }}>
                        <div>
                          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)" }}>{label}</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", marginLeft: "8px" }}>AI 제안 {aiCount}건</span>
                        </div>
                        <select
                          value={aiArrayModes[key]}
                          onChange={(e) => setAiArrayModes({ ...aiArrayModes, [key]: e.target.value as ArrayApplyMode })}
                          style={{ padding: "6px 10px", borderRadius: "6px", border: "1.5px solid var(--border)", fontSize: "0.75rem", fontFamily: "inherit" }}
                        >
                          <option value="skip">적용하지 않음</option>
                          <option value="merge">기존 데이터에 병합</option>
                          <option value="replace">AI 결과로 교체</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {(company.ai_draft.reviewSearchHints?.length > 0 || company.ai_draft.needsReview?.length > 0 || company.ai_draft.missingInformation?.length > 0) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {company.ai_draft.missingInformation?.length > 0 && (
                    <div>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                        추가로 필요한 정보 (참고용 — 자동 반영되지 않음)
                      </span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {(["required", "recommended", "optional"] as const).map((level) => {
                          const items = company.ai_draft!.missingInformation.filter((m) => (m.importance || "recommended") === level);
                          if (items.length === 0) return null;
                          return (
                            <div key={level}>
                              <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "var(--navy)" }}>{IMPORTANCE_LABEL[level]}</span>
                              <ul style={{ margin: "4px 0 0", paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "2px" }}>
                                {items.map((item, idx) => (
                                  <li key={idx} style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                                    <strong style={{ color: "var(--navy)" }}>{item.field}</strong>: {item.message}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {company.ai_draft.needsReview?.length > 0 && (
                    <div>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#B45309", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                        NEEDS REVIEW (참고용)
                      </span>
                      <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {company.ai_draft.needsReview.map((item, idx) => (
                          <li key={idx} style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                            <strong style={{ color: "var(--navy)" }}>{item.field}</strong>: {item.reason}
                            {item.source_excerpt && <span style={{ color: "var(--ink-faint)" }}> — “{item.source_excerpt}”</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {company.ai_draft.reviewSearchHints?.length > 0 && (
                    <div>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                        REVIEW SEARCH HINTS (참고용 — 다음 단계에서 리뷰 검색에 사용 예정)
                      </span>
                      <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {company.ai_draft.reviewSearchHints.map((hint, idx) => (
                          <li key={idx} style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                            {[hint.company_name, hint.work_title, hint.artist_names?.join(", "), hint.year].filter(Boolean).join(" · ")}
                            {typeof hint.confidence === "number" && <span style={{ color: "var(--ink-faint)" }}> (신뢰도 {hint.confidence})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAiCompareModal(false)}
                  style={{ ...secondaryBtnStyle, flex: 1, padding: "12px" }}
                >
                  닫기
                </button>
                <button
                  onClick={handleApplyAiDraft}
                  disabled={applyingAiDraft}
                  style={{ ...primaryBtnStyle, flex: 1.6, padding: "12px" }}
                >
                  {applyingAiDraft ? "적용 중..." : "선택 적용"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONNECTED ARTISTS */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>CONNECTED ARTISTS</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
          {company.connectedArtists.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>연결된 아티스트가 없습니다.</p>
          ) : (
            company.connectedArtists.map((rel) => (
              <div key={rel.relationId} style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "12px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <img
                  src={rel.artist?.profileImage || "/images/placeholders/cake-placeholder.png"}
                  alt=""
                  style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                />
                <div style={{ flexGrow: 1, minWidth: "160px" }}>
                  <div style={{ fontWeight: 800, color: "var(--navy)", fontSize: "0.88rem" }}>
                    {rel.artist?.name || "(삭제된 아티스트)"}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>
                    {[rel.role, rel.start_year && rel.end_year ? `${rel.start_year}–${rel.end_year}` : rel.start_year ? `${rel.start_year}~` : null]
                      .filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <input type="checkbox" checked={rel.is_current} onChange={(e) => updateRelation(rel.relationId, { is_current: e.target.checked })} />
                    현재
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <input type="checkbox" checked={rel.is_primary} onChange={(e) => updateRelation(rel.relationId, { is_primary: e.target.checked })} />
                    대표
                  </label>
                </div>
                {rel.artist?.slug && (
                  <Link href={`/artists/${rel.artist.slug}`} target="_blank" style={{ fontSize: "0.72rem", color: "var(--navy)", fontWeight: 700 }}>
                    개인 페이지 →
                  </Link>
                )}
                <button onClick={() => deleteRelation(rel.relationId)} style={{ ...dangerBtnStyle, padding: "5px 10px", fontSize: "0.72rem" }}>삭제</button>
              </div>
            ))
          )}
        </div>

        <div style={{ border: "1.5px dashed var(--border-dark)", borderRadius: "12px", padding: "16px" }}>
          <label style={labelStyle}>아티스트 검색 후 연결 추가</label>
          <input
            style={{ ...inputStyle, marginBottom: "8px" }}
            placeholder="아티스트 이름 검색..."
            value={artistSearch}
            onChange={(e) => setArtistSearch(e.target.value)}
          />
          {artistSearch.trim() && (
            <div style={{ maxHeight: "160px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "8px", marginBottom: "10px" }}>
              {filteredArtists.length === 0 ? (
                <div style={{ padding: "10px", fontSize: "0.78rem", color: "var(--ink-muted)" }}>일치하는 아티스트가 없습니다.</div>
              ) : (
                filteredArtists.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { setSelectedArtistId(a.id); setArtistSearch(a.name); }}
                    style={{
                      display: "block", width: "100%", textAlign: "left", padding: "8px 10px",
                      background: selectedArtistId === a.id ? "var(--accent-light)" : "#fff",
                      border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem",
                    }}
                  >
                    {a.name}
                  </button>
                ))
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px", marginBottom: "10px" }}>
            <input style={inputStyle} placeholder="역할 (선택)" value={newRelation.role} onChange={(e) => setNewRelation({ ...newRelation, role: e.target.value })} />
            <input style={inputStyle} type="number" placeholder="시작연도" value={newRelation.start_year} onChange={(e) => setNewRelation({ ...newRelation, start_year: e.target.value })} />
            <input style={inputStyle} type="number" placeholder="종료연도" value={newRelation.end_year} onChange={(e) => setNewRelation({ ...newRelation, end_year: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "12px", fontSize: "0.8rem", color: "var(--navy)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input type="checkbox" checked={newRelation.is_current} onChange={(e) => setNewRelation({ ...newRelation, is_current: e.target.checked })} />
              현재 소속
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input type="checkbox" checked={newRelation.is_primary} onChange={(e) => setNewRelation({ ...newRelation, is_primary: e.target.checked })} />
              대표 소속
            </label>
          </div>
          <button onClick={() => submitNewRelation(false)} disabled={addingRelation || !selectedArtistId} style={primaryBtnStyle}>
            {addingRelation ? "연결 중..." : "연결 추가"}
          </button>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .admin-form-grid { grid-template-columns: 1fr !important; }
        }
      `}} />
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid var(--border)",
  borderRadius: "14px",
  padding: "20px",
  marginBottom: "20px",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "1rem",
  fontWeight: 800,
  color: "var(--navy)",
  marginBottom: "16px",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "var(--navy)",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "0.8rem",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#fff",
  color: "var(--navy)",
  border: "1.5px solid var(--border-dark)",
  borderRadius: "8px",
  fontSize: "0.8rem",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const dangerBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#FEF2F2",
  color: "#DC2626",
  border: "1.5px solid #FCA5A5",
  borderRadius: "8px",
  fontSize: "0.8rem",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const previewLinkStyle: React.CSSProperties = {
  padding: "8px 16px",
  background: "#fff",
  color: "var(--navy)",
  border: "1.5px solid var(--border-dark)",
  borderRadius: "8px",
  fontSize: "0.8rem",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};
