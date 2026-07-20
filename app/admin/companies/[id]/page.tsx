"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";
import { ArrayField, StringArrayField, labelStyle, inputStyle } from "@/components/admin/ArrayField";
import { detectResumeFileExtension, RESUME_FILE_ACCEPT } from "@/lib/resumeFileTypes";
import { normalizeWorkImages, creditsToDisplayString } from "@/lib/company-works";

// Public Preview Components — kept in lockstep with app/companies/[slug]/CompanyClientView.tsx
// so the admin Live Preview never drifts from the real public page structure.
import CompanyCardStack from "@/components/company/CompanyCardStack";
import CompanyBrochureHeader from "@/components/company/CompanyBrochureHeader";
import CompanyIdentity from "@/components/company/CompanyIdentity";
import CompanyPortfolio from "@/components/company/CompanyPortfolio";
import CompanyHistory from "@/components/company/CompanyHistory";
import CompanyArtists from "@/components/company/CompanyArtists";
import CompanyContact from "@/components/company/CompanyContact";

interface AwardItem { year?: string | number; title?: string; result?: string; organization?: string; }
interface ReviewItem { title?: string; publication?: string; source?: string; year?: string | number; url?: string; }
interface LinkItem { label?: string; url?: string; }

interface ConnectedArtist {
  relationId: string;
  role: string | null;
  start_year: number | null;
  end_year: number | null;
  is_current: boolean;
  is_primary: boolean;
  artist: {
    id: string;
    name: string;
    name_en: string | null;
    slug: string | null;
    profileImage: string | null;
    instagram: string | null;
    website: string | null;
    email: string | null;
  } | null;
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

const CHECKLIST_SOURCE_TYPES: SourceType[] = [
  "application_portfolio_text",
  "application_resume",
  "admin_source_text",
  "admin_source_file",
];

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
  profile_image_urls: string[];
  logo_url: string | null;
  motion_video_url: string | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
  portfolio_url: string | null;
  current_activity: any[]; // Backs projects
  works: any[];
  awards: AwardItem[];
  review_links: ReviewItem[]; // Backs press links
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

  // Branding DB fields
  founded_year: number | null;
  brand_color: string | null;
  mission: string | null;
  vision: string | null;
  core_values: string[] | null; // Backs values
  history: Array<{ year: string; event: string }> | null;
  view_count: number | null;
  hero_image_url?: string | null;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)}MB`;
}

const AI_STATUS_LABEL: Record<AiDraftStatus, string> = {
  not_started: "분석 전",
  processing: "분석 중",
  ready: "분석 완료",
  failed: "분석 실패",
  applied: "적용 완료",
};

interface AdminArtistOption { id: string; name: string; slug: string | null; profileImage: string; }

const fieldRowStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "6px" };

// Hover highlight & Floating Edit button for Tab 1
function EditableSection({
  title,
  onEdit,
  isEmpty,
  children,
}: {
  title: string;
  onEdit: () => void;
  isEmpty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="editable-section-wrapper"
      style={{
        position: "relative",
        margin: "16px 0",
        border: "1.5px dashed transparent",
        borderRadius: "16px",
        padding: "8px",
        transition: "border-color 0.2s",
      }}
    >
      <style jsx>{`
        .editable-section-wrapper:hover {
          border-color: var(--navy) !important;
        }
        .edit-hover-btn {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .editable-section-wrapper:hover .edit-hover-btn {
          opacity: 1;
        }
      `}</style>
      
      {/* Floating Edit Button */}
      <button
        type="button"
        onClick={onEdit}
        className="edit-hover-btn"
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          zIndex: 40,
          background: "var(--navy)",
          color: "#FFFFFF",
          border: "none",
          borderRadius: "8px",
          padding: "8px 16px",
          fontSize: "0.82rem",
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(23, 20, 17, 0.2)",
        }}
      >
        ✏️ {title} 편집
      </button>

      {isEmpty && (
        <div style={{
          position: "absolute",
          bottom: "16px",
          left: "16px",
          zIndex: 40,
          background: "#FFFBEB",
          color: "#B45309",
          border: "1px solid #FCD34D",
          borderRadius: "6px",
          padding: "4px 10px",
          fontSize: "0.72rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
        }}>
          <span>⚠</span>
          <span>{title} 미입력 상태 (임시 예시 문구 노출 중)</span>
        </div>
      )}

      {children}
    </div>
  );
}

export default function AdminCompanyEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const companyId = params.id;

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [initialCompany, setInitialCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"preview" | "edit">("edit");
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({
    basic: true, hero: true, identity: true, works: true, history: true, projects: true, artists: true, contact: true, awards: true, links: true
  });

  const [allArtists, setAllArtists] = useState<AdminArtistOption[]>([]);
  const [artistSearch, setArtistSearch] = useState("");
  const [selectedArtistId, setSelectedArtistId] = useState("");
  const [newRelation, setNewRelation] = useState({ role: "", start_year: "", end_year: "", is_current: true, is_primary: false });
  const [addingRelation, setAddingRelation] = useState(false);

  const [structuring, setStructuring] = useState(false);

  const [sourceTextDraft, setSourceTextDraft] = useState("");
  const sourceTextInitialized = useRef(false);
  const [savingSourceMaterials, setSavingSourceMaterials] = useState(false);
  const [uploadingSourceFile, setUploadingSourceFile] = useState(false);
  const [deletingSourceFile, setDeletingSourceFile] = useState(false);
  const sourceFileInputRef = useRef<HTMLInputElement>(null);

  const authHeader = () => ({ "x-admin-passcode": sessionStorage.getItem("admin_passcode") || "" });

  const handleUploadSingleImage = async (field: "profile_image_url" | "hero_image_url", file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "artist-media");
    formData.append("path", `companies/${field}`);
    
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        updateField(field, data.url);
        alert("이미지 업로드가 완료되었습니다.");
      } else {
        alert(data.error || "이미지 업로드에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  const handleUploadSliderImage = async (idx: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "artist-media");
    formData.append("path", `companies/slider`);
    
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        const newUrls = company ? [...company.profile_image_urls] : [];
        newUrls[idx] = data.url;
        updateField("profile_image_urls", newUrls);
        alert("이미지 업로드가 완료되었습니다.");
      } else {
        alert(data.error || "이미지 업로드에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  // Admin only ever manages ONE representative image (images[0]) — any
  // additional images[1..3] set via the self-serve CMS are preserved as-is,
  // never truncated just because this screen doesn't have slots to show them.
  const handleUploadWorkImage = async (idx: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "artist-media");
    formData.append("path", `companies/works`);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        const newWorks = company ? [...company.works] : [];
        if (newWorks[idx]) {
          const existingImages = normalizeWorkImages(newWorks[idx]);
          const nextImages = [data.url, ...existingImages.slice(1)];
          newWorks[idx] = { ...newWorks[idx], images: nextImages };
          updateField("works", newWorks);
          alert("이미지 업로드가 완료되었습니다.");
        }
      } else {
        alert(data.error || "이미지 업로드에 실패했습니다.");
      }
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    }
  };

  // Replaces only the representative slot (images[0]) from a manually-typed
  // URL — same preserve-the-rest rule as the uploader above.
  const handleSetWorkRepresentativeImageUrl = (idx: number, url: string) => {
    if (!company) return;
    const newWorks = [...company.works];
    const existingImages = normalizeWorkImages(newWorks[idx]);
    const trimmed = url.trim();
    const nextImages = trimmed ? [trimmed, ...existingImages.slice(1)] : existingImages.slice(1);
    newWorks[idx] = { ...newWorks[idx], images: nextImages };
    updateField("works", newWorks);
  };

  // Removes only the representative image (images[0]); any images[1..3] added
  // via the CMS shift up and are kept — this is NOT "delete all images".
  const handleRemoveWorkRepresentativeImage = (idx: number) => {
    if (!company) return;
    const newWorks = [...company.works];
    const existingImages = normalizeWorkImages(newWorks[idx]);
    newWorks[idx] = { ...newWorks[idx], images: existingImages.slice(1) };
    updateField("works", newWorks);
  };

  const handleJumpToEdit = (panelKey: string) => {
    setActiveTab("edit");
    setExpandedPanels((prev) => ({ ...prev, [panelKey]: true }));
    setTimeout(() => {
      const el = document.getElementById(`panel-${panelKey}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const fetchCompany = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok && data.success) {
        const mapped: CompanyDetail = {
          ...data.data,
          current_activity: Array.isArray(data.data.current_activity) ? data.data.current_activity : [],
          works: Array.isArray(data.data.works) ? data.data.works : [],
          awards: Array.isArray(data.data.awards) ? data.data.awards : [],
          review_links: Array.isArray(data.data.review_links) ? data.data.review_links : [],
          links: Array.isArray(data.data.links) ? data.data.links : [],
          core_values: Array.isArray(data.data.core_values) ? data.data.core_values : [],
          history: Array.isArray(data.data.history) ? data.data.history : [],
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
        };
        setCompany(mapped);
        setInitialCompany(JSON.parse(JSON.stringify(mapped)));
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
      // Non-fatal
    }
  };

  useEffect(() => {
    if (!companyId) return;
    fetchCompany();
    fetchArtists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // Warning on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const initialStr = initialCompany ? JSON.stringify(initialCompany) : "";
      const currentStr = company ? JSON.stringify(company) : "";
      if (initialStr && currentStr && initialStr !== currentStr) {
        e.preventDefault();
        e.returnValue = "저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [company, initialCompany]);

  useEffect(() => {
    if (company && !sourceTextInitialized.current) {
      setSourceTextDraft(company.source_text || "");
      sourceTextInitialized.current = true;
    }
  }, [company]);

  const updateField = <K extends keyof CompanyDetail>(field: K, value: CompanyDetail[K]) => {
    setCompany((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const togglePanel = (panelKey: string) => {
    setExpandedPanels((prev) => ({ ...prev, [panelKey]: !prev[panelKey] }));
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
          works: company.works,
          
          // branding columns
          founded_year: company.founded_year,
          brand_color: company.brand_color,
          mission: company.mission,
          vision: company.vision,
          core_values: company.core_values,
          history: company.history,
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

  const handleRevert = () => {
    if (!initialCompany) return;
    if (confirm("변경한 내용을 모두 지우고 마지막 저장 상태로 되돌리시겠습니까?")) {
      setCompany(JSON.parse(JSON.stringify(initialCompany)));
      setSourceTextDraft(initialCompany.source_text || "");
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
      setArtistSearch("");
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
      } else {
        alert("AI 구조화 분석이 완료되었으며, 추출된 정보가 단체 프로필 편집 영역에 자동 반영되었습니다.");
      }
      await fetchCompany();
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setStructuring(false);
    }
  };

  if (loading) return <div style={{ padding: "60px 0" }}><LoadingSpinner message="단체 정보를 불러오는 중..." /></div>;
  if (error || !company) return <div style={{ padding: "40px 0" }}><ErrorMessage message={error || "단체를 찾을 수 없습니다."} /></div>;

  const filteredArtists = artistSearch.trim()
    ? allArtists.filter((a) => a.name.toLowerCase().includes(artistSearch.trim().toLowerCase()))
    : allArtists;

  const initialStr = initialCompany ? JSON.stringify(initialCompany) : "";
  const currentStr = company ? JSON.stringify(company) : "";
  const hasUnsavedChanges = initialStr && currentStr && initialStr !== currentStr;

  // Adapter for preview rendering
  const adaptedCompany = {
    ...company,
    slogan: company.bio_short ? company.bio_short : null,
    values: Array.isArray(company.core_values) ? company.core_values : [],
    projects: Array.isArray(company.current_activity) ? company.current_activity : [],
    press_links: Array.isArray(company.review_links) ? company.review_links : [],

    // safe lists
    core_values: Array.isArray(company.core_values) ? company.core_values : [],
    current_activity: Array.isArray(company.current_activity) ? company.current_activity : [],
    review_links: Array.isArray(company.review_links) ? company.review_links : [],
    works: Array.isArray(company.works) ? company.works : [],
    awards: Array.isArray(company.awards) ? company.awards : [],
    links: Array.isArray(company.links) ? company.links : [],
    history: Array.isArray(company.history) ? company.history : [],
  };

  const adaptedArtists = (company.connectedArtists || []).map((rel) => ({
    id: rel.artist?.id || "",
    name: rel.artist?.name || "",
    name_en: rel.artist?.name_en || null,
    profile_image_url: rel.artist?.profileImage || null,
    slug: rel.artist?.slug || null,
    instagram: rel.artist?.instagram || null,
    website: rel.artist?.website || null,
    email: rel.artist?.email || null,
    role: rel.role || "CREATIVE",
    start_year: rel.start_year || null,
    end_year: rel.end_year || null,
    is_current: !!rel.is_current,
    is_primary: !!rel.is_primary,
  }));

  const renderSectionHeader = (title: string, panelKey: string, isEmpty: boolean) => (
    <div
      onClick={() => togglePanel(panelKey)}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 20px", background: "#FAF8F5", borderBottom: "1.5px solid var(--border)",
        cursor: "pointer", userSelect: "none"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <h3 style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--navy)", margin: 0 }}>
          {title}
        </h3>
        {isEmpty && (
          <span style={{ fontSize: "0.7rem", background: "#FFFBEB", color: "#B45309", border: "1px solid #FCD34D", borderRadius: "4px", padding: "2px 6px", fontWeight: 700 }}>
            ⚠️ 미입력 상태
          </span>
        )}
      </div>
      <span style={{ fontSize: "0.9rem", color: "var(--ink-muted)", fontWeight: 700 }}>
        {expandedPanels[panelKey] ? "▲ 접기" : "▼ 펼치기"}
      </span>
    </div>
  );

  const renderArtistsForm = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
              <button type="button" onClick={() => deleteRelation(rel.relationId)} style={{ ...dangerBtnStyle, padding: "5px 10px", fontSize: "0.72rem" }}>삭제</button>
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
                  type="button"
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px", marginBottom: "10px" }} className="admin-form-grid">
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
        <button type="button" onClick={() => submitNewRelation(false)} disabled={addingRelation || !selectedArtistId} style={primaryBtnStyle}>
          {addingRelation ? "연결 중..." : "연결 추가"}
        </button>
      </div>
    </div>
  );

  const renderContactForm = () => {
    const press = company.review_links || [];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }} className="admin-form-grid">
          <div style={fieldRowStyle}>
            <label style={labelStyle}>이메일</label>
            <input style={inputStyle} value={company.email || ""} onChange={(e) => updateField("email", e.target.value)} />
          </div>
          <div style={fieldRowStyle}>
            <label style={labelStyle}>웹사이트</label>
            <input style={inputStyle} value={company.website || ""} onChange={(e) => updateField("website", e.target.value)} />
          </div>
          <div style={fieldRowStyle}>
            <label style={labelStyle}>인스타그램</label>
            <input style={inputStyle} value={company.instagram || ""} onChange={(e) => updateField("instagram", e.target.value)} />
          </div>
          <div style={fieldRowStyle}>
            <label style={labelStyle}>포트폴리오 URL</label>
            <input style={inputStyle} value={company.portfolio_url || ""} onChange={(e) => updateField("portfolio_url", e.target.value)} />
          </div>
        </div>

        <div style={{ ...fieldRowStyle, marginTop: "14px" }}>
          <label style={labelStyle}>언론 보도 / 미디어 링크 (review_links)</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {press.map((item: any, idx: number) => (
              <div key={idx} style={{ display: "flex", gap: "8px", flexDirection: "column", padding: "12px", border: "1px solid var(--border)", borderRadius: "8px", background: "#FAF8F5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--ink-faint)" }}>언론 보도 #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newPress = press.filter((_, i) => i !== idx);
                      updateField("review_links", newPress);
                    }}
                    style={{ ...dangerBtnStyle, padding: "2px 6px", fontSize: "0.7rem" }}
                  >
                    삭제
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }} className="admin-form-grid">
                  <input
                    style={inputStyle}
                    placeholder="제목 (기사 제목 등)"
                    value={item.title || ""}
                    onChange={(e) => {
                      const newPress = [...press];
                      newPress[idx] = { ...item, title: e.target.value };
                      updateField("review_links", newPress);
                    }}
                  />
                  <input
                    style={inputStyle}
                    placeholder="매체명 (예: 중앙일보)"
                    value={item.publication || item.source || ""}
                    onChange={(e) => {
                      const newPress = [...press];
                      newPress[idx] = { ...item, publication: e.target.value, source: e.target.value };
                      updateField("review_links", newPress);
                    }}
                  />
                  <input
                    style={inputStyle}
                    placeholder="연도"
                    value={item.year || ""}
                    onChange={(e) => {
                      const newPress = [...press];
                      newPress[idx] = { ...item, year: e.target.value };
                      updateField("review_links", newPress);
                    }}
                  />
                  <input
                    style={inputStyle}
                    placeholder="기사 URL"
                    value={item.url || ""}
                    onChange={(e) => {
                      const newPress = [...press];
                      newPress[idx] = { ...item, url: e.target.value };
                      updateField("review_links", newPress);
                    }}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                updateField("review_links", [...press, { title: "", publication: "", year: "", url: "" }]);
              }}
              style={{ ...secondaryBtnStyle, alignSelf: "flex-start" }}
            >
              + 언론 기사 추가
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAwardsForm = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
    </div>
  );

  const renderLinksForm = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
    </div>
  );

  return (
    <div style={{ maxWidth: "1120px", margin: "0 auto", paddingBottom: "100px" }}>
      
      {/* CMS TOP STICKY BAR */}
      <div style={{
        position: "sticky", top: 0, zIndex: 500,
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1.5px solid var(--border)",
        padding: "16px 24px",
        marginBottom: "24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: "16px"
      }}>
        <div>
          <button
            type="button"
            onClick={() => {
              if (hasUnsavedChanges) {
                if (!confirm("저장하지 않은 변경사항이 있습니다. 정말 목록으로 돌아가시겠습니까?")) return;
              }
              router.push("/admin/companies");
            }}
            style={{ border: "none", background: "none", padding: 0, fontSize: "0.78rem", color: "var(--ink-muted)", cursor: "pointer", textDecoration: "underline" }}
          >
            ← 단체 목록으로
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--navy)", margin: 0 }}>{company.name} CMS</h1>
            <span style={{
              fontSize: "0.72rem", fontWeight: 800, padding: "2px 8px", borderRadius: "999px",
              background: company.status === "published" ? "#ECFDF5" : company.status === "archived" ? "#F1F5F9" : "#FFFBEB",
              color: company.status === "published" ? "var(--verified)" : company.status === "archived" ? "var(--ink-muted)" : "#D97706"
            }}>
              {company.status === "draft" ? "초안(비공개)" : company.status === "published" ? "공개됨" : "보관됨"}
            </span>
            <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
              조회수: {company.view_count || 0}
            </span>
          </div>
        </div>

        {/* Global Toolbar buttons */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {hasUnsavedChanges && (
            <span style={{ fontSize: "0.78rem", color: "#D97706", fontWeight: 700, marginRight: "8px" }}>
              ⚠️ 저장되지 않은 변경사항 있음
            </span>
          )}
          
          <button
            type="button"
            onClick={handleRevert}
            disabled={!hasUnsavedChanges}
            style={hasUnsavedChanges ? secondaryBtnStyle : { ...secondaryBtnStyle, opacity: 0.5, cursor: "not-allowed" }}
          >
            되돌리기
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            style={hasUnsavedChanges ? primaryBtnStyle : { ...primaryBtnStyle, opacity: 0.5, cursor: "not-allowed" }}
          >
            {saving ? "저장 중..." : "변경사항 저장"}
          </button>

          {company.slug && (
            <Link href={`/companies/${company.slug}`} target="_blank" className="admin-action-btn" style={previewLinkStyle}>
              실제 화면 열기 ↗
            </Link>
          )}

          <div style={{ width: "1px", height: "24px", backgroundColor: "var(--border)", margin: "0 4px" }} />

          {company.status === "draft" && (
            <button type="button" onClick={() => handleStatusAction("publish")} disabled={statusActionLoading} style={{ ...secondaryBtnStyle, borderColor: "var(--verified)", color: "var(--verified)" }}>공개하기</button>
          )}
          {company.status === "published" && (
            <button type="button" onClick={() => handleStatusAction("unpublish")} disabled={statusActionLoading} style={secondaryBtnStyle}>비공개 전환</button>
          )}
          {company.status !== "archived" && (
            <button type="button" onClick={() => handleStatusAction("archive")} disabled={statusActionLoading} style={secondaryBtnStyle}>보관</button>
          )}
          <button type="button" onClick={handleDelete} style={dangerBtnStyle}>삭제</button>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div style={{ display: "flex", borderBottom: "1.5px solid var(--border)", marginBottom: "24px", gap: "4px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("edit")}
          style={{
            padding: "10px 20px", border: "none", background: "none", fontSize: "0.88rem", fontWeight: activeTab === "edit" ? 800 : 500,
            borderBottom: activeTab === "edit" ? "2.5px solid var(--navy)" : "none", color: activeTab === "edit" ? "var(--navy)" : "var(--ink-muted)",
            cursor: "pointer", marginBottom: "-1.5px"
          }}
        >
          자료 분석, AI 실행 및 프로필 편집
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          style={{
            padding: "10px 20px", border: "none", background: "none", fontSize: "0.88rem", fontWeight: activeTab === "preview" ? 800 : 500,
            borderBottom: activeTab === "preview" ? "2.5px solid var(--navy)" : "none", color: activeTab === "preview" ? "var(--navy)" : "var(--ink-muted)",
            cursor: "pointer", marginBottom: "-1.5px"
          }}
        >
          실시간 공개 미리보기 (Live Preview)
        </button>
      </div>

      {/* TAB 1: READ-ONLY LIVE PREVIEW WITH CLICK-TO-EDIT OVERLAYS */}
      {activeTab === "preview" && (
        <div style={{ background: "var(--bg-warm)", minHeight: "100vh", padding: "20px", borderRadius: "16px", border: "1px solid var(--border)" }}>
          <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
            
            <EditableSection title="디지털 카드" onEdit={() => handleJumpToEdit("basic")}>
              <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
                <CompanyCardStack company={adaptedCompany as any} viewCount={company.view_count || 0} artists={adaptedArtists} />
              </div>
            </EditableSection>

            <EditableSection
              title="브로슈어 헤더 & 포스터"
              onEdit={() => handleJumpToEdit("basic")}
              isEmpty={!company.name_en && !company.bio_short && !company.bio}
            >
              <CompanyBrochureHeader company={adaptedCompany as any} artistCount={adaptedArtists.length} />
            </EditableSection>

            <EditableSection
              title="정체성 (Mission/Vision/Values)"
              onEdit={() => handleJumpToEdit("identity")}
              isEmpty={!company.mission && !company.vision && (!company.core_values || company.core_values.length === 0)}
            >
              <CompanyIdentity company={adaptedCompany as any} />
            </EditableSection>

            <EditableSection
              title="대표 작품 (Works)"
              onEdit={() => handleJumpToEdit("works")}
              isEmpty={!company.works || company.works.length === 0}
            >
              <CompanyPortfolio company={adaptedCompany as any} />
            </EditableSection>

            <EditableSection
              title="연혁 (History)"
              onEdit={() => handleJumpToEdit("history")}
              isEmpty={!company.history || company.history.length === 0}
            >
              <CompanyHistory company={adaptedCompany as any} />
            </EditableSection>

            <EditableSection
              title="소속 아티스트"
              onEdit={() => handleJumpToEdit("artists")}
              isEmpty={adaptedArtists.length === 0}
            >
              <CompanyArtists company={adaptedCompany as any} artists={adaptedArtists} />
            </EditableSection>

            <EditableSection
              title="연락처 및 언론보도"
              onEdit={() => handleJumpToEdit("contact")}
              isEmpty={!company.email && !company.website && !company.instagram && !company.portfolio_url && (!company.review_links || company.review_links.length === 0)}
            >
              <CompanyContact company={adaptedCompany as any} />
            </EditableSection>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }} className="admin-form-grid">
              <EditableSection
                title="수상 실적"
                onEdit={() => handleJumpToEdit("awards")}
                isEmpty={!company.awards || company.awards.length === 0}
              >
                <div style={{ padding: "24px", border: "1.5px solid var(--border)", borderRadius: "14px", background: "#fff", height: "100%" }}>
                  <h3 className="mono" style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--navy)", marginBottom: "16px", textTransform: "uppercase" }}>Awards</h3>
                  {(!company.awards || company.awards.length === 0) ? (
                    <div style={{ fontSize: "0.8rem", color: "var(--ink-faint)" }}>수상 실적이 등록되지 않았습니다.</div>
                  ) : (
                    <ul style={{ paddingLeft: "16px", margin: 0, fontSize: "0.82rem", lineHeight: 1.6, color: "var(--navy)" }}>
                      {company.awards.map((aw, idx) => (
                        <li key={idx}><strong>{aw.year}</strong>: {aw.title} ({aw.result}) - {aw.organization}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </EditableSection>

              <EditableSection
                title="외부 링크"
                onEdit={() => handleJumpToEdit("links")}
                isEmpty={!company.links || company.links.length === 0}
              >
                <div style={{ padding: "24px", border: "1.5px solid var(--border)", borderRadius: "14px", background: "#fff", height: "100%" }}>
                  <h3 className="mono" style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--navy)", marginBottom: "16px", textTransform: "uppercase" }}>Links</h3>
                  {(!company.links || company.links.length === 0) ? (
                    <div style={{ fontSize: "0.8rem", color: "var(--ink-faint)" }}>외부 링크가 등록되지 않았습니다.</div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {company.links.map((lnk, idx) => (
                        <a key={idx} href={lnk.url} target="_blank" rel="noreferrer" className="tag-navy" style={{ textDecoration: "none", fontSize: "0.75rem", background: "var(--navy)", color: "#fff", padding: "6px 12px", borderRadius: "20px", fontWeight: 700 }}>
                          {lnk.label || lnk.url} ↗
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </EditableSection>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOURCE MATERIALS & PROFILE INTEGRATED EDITOR */}
      {activeTab === "edit" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* SECTION A: AI & SOURCE MATERIALS */}
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>SOURCE MATERIALS & AI AUTO INGEST (소스 자료 및 AI 구조화)</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }} className="admin-form-grid">
              {/* Original Application details */}
              <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
                  최초 신청 자료
                </span>
                {!company.application ? (
                  <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)" }}>연결된 신청서가 없습니다.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.82rem" }}>
                      <span style={{ color: "var(--ink-muted)" }}>이력서 파일:</span>
                      {company.application.resume_file_name ? (
                        <button type="button" onClick={handleDownloadOriginalResume} style={{ ...secondaryBtnStyle, padding: "4px 10px", fontSize: "0.75rem" }}>
                          {company.application.resume_file_name}
                        </button>
                      ) : (
                        <span style={{ color: "var(--ink-faint)" }}>없음</span>
                      )}
                    </div>
                    <div style={fieldRowStyle}>
                      <label style={labelStyle}>직접 입력 이력 내용</label>
                      <textarea
                        readOnly
                        rows={3}
                        style={{ ...inputStyle, resize: "vertical", background: "#F8F9FA", fontSize: "0.78rem" }}
                        value={company.application.portfolio_text || "(입력 없음)"}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Admin materials uploads */}
              <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
                  관리자 업로드 최신 자료
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "0.82rem", marginBottom: "12px" }}>
                  {company.source_file_name ? (
                    <span style={{ color: "var(--navy)", fontWeight: 700 }}>
                      {company.source_file_name} ({formatFileSize(company.source_file_size)})
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
                    style={{ ...secondaryBtnStyle, padding: "5px 10px", fontSize: "0.72rem" }}
                  >
                    {uploadingSourceFile ? "업로드 중..." : "파일 업로드"}
                  </button>
                  {company.source_file_name && (
                    <>
                      <button type="button" onClick={handleSourceFileDownload} style={{ ...secondaryBtnStyle, padding: "5px 10px", fontSize: "0.72rem" }}>다운로드</button>
                      <button type="button" onClick={handleSourceFileDelete} disabled={deletingSourceFile} style={{ ...dangerBtnStyle, padding: "5px 10px", fontSize: "0.72rem" }}>삭제</button>
                    </>
                  )}
                </div>
                
                <div style={fieldRowStyle}>
                  <label style={labelStyle}>AI 분석 보충용 텍스트 자료</label>
                  <textarea
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical", fontSize: "0.78rem" }}
                    value={sourceTextDraft}
                    onChange={(e) => setSourceTextDraft(e.target.value)}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                    <span style={{ fontSize: "0.68rem", color: "var(--ink-muted)" }}>
                      {sourceTextDraft.length.toLocaleString()} / 30,000자
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveSourceMaterials}
                      disabled={savingSourceMaterials || sourceTextDraft === (company.source_text || "")}
                      style={{ ...primaryBtnStyle, padding: "4px 10px", fontSize: "0.72rem" }}
                    >
                      {savingSourceMaterials ? "저장 중..." : "보충 자료 저장"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Run AI Button */}
            <div style={{ borderTop: "1.5px solid var(--border)", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>
                마지막 AI 실행 시각: {company.ai_draft_generated_at ? new Date(company.ai_draft_generated_at).toLocaleString("ko-KR") : "기록 없음"}
                {company.ai_draft_source_summary?.truncated && <span style={{ color: "#B45309", fontWeight: 700 }}> · 용량 제한으로 일부 초과분 생략됨</span>}
              </div>
              <button
                type="button"
                onClick={handleAiStructure}
                disabled={structuring || company.ai_draft_status === "processing"}
                style={{ ...primaryBtnStyle, padding: "12px 24px", fontSize: "0.85rem" }}
              >
                {structuring || company.ai_draft_status === "processing" ? "AI 자료 분석 및 자동 매핑 진행 중..." : "⚡ AI로 이력서 분석 후 정보 자동 입력"}
              </button>
            </div>
            
            {company.ai_draft_status === "failed" && company.ai_draft_error && (
              <div style={{ marginTop: "12px", padding: "10px 14px", background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5", borderRadius: "8px", fontSize: "0.78rem" }}>
                AI 실행 오류: {company.ai_draft_error}
              </div>
            )}
          </section>

          {/* SECTION B: INTEGRATED CARD-BY-CARD FORM EDITOR */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--navy)", margin: "8px 0 0" }}>
              단체 프로필 상세 편집 (Manual & AI Input Panel)
            </h2>

            {/* Panel 1: Basic Info */}
            <div id="panel-basic" style={panelCardStyle}>
              {renderSectionHeader("1. 기본 정보 & 디지털 카드 (Basic Details)", "basic", !company.name || !company.slug)}
              {expandedPanels.basic && (
                <div style={{ padding: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }} className="admin-form-grid">
                      <div style={fieldRowStyle}>
                        <label style={labelStyle}>단체명 *</label>
                        <input style={inputStyle} value={company.name} onChange={(e) => updateField("name", e.target.value)} />
                      </div>
                      <div style={fieldRowStyle}>
                        <label style={labelStyle}>영문명</label>
                        <input style={inputStyle} value={company.name_en || ""} onChange={(e) => updateField("name_en", e.target.value)} />
                      </div>
                      <div style={fieldRowStyle}>
                        <label style={labelStyle}>단체 주소 (slug) *</label>
                        <input style={inputStyle} value={company.slug || ""} onChange={(e) => updateField("slug", e.target.value)} />
                      </div>
                      <div style={fieldRowStyle}>
                        <label style={labelStyle}>인증 여부</label>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--navy)", marginTop: "8px" }}>
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
                      
                      {/* Logo image uploader */}
                      <div style={fieldRowStyle}>
                        <label style={labelStyle}>대표 이미지 (로고) 업로드</label>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "4px" }}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadSingleImage("profile_image_url", file);
                            }}
                            style={{ fontSize: "0.78rem" }}
                          />
                          {company.profile_image_url && (
                            <img src={company.profile_image_url} alt="" style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover", border: "1px solid var(--border)" }} />
                          )}
                        </div>
                      </div>

                      <div style={fieldRowStyle}>
                        <label style={labelStyle}>대표 이미지 URL (로고)</label>
                        <input style={inputStyle} value={company.profile_image_url || ""} onChange={(e) => updateField("profile_image_url", e.target.value)} />
                      </div>
                    </div>
                    
                    <div style={fieldRowStyle}>
                      <label style={labelStyle}>모션 프로필 비디오 URL (YouTube/Vimeo)</label>
                      <input style={inputStyle} value={company.motion_video_url || ""} onChange={(e) => updateField("motion_video_url", e.target.value)} />
                    </div>
                    <div style={fieldRowStyle}>
                      <label style={labelStyle}>한줄 소개 (bio_short)</label>
                      <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={company.bio_short || ""} onChange={(e) => updateField("bio_short", e.target.value)} />
                    </div>
                    <div style={fieldRowStyle}>
                      <label style={labelStyle}>상세 소개 (bio)</label>
                      <textarea rows={4} style={{ ...inputStyle, resize: "vertical" }} value={company.bio || ""} onChange={(e) => updateField("bio", e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel 2: Hero & Slider */}
            <div id="panel-hero" style={panelCardStyle}>
              {renderSectionHeader("2. 히어로 배너 & 이미지 슬라이더 (Hero Banner)", "hero", !company.founded_year && !company.brand_color)}
              {expandedPanels.hero && (
                <div style={{ padding: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }} className="admin-form-grid">
                      <div style={fieldRowStyle}>
                        <label style={labelStyle}>설립연도</label>
                        <input style={inputStyle} type="number" value={company.founded_year || ""} onChange={(e) => updateField("founded_year", e.target.value ? Number(e.target.value) : null)} />
                      </div>
                      <div style={{ ...fieldRowStyle, minWidth: 0 }}>
                        <label style={labelStyle}>브랜드 컬러</label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input style={{ ...inputStyle, flexGrow: 1 }} placeholder="#C8EE52" value={company.brand_color || ""} onChange={(e) => updateField("brand_color", e.target.value)} />
                          <input type="color" style={{ width: "40px", height: "40px", border: "1.5px solid var(--border)", borderRadius: "8px", cursor: "pointer", padding: 0, backgroundColor: "transparent" }} value={company.brand_color || "#C8EE52"} onChange={(e) => updateField("brand_color", e.target.value)} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Hero Banner image uploader */}
                    <div style={fieldRowStyle}>
                      <label style={labelStyle}>히어로 배너 이미지 업로드</label>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "4px" }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadSingleImage("hero_image_url", file);
                          }}
                          style={{ fontSize: "0.78rem" }}
                        />
                        {company.hero_image_url && (
                          <img src={company.hero_image_url} alt="" style={{ width: "60px", height: "40px", borderRadius: "6px", objectFit: "cover", border: "1px solid var(--border)" }} />
                        )}
                      </div>
                    </div>

                    <div style={fieldRowStyle}>
                      <label style={labelStyle}>히어로 배너 이미지 URL (공란일 경우 목록의 첫 번째 이미지 자동 노출)</label>
                      <input style={inputStyle} value={company.hero_image_url || ""} onChange={(e) => updateField("hero_image_url", e.target.value)} />
                    </div>

                    {/* Slider images list with upload buttons */}
                    <div style={fieldRowStyle}>
                      <label style={labelStyle}>포트폴리오 슬라이더 이미지 목록 (profile_image_urls)</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {(company.profile_image_urls || []).map((img, idx) => (
                          <div key={idx} style={{ display: "flex", gap: "8px", flexDirection: "column", padding: "12px", border: "1px solid var(--border)", borderRadius: "8px", background: "#FAF8F5" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--ink-faint)" }}>슬라이더 이미지 #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newUrls = company.profile_image_urls.filter((_, i) => i !== idx);
                                  updateField("profile_image_urls", newUrls);
                                }}
                                style={{ ...dangerBtnStyle, padding: "2px 6px", fontSize: "0.7rem" }}
                              >
                                삭제
                              </button>
                            </div>
                            
                            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "4px" }}>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadSliderImage(idx, file);
                                }}
                                style={{ fontSize: "0.78rem" }}
                              />
                              {img && (
                                <img src={img} alt="" style={{ width: "60px", height: "40px", borderRadius: "6px", objectFit: "cover", border: "1px solid var(--border)" }} />
                              )}
                            </div>
                            
                            <input
                              style={inputStyle}
                              placeholder="이미지 URL"
                              value={img}
                              onChange={(e) => {
                                const newUrls = [...company.profile_image_urls];
                                newUrls[idx] = e.target.value;
                                updateField("profile_image_urls", newUrls);
                              }}
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            updateField("profile_image_urls", [...company.profile_image_urls, ""]);
                          }}
                          style={{ ...secondaryBtnStyle, alignSelf: "flex-start" }}
                        >
                          + 슬라이더 이미지 추가
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel 3: Identity */}
            <div id="panel-identity" style={panelCardStyle}>
              {renderSectionHeader("3. 정체성 (Identity: Mission, Vision, Values)", "identity", !company.mission && !company.vision && (!company.core_values || company.core_values.length === 0))}
              {expandedPanels.identity && (
                <div style={{ padding: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={fieldRowStyle}>
                      <label style={labelStyle}>MISSION (미션)</label>
                      <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={company.mission || ""} onChange={(e) => updateField("mission", e.target.value)} />
                    </div>
                    <div style={fieldRowStyle}>
                      <label style={labelStyle}>VISION (비전)</label>
                      <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={company.vision || ""} onChange={(e) => updateField("vision", e.target.value)} />
                    </div>
                    <div style={fieldRowStyle}>
                      <label style={labelStyle}>핵심 가치 (core_values)</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {(company.core_values || []).map((val, idx) => (
                          <div key={idx} style={{ display: "flex", gap: "8px" }}>
                            <input
                              style={{ ...inputStyle, flexGrow: 1 }}
                              value={val}
                              onChange={(e) => {
                                const newVal = [...(company.core_values || [])];
                                newVal[idx] = e.target.value;
                                updateField("core_values", newVal);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newVal = (company.core_values || []).filter((_, i) => i !== idx);
                                updateField("core_values", newVal);
                              }}
                              style={dangerBtnStyle}
                            >
                              삭제
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            updateField("core_values", [...(company.core_values || []), ""]);
                          }}
                          style={{ ...secondaryBtnStyle, alignSelf: "flex-start" }}
                        >
                          + 핵심 가치 추가
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel 4: Works */}
            <div id="panel-works" style={panelCardStyle}>
              {renderSectionHeader("4. 대표 작품 (Selected Works)", "works", !company.works || company.works.length === 0)}
              {expandedPanels.works && (
                <div style={{ padding: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {(company.works || []).map((work: any, idx: number) => (
                      <div key={idx} style={{ border: "1.5px solid var(--border)", borderRadius: "10px", padding: "16px", background: "#FAF8F5" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--ink-faint)" }}>대표 작품 #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newWorks = company.works.filter((_, i) => i !== idx);
                              updateField("works", newWorks);
                            }}
                            style={{ ...dangerBtnStyle, padding: "4px 8px", fontSize: "0.72rem" }}
                          >
                            작품 삭제
                          </button>
                        </div>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }} className="admin-form-grid">
                          <div style={fieldRowStyle}>
                            <label style={labelStyle}>작품명 *</label>
                            <input
                              style={inputStyle}
                              value={work.title || ""}
                              onChange={(e) => {
                                const newWorks = [...company.works];
                                newWorks[idx] = { ...work, title: e.target.value };
                                updateField("works", newWorks);
                              }}
                            />
                          </div>
                          <div style={fieldRowStyle}>
                            <label style={labelStyle}>장르 / 카테고리</label>
                            <input
                              style={inputStyle}
                              value={work.genre || work.category || ""}
                              onChange={(e) => {
                                const newWorks = [...company.works];
                                newWorks[idx] = { ...work, genre: e.target.value, category: e.target.value };
                                updateField("works", newWorks);
                              }}
                            />
                          </div>
                          
                          {/* Image upload — admin manages only the representative image
                              (images[0]). Any images[1..3] set via the self-serve CMS
                              are preserved even though this screen can't show them. */}
                          <div style={fieldRowStyle}>
                            <label style={labelStyle}>대표 이미지 업로드</label>
                            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "4px" }}>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadWorkImage(idx, file);
                                }}
                                style={{ fontSize: "0.78rem" }}
                              />
                              {normalizeWorkImages(work)[0] && (
                                <img src={normalizeWorkImages(work)[0]} alt="" style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover", border: "1px solid var(--border)" }} />
                              )}
                              {normalizeWorkImages(work)[0] && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveWorkRepresentativeImage(idx)}
                                  style={{ ...dangerBtnStyle, padding: "3px 8px", fontSize: "0.68rem" }}
                                  title="대표 이미지만 제거합니다. 2~4번째 이미지(CMS에서 추가된 경우)는 유지됩니다."
                                >
                                  대표 이미지 제거
                                </button>
                              )}
                            </div>
                            {normalizeWorkImages(work).length > 1 && (
                              <span style={{ fontSize: "0.7rem", color: "var(--ink-faint)", marginTop: "4px", display: "block" }}>
                                총 {normalizeWorkImages(work).length}장 저장됨 — 관리자 화면은 대표 이미지(1번)만 교체/제거하며, 나머지는 대표자 CMS에서 확인·관리할 수 있습니다.
                              </span>
                            )}
                          </div>

                          <div style={fieldRowStyle}>
                            <label style={labelStyle}>대표 이미지 URL (직접 입력 또는 업로드 시 자동 입력)</label>
                            <input
                              style={inputStyle}
                              value={normalizeWorkImages(work)[0] || ""}
                              onChange={(e) => handleSetWorkRepresentativeImageUrl(idx, e.target.value)}
                            />
                          </div>

                          <div style={fieldRowStyle}>
                            <label style={labelStyle}>영상 아카이브 URL</label>
                            <input
                              style={inputStyle}
                              value={work.video_url || work.video || ""}
                              onChange={(e) => {
                                const newWorks = [...company.works];
                                newWorks[idx] = { ...work, video_url: e.target.value };
                                updateField("works", newWorks);
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ ...fieldRowStyle, marginBottom: "12px" }}>
                          <label style={labelStyle}>작품 설명</label>
                          <textarea
                            rows={3}
                            style={{ ...inputStyle, resize: "vertical" }}
                            value={work.description || ""}
                            onChange={(e) => {
                              const newWorks = [...company.works];
                              newWorks[idx] = { ...work, description: e.target.value };
                              updateField("works", newWorks);
                            }}
                          />
                        </div>

                        <div style={fieldRowStyle}>
                          <label style={labelStyle}>크레딧 (참여 예술가 및 연출 등) — 줄마다 &quot;역할: 이름, 이름2&quot;</label>
                          <textarea
                            rows={2}
                            style={{ ...inputStyle, resize: "vertical" }}
                            value={creditsToDisplayString(work)}
                            onChange={(e) => {
                              const newWorks = [...company.works];
                              // Stored as a plain string here for editing only — the save
                              // routes (both CMS and admin) normalize this into the
                              // canonical structured credits[] via lib/company-works.
                              newWorks[idx] = { ...work, credits: e.target.value };
                              updateField("works", newWorks);
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        updateField("works", [...company.works, { id: `work_${Date.now()}`, title: "", genre: "", images: [], video_url: "", description: "", credits: "" }]);
                      }}
                      style={{ ...secondaryBtnStyle, alignSelf: "flex-start" }}
                    >
                      + 대표 작품 추가
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Panel 5: History */}
            <div id="panel-history" style={panelCardStyle}>
              {renderSectionHeader("5. 연혁 (Timeline History)", "history", !company.history || company.history.length === 0)}
              {expandedPanels.history && (
                <div style={{ padding: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {(company.history || []).map((hist, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px", marginBottom: "4px" }}>
                        <div style={{ ...fieldRowStyle, width: "120px", flexShrink: 0 }}>
                          <label style={{ ...labelStyle, fontSize: "0.65rem" }}>연도 (Year)</label>
                          <input
                            style={inputStyle}
                            placeholder="예: 2025"
                            value={hist.year || ""}
                            onChange={(e) => {
                              const newHist = [...company.history!];
                              newHist[idx] = { ...hist, year: e.target.value };
                              updateField("history", newHist);
                            }}
                          />
                        </div>
                        <div style={{ ...fieldRowStyle, flexGrow: 1 }}>
                          <label style={{ ...labelStyle, fontSize: "0.65rem" }}>이벤트 내용 (줄바꿈 지원)</label>
                          <textarea
                            rows={3}
                            style={{ ...inputStyle, resize: "vertical" }}
                            placeholder="내용 설명 (Shift+Enter 혹은 Enter로 줄바꿈 가능)"
                            value={hist.event || ""}
                            onChange={(e) => {
                              const newHist = [...company.history!];
                              newHist[idx] = { ...hist, event: e.target.value };
                              updateField("history", newHist);
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newHist = company.history!.filter((_, i) => i !== idx);
                            updateField("history", newHist);
                          }}
                          style={{ ...dangerBtnStyle, alignSelf: "flex-end", padding: "8px 12px" }}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        updateField("history", [...(company.history || []), { year: "", event: "" }]);
                      }}
                      style={{ ...secondaryBtnStyle, alignSelf: "flex-start" }}
                    >
                      + 연혁 추가
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Panel 6: Projects */}
            <div id="panel-projects" style={panelCardStyle}>
              {renderSectionHeader("6. 현재 프로젝트 (Current Projects)", "projects", !company.current_activity || company.current_activity.length === 0)}
              {expandedPanels.projects && (
                <div style={{ padding: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {(company.current_activity || []).map((proj: any, idx: number) => (
                      <div key={idx} style={{ border: "1.5px solid var(--border)", borderRadius: "10px", padding: "16px", background: "#FAF8F5" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--ink-faint)" }}>프로젝트 #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newProj = company.current_activity.filter((_, i) => i !== idx);
                              updateField("current_activity", newProj);
                            }}
                            style={{ ...dangerBtnStyle, padding: "4px 8px", fontSize: "0.72rem" }}
                          >
                            삭제
                          </button>
                        </div>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }} className="admin-form-grid">
                          <div style={fieldRowStyle}>
                            <label style={labelStyle}>프로젝트명 *</label>
                            <input
                              style={inputStyle}
                              value={proj.title || ""}
                              onChange={(e) => {
                                const newProj = [...company.current_activity];
                                newProj[idx] = { ...proj, title: e.target.value };
                                updateField("current_activity", newProj);
                              }}
                            />
                          </div>
                          <div style={fieldRowStyle}>
                            <label style={labelStyle}>기간 (날짜)</label>
                            <input
                              style={inputStyle}
                              placeholder="예: 2026.08.10 - 2026.11.20"
                              value={proj.date || ""}
                              onChange={(e) => {
                                const newProj = [...company.current_activity];
                                newProj[idx] = { ...proj, date: e.target.value };
                                updateField("current_activity", newProj);
                              }}
                            />
                          </div>
                        </div>
                        
                        <div style={{ ...fieldRowStyle, marginBottom: "12px" }}>
                          <label style={{ ...labelStyle }}>상세 설명</label>
                          <textarea
                            rows={2}
                            style={{ ...inputStyle, resize: "vertical" }}
                            value={proj.description || ""}
                            onChange={(e) => {
                              const newProj = [...company.current_activity];
                              newProj[idx] = { ...proj, description: e.target.value };
                              updateField("current_activity", newProj);
                            }}
                          />
                        </div>
                        
                        <div style={fieldRowStyle}>
                          <label style={labelStyle}>관련 정보 링크</label>
                          <input
                            style={inputStyle}
                            placeholder="https://..."
                            value={proj.link || ""}
                            onChange={(e) => {
                              const newProj = [...company.current_activity];
                              newProj[idx] = { ...proj, link: e.target.value };
                              updateField("current_activity", newProj);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => {
                        updateField("current_activity", [...company.current_activity, { title: "", date: "", description: "", link: "" }]);
                      }}
                      style={{ ...secondaryBtnStyle, alignSelf: "flex-start" }}
                    >
                      + 프로젝트 추가
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Panel 7: Affiliated Artists */}
            <div id="panel-artists" style={panelCardStyle}>
              {renderSectionHeader("7. 소속 아티스트 (Affiliated Artists)", "artists", company.connectedArtists.length === 0)}
              {expandedPanels.artists && (
                <div style={{ padding: "20px" }}>
                  {renderArtistsForm()}
                </div>
              )}
            </div>

            {/* Panel 8: Contact & Media */}
            <div id="panel-contact" style={panelCardStyle}>
              {renderSectionHeader("8. 연락처 및 미디어 보도 (Contact & Press)", "contact", !company.email && !company.website && !company.instagram && !company.portfolio_url && (!company.review_links || company.review_links.length === 0))}
              {expandedPanels.contact && (
                <div style={{ padding: "20px" }}>
                  {renderContactForm()}
                </div>
              )}
            </div>

            {/* Panel 9: Awards */}
            <div id="panel-awards" style={panelCardStyle}>
              {renderSectionHeader("9. 수상 실적 (Awards)", "awards", !company.awards || company.awards.length === 0)}
              {expandedPanels.awards && (
                <div style={{ padding: "20px" }}>
                  {renderAwardsForm()}
                </div>
              )}
            </div>

            {/* Panel 10: Links */}
            <div id="panel-links" style={panelCardStyle}>
              {renderSectionHeader("10. 외부 링크 (Links)", "links", !company.links || company.links.length === 0)}
              {expandedPanels.links && (
                <div style={{ padding: "20px" }}>
                  {renderLinksForm()}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .admin-form-grid { grid-template-columns: 1fr !important; }
        }
      `}} />
    </div>
  );
}

// Reuse styles
const panelCardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid var(--border)",
  borderRadius: "14px",
  overflow: "hidden",
  marginBottom: "4px"
};

const sectionStyle: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid var(--border)",
  borderRadius: "14px",
  padding: "20px",
  marginBottom: "12px",
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
