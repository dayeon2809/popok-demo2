"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";
import { ArrayField, StringArrayField, labelStyle, inputStyle } from "@/components/admin/ArrayField";

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
}

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
