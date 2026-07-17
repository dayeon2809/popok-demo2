"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import PopokCard from "@/components/PopokCard";
import AiProfileImporter from "@/components/profile/AiProfileImporter";
import AiProfileCompare from "@/components/profile/AiProfileCompare";
import { analytics } from "@/lib/analytics";

interface Work {
  id: string;
  title: string;
  year?: string | number | null;
  description?: string;
  role?: string;
  image_url?: string;
  video_url?: string;
}

interface Artist {
  id: string;
  name: string;
  name_en?: string | null;
  slug: string;
  genre: string;
  role: string;
  bio?: string | null;
  bio_short?: string | null;
  profile_image_url?: string | null;
  motion_video_url?: string | null;
  youtube_url?: string | null;
  instagram?: string | null;
  website?: string | null;
  works?: Work[] | null;
  status?: string | null;
  verified?: boolean | null;
  affiliations?: any[];
  education?: string[];
  awards?: any[];
  competitions?: any[];
  links?: any[];
}

const PROFILE_TYPE_LABEL: Record<string, string> = {
  artist: "개인",
  organization: "단체",
};

export default function MyPopokClient({ initialArtist, profileType }: { initialArtist: Artist; profileType?: string | null }) {
  const [artist, setArtist] = useState<Artist>(initialArtist);
  const isPremium = false; // Stripe payment connection toggle point

  // Form states
  const [name, setName] = useState(artist.name || "");
  const [nameEn, setNameEn] = useState(artist.name_en || "");
  const [slug, setSlug] = useState(artist.slug || "");
  const [genre, setGenre] = useState(artist.genre || "");
  const [role, setRole] = useState(artist.role || "");
  const [bio, setBio] = useState(artist.bio || "");
  const [bioShort, setBioShort] = useState(artist.bio_short || "");
  const [profileImageUrl, setProfileImageUrl] = useState(artist.profile_image_url || "");
  const [motionVideoUrl, setMotionVideoUrl] = useState(artist.motion_video_url || "");
  const [youtubeUrl, setYoutubeUrl] = useState(artist.youtube_url || "");
  const [instagram, setInstagram] = useState(artist.instagram || "");
  const [website, setWebsite] = useState(artist.website || "");
  const [works, setWorks] = useState<Work[]>(
    Array.isArray(artist.works) ? artist.works : []
  );

  // Extra profile fields hooks for AI parsing
  const [affiliations, setAffiliations] = useState<any[]>(artist.affiliations || []);
  const [education, setEducation] = useState<string[]>(artist.education || []);
  const [awards, setAwards] = useState<any[]>(artist.awards || []);
  const [competitions, setCompetitions] = useState<any[]>(artist.competitions || []);
  const [links, setLinks] = useState<any[]>(artist.links || []);

  // AI Update modal states
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiState, setAiState] = useState<"import" | "compare" | "none">("none");
  const [parsedResult, setParsedResult] = useState<any>(null);

  // Uploading / saving indicators
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{
    valid: boolean;
    checking: boolean;
    message: string;
  }>({ valid: true, checking: false, message: "" });

  // Resolve absolute public page URL
  const publicUrl = useMemo(() => {
    if (typeof window === "undefined") return `https://popok.kr/artists/${slug}`;
    return `${window.location.origin}/artists/${slug}`;
  }, [slug]);

  // Dynamic Status Badge mapping
  const statusConfig = useMemo(() => {
    if (artist.verified) {
      return { label: "🔵 Premium 관리중", color: "#EFF6FF", textColor: "#1D4ED8", borderColor: "#BFDBFE" };
    }
    if (artist.status === "published") {
      return { label: "🟢 공개중", color: "#ECFDF5", textColor: "#047857", borderColor: "#A7F3D0" };
    }
    return { label: "🟡 작성중", color: "#FFF7ED", textColor: "#C2410C", borderColor: "#FED7AA" };
  }, [artist.status, artist.verified]);

  // Profile Completion Percentage Calculation
  const completionPercentage = useMemo(() => {
    let score = 0;
    if (name.trim()) score += 15;
    if (profileImageUrl.trim()) score += 20;
    if (bio.trim() || bioShort.trim()) score += 15;
    if (motionVideoUrl.trim() || youtubeUrl.trim()) score += 15;
    if (instagram.trim() || website.trim()) score += 15;
    if (works.length > 0 && works[0].title.trim()) score += 20;
    return score;
  }, [name, profileImageUrl, bio, bioShort, motionVideoUrl, youtubeUrl, instagram, website, works]);

  // Debounced slug validation
  useEffect(() => {
    const cleanSlug = slug.trim().toLowerCase();
    if (cleanSlug === initialArtist.slug) {
      setSlugStatus({ valid: true, checking: false, message: "" });
      return;
    }

    if (!cleanSlug) {
      setSlugStatus({ valid: false, checking: false, message: "주소를 입력해 주세요." });
      return;
    }

    if (cleanSlug.length < 3) {
      setSlugStatus({ valid: false, checking: false, message: "최소 3자 이상 입력해 주세요." });
      return;
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(cleanSlug)) {
      setSlugStatus({ valid: false, checking: false, message: "영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다." });
      return;
    }

    const reservedWords = [
      "admin", "api", "auth", "login", "signup", "artists", "submit", "recommend", "onboarding", "my-popok"
    ];
    if (reservedWords.includes(cleanSlug)) {
      setSlugStatus({ valid: false, checking: false, message: "사용할 수 없는 예약어입니다." });
      return;
    }

    setSlugStatus(prev => ({ ...prev, checking: true, message: "" }));

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${cleanSlug}`);
        const data = await res.json();
        if (data.available) {
          setSlugStatus({ valid: true, checking: false, message: "✓ 사용 가능한 주소입니다." });
        } else {
          setSlugStatus({ valid: false, checking: false, message: `× ${data.message}` });
        }
      } catch (err) {
        setSlugStatus({ valid: false, checking: false, message: "× 주소 확인 중 오류가 발생했습니다." });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slug, initialArtist.slug]);

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "profile" | number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", "artists/media");
    formData.append("bucket", "artist-media");

    if (target === "profile") {
      setUploadingImage(true);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (res.ok && data.success && data.url) {
        if (target === "profile") {
          setProfileImageUrl(data.url);
        } else {
          const updatedWorks = [...works];
          updatedWorks[target] = {
            ...updatedWorks[target],
            image_url: data.url
          };
          setWorks(updatedWorks);
        }
      } else {
        alert(data.error || "이미지 업로드에 실패했습니다.");
      }
    } catch (err) {
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      if (target === "profile") {
        setUploadingImage(false);
      }
    }
  };

  // Add work item
  const handleAddWork = () => {
    const newWork: Work = {
      id: `new-work-${Date.now()}`,
      title: "",
      year: new Date().getFullYear(),
      role: "",
      description: "",
      image_url: "",
      video_url: ""
    };
    setWorks([...works, newWork]);
  };

  // Remove work item
  const handleRemoveWork = (index: number) => {
    setWorks(works.filter((_, idx) => idx !== index));
  };

  // Update work input field
  const handleWorkInputChange = (index: number, field: keyof Work, value: any) => {
    const updatedWorks = [...works];
    updatedWorks[index] = {
      ...updatedWorks[index],
      [field]: value
    };
    setWorks(updatedWorks);
  };

  // Save profile edits
  const handleSave = async () => {
    if (!name.trim()) {
      alert("이름을 입력해 주세요.");
      return;
    }
    if (!slugStatus.valid) {
      alert("올바르고 사용 가능한 주소 슬러그를 입력해 주세요.");
      return;
    }

    const newWorksCount = works.filter(w => w.id && String(w.id).startsWith("new-work-")).length;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const cleanedWorks = works.map(w => ({
        id: w.id,
        title: w.title ? w.title.trim() : "",
        year: w.year,
        role: w.role ? w.role.trim() : "",
        description: w.description ? w.description.trim() : "",
        image_url: w.image_url || "",
        video_url: w.video_url || (w as any).video || (w as any).videoUrl || ""
      }));

      const res = await fetch("/api/artists/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          name_en: nameEn.trim() || null,
          slug: slug.trim().toLowerCase(),
          genre: genre.trim(),
          role: role.trim(),
          bio: bio.trim() || null,
          bio_short: bioShort.trim() || null,
          profile_image_url: profileImageUrl || null,
          motion_video_url: motionVideoUrl.trim() || null,
          youtube_url: youtubeUrl.trim() || null,
          instagram: instagram.trim() || null,
          website: website.trim() || null,
          works: cleanedWorks,
          affiliations,
          education,
          awards,
          competitions,
          links
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setArtist(data.data);
        setSaveSuccess(true);
        if (newWorksCount > 0) {
          analytics.workCreated(newWorksCount);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.error || "프로필 저장에 실패했습니다.");
      }
    } catch (err: any) {
      alert("프로필 저장 중 오류가 발생했습니다: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Copy link action helper
  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    analytics.profileShared("copy", "portfolio", slug || artist.id);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download QR handler via canvas drawing or direct api download
  const handleDownloadQR = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}`;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.target = "_blank";
    a.download = `popok-qr-${slug}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Find all work images to list them as representative options
  const workImages = useMemo(() => {
    return works
      .map(w => w.image_url)
      .filter((url): url is string => typeof url === "string" && url.trim().length > 0);
  }, [works]);

  return (
    <div style={{ background: "var(--bg-warm)", minHeight: "100vh", padding: "40px 16px 120px" }}>
      <div className="my-popok-container" style={{ maxWidth: "1080px", margin: "0 auto" }}>
        
        {/* PREMIUM CMS DASHBOARD HERO PANEL */}
        <section style={{
          background: "#FFFFFF",
          border: "1px solid var(--border)",
          borderRadius: "24px",
          padding: "32px",
          boxShadow: "0 12px 36px rgba(23, 20, 17, 0.04)",
          marginBottom: "32px",
          display: "grid",
          gridTemplateColumns: "1.4fr 0.8fr",
          gap: "32px",
          alignItems: "center"
        }} className="dashboard-hero">
          
          {/* Left panel: Info & Link & Progress */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{
                display: "inline-flex",
                padding: "5px 12px",
                borderRadius: "999px",
                fontSize: "0.78rem",
                fontWeight: 900,
                background: statusConfig.color,
                color: statusConfig.textColor,
                border: `1px solid ${statusConfig.borderColor}`
              }}>
                {statusConfig.label}
              </span>
              {profileType && PROFILE_TYPE_LABEL[profileType] && (
                <span style={tagStyle}>{PROFILE_TYPE_LABEL[profileType]}</span>
              )}
              {genre && <span style={tagStyle}>{genre}</span>}
            </div>

            <h1 className="display" style={{ fontSize: "clamp(1.8rem, 5vw, 2.6rem)", color: "var(--navy)", fontWeight: 950, letterSpacing: "-0.04em", margin: 0 }}>
              {name || "아티스트"}님의 POPOK
            </h1>

            {/* Profile Completion Indicator */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "0.84rem", fontWeight: 800, color: "var(--navy)" }}>프로필 완성도 (Profile Completion)</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 950, color: "var(--accent-dark)" }}>{completionPercentage}%</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--border)", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{
                  width: `${completionPercentage}%`,
                  height: "100%",
                  background: "var(--accent-dark)",
                  borderRadius: "99px",
                  transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
                }} />
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", fontWeight: 700 }}>
                {completionPercentage < 100 
                  ? "💡 이름, 프로필 사진, 소개, 영상, 대표작품, SNS를 모두 등록하면 100%가 완성됩니다."
                  : "🎉 프로필이 완벽하게 정리되었습니다! 언제든 카드를 공유해보세요."}
              </span>
            </div>

            {/* Public Link Box */}
            <div className="public-link-box" style={{
              background: "var(--bg-warm)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px"
            }}>
              <div style={{ minWidth: 0, flex: 1, maxWidth: "100%" }}>
                <span style={{ display: "block", fontSize: "0.72rem", color: "var(--ink-muted)", fontWeight: 800, marginBottom: "2px" }}>내 공개 링크</span>
                <Link href={`/artists/${artist.slug}`} target="_blank" style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--navy)", textDecoration: "underline", wordBreak: "break-all" }}>
                  {publicUrl}
                </Link>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={smallButtonStyle}
                >
                  {copied ? "✓ 복사됨" : "🔗 링크 복사"}
                </button>
                <Link
                  href={`/artists/${artist.slug}`}
                  target="_blank"
                  style={{ ...smallButtonStyle, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                >
                  👁️ 새 창 보기
                </Link>
              </div>
            </div>
          </div>

          {/* Right panel: Actions Box & Quick Save */}
          <div style={{
            background: "var(--bg-warm)",
            border: "1px solid var(--border)",
            borderRadius: "18px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 900, color: "var(--navy)", margin: 0 }}>퀵 메뉴 (Quick Actions)</h3>
            <button
              onClick={() => {
                setAiState("import");
                setAiModalOpen(true);
              }}
              style={{
                width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
                padding: "12px", borderRadius: "10px", fontWeight: 900, fontSize: "0.88rem",
                background: "linear-gradient(135deg, var(--navy) 0%, #1e293b 100%)", color: "var(--accent)",
                border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(23, 20, 17, 0.08)"
              }}
            >
              ✨ AI로 프로필 업데이트
            </button>
            <button
              onClick={() => setShareModalOpen(true)}
              className="btn-outline"
              style={{
                width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
                padding: "12px", borderRadius: "10px", fontWeight: 850, fontSize: "0.88rem", border: "1.5px solid var(--navy)"
              }}
            >
              📤 명함 공유 / QR 다운로드
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-lime"
              style={{
                width: "100%", padding: "14px", borderRadius: "10px", fontWeight: 900, fontSize: "0.95rem",
                border: "none", cursor: saving ? "not-allowed" : "pointer"
              }}
            >
              {saving ? "저장 중..." : "💾 변경사항 저장하기"}
            </button>
          </div>
        </section>

        {saveSuccess && (
          <div className="fade-up" style={{
            background: "var(--accent-light)",
            border: "1.5px solid var(--accent-dark)",
            color: "var(--navy)",
            borderRadius: "12px",
            padding: "16px 24px",
            fontWeight: 800,
            fontSize: "0.95rem",
            marginBottom: "24px",
            textAlign: "center"
          }}>
            ✓ 프로필 정보가 성공적으로 저장되었습니다! 아티스트 페이지에 즉시 반영됩니다.
          </div>
        )}

        <div style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: "32px",
          alignItems: "start"
        }} className="editor-grid">
          
          {/* Main Edit Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            
            {/* Card 1: 기본 정보 */}
            <div className="editor-card" style={{ background: "#FFFFFF", padding: "32px", borderRadius: "18px", border: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--navy)", marginBottom: "20px", borderBottom: "1.5px solid var(--border)", paddingBottom: "10px" }}>
                1. 기본 활동 정보
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="form-row-2col">
                  <label style={labelStyle}>
                    이름 (필수)
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="활동명" style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    영문 이름
                    <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="English Name" style={inputStyle} />
                  </label>
                </div>

                <label style={labelStyle}>
                  내 POPOK 주소 슬러그
                  <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
                    <span style={{ position: "absolute", left: "14px", color: "var(--ink-muted)", fontSize: "0.9rem", fontWeight: 700 }}>popok.kr/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="address-slug"
                      style={{ ...inputStyle, paddingLeft: "76px" }}
                    />
                  </div>
                  {slugStatus.message && (
                    <span style={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: slugStatus.valid ? "var(--verified)" : "var(--needs-review)",
                      marginTop: "4px"
                    }}>
                      {slugStatus.message}
                    </span>
                  )}
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="form-row-2col">
                  <label style={labelStyle}>
                    주 활동 분야 (장르)
                    <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="예: 현대무용" style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    주 역할
                    <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="예: 안무가" style={inputStyle} />
                  </label>
                </div>
              </div>
            </div>

            {/* Card 2: 프로필 미디어 및 소개 */}
            <div className="editor-card" style={{ background: "#FFFFFF", padding: "32px", borderRadius: "18px", border: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--navy)", marginBottom: "20px", borderBottom: "1.5px solid var(--border)", paddingBottom: "10px" }}>
                2. 프로필 소개 및 미디어
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <label style={labelStyle}>
                  한 줄 소개 요약
                  <textarea
                    value={bioShort}
                    onChange={(e) => setBioShort(e.target.value)}
                    placeholder="검색 카드 또는 명함 상단에 노출될 짧은 소개글입니다."
                    rows={2}
                    style={textareaStyle}
                  />
                </label>

                <label style={labelStyle}>
                  상세 소개글 (바이오)
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="상세 페이지에서 아티스트를 소개하는 전체 소개글입니다."
                    rows={5}
                    style={textareaStyle}
                  />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }} className="form-row-2col">
                  <label style={labelStyle}>
                    대표 프로필 이미지 URL
                    <input type="text" value={profileImageUrl} onChange={(e) => setProfileImageUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
                    <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "4px" }}>또는 아래 업로드 버튼으로 직접 등록하세요.</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "profile")}
                      style={{ display: "none" }}
                      id="profile-img-upload-input"
                    />
                    <label
                      htmlFor="profile-img-upload-input"
                      className="btn-outline"
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        textAlign: "center",
                        fontSize: "0.82rem",
                        fontWeight: 800,
                        cursor: uploadingImage ? "not-allowed" : "pointer",
                        marginTop: "8px",
                        display: "inline-flex",
                        justifyContent: "center",
                        alignItems: "center",
                        border: "1.5px solid var(--navy)"
                      }}
                    >
                      {uploadingImage ? "이미지 업로드 중..." : "📸 파일 업로드하기"}
                    </label>
                  </label>
                  <div style={{
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    width: "120px",
                    height: "120px",
                    background: "var(--bg-warm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="Profile Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "var(--ink-faint)" }}>이미지 없음</span>
                    )}
                  </div>
                </div>

                {/* REPRESENTATIVE PROFILE IMAGE SELECTOR FROM WORKS LIST */}
                {workImages.length > 0 && (
                  <div style={{ border: "1px dashed var(--border-dark)", borderRadius: "14px", padding: "16px", background: "var(--bg-warm)", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}>
                    <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 850, color: "var(--navy)", marginBottom: "10px" }}>
                      💡 작품 이미지에서 대표 이미지 지정
                    </span>
                    <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px", width: "100%", maxWidth: "100%", minWidth: 0 }} className="no-scrollbar">
                      {workImages.map((url, index) => (
                        <div
                          key={index}
                          onClick={() => setProfileImageUrl(url)}
                          style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: profileImageUrl === url ? "2.5px solid var(--accent-dark)" : "1.5px solid var(--border)",
                            cursor: "pointer",
                            position: "relative",
                            flexShrink: 0
                          }}
                        >
                          <img src={url} alt={`Work img ${index}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          {profileImageUrl === url && (
                            <div style={{ position: "absolute", top: "2px", right: "2px", background: "var(--accent-dark)", color: "var(--navy)", borderRadius: "50%", width: "14px", height: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 900 }}>✓</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <label style={labelStyle}>
                  모션 프로필 영상
                  <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", fontWeight: 500, display: "block", marginBottom: "4px" }}>
                    아티스트 상세페이지에 처음 표시되는 세로형 프로필 영상입니다.
                    9:16 비율의 YouTube Shorts, Vimeo 세로 영상 또는 MP4 링크를 권장합니다.
                  </span>
                  <input type="text" value={motionVideoUrl} onChange={(e) => setMotionVideoUrl(e.target.value)} placeholder="예: https://youtube.com/embed/..." style={inputStyle} />
                </label>

                <label style={labelStyle}>
                  추가 소개 영상
                  <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", fontWeight: 500, display: "block", marginBottom: "4px" }}>
                    상세페이지 본문에 표시되는 가로형 소개 또는 하이라이트 영상입니다.
                  </span>
                  <input type="text" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="예: https://www.youtube.com/watch?v=..." style={inputStyle} />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="form-row-2col">
                  <label style={labelStyle}>
                    인스타그램 아이디
                    <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="username" style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    개인 웹사이트 주소
                    <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." style={inputStyle} />
                  </label>
                </div>
              </div>
            </div>

            {/* Card 3: 작품 목록 관리 (jsonb) */}
            <div className="editor-card" style={{ background: "#FFFFFF", padding: "32px", borderRadius: "18px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1.5px solid var(--border)", paddingBottom: "10px" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--navy)", margin: 0 }}>
                  3. 작품 및 프로젝트 목록{" "}
                  <span style={{ fontSize: "0.9rem", color: "var(--ink-muted)", marginLeft: "6px" }}>
                    ({isPremium ? `${works.length}개` : `${works.length} / 3`})
                  </span>
                </h2>
                {(isPremium || works.length < 3) && (
                  <button
                    type="button"
                    onClick={handleAddWork}
                    className="btn-lime"
                    style={{ border: "none", padding: "8px 16px", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 900, cursor: "pointer" }}
                  >
                    ＋ 작품 추가
                  </button>
                )}
              </div>

              {works.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", background: "var(--bg-warm)", borderRadius: "12px", border: "1px dashed var(--border-dark)" }}>
                  <span style={{ fontSize: "2rem", display: "block", marginBottom: "8px" }}>📁</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--ink-muted)" }}>등록된 대표 작품이 없습니다. 작품 추가를 클릭해 등록해 보세요.</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {works.map((work, idx) => (
                    <div key={work.id || idx} style={{
                      padding: "24px",
                      borderRadius: "14px",
                      border: "1.5px solid var(--border)",
                      background: "#FAF8F5",
                      position: "relative"
                    }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveWork(idx)}
                        style={{
                          position: "absolute",
                          top: "14px",
                          right: "14px",
                          border: 0,
                          background: "transparent",
                          color: "var(--needs-review)",
                          fontWeight: 800,
                          fontSize: "0.82rem",
                          cursor: "pointer"
                        }}
                      >
                        ✕ 삭제
                      </button>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "12px" }} className="form-row-2col">
                        <label style={labelStyle}>
                          작품명 (Title)
                          <input
                            type="text"
                            value={work.title}
                            onChange={(e) => handleWorkInputChange(idx, "title", e.target.value)}
                            placeholder="작품 제목"
                            style={inputStyle}
                          />
                        </label>
                        <label style={labelStyle}>
                          제작년도 (Year)
                          <input
                            type="text"
                            value={work.year || ""}
                            onChange={(e) => handleWorkInputChange(idx, "year", e.target.value)}
                            placeholder="예: 2025"
                            style={inputStyle}
                          />
                        </label>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "12px" }} className="form-row-2col">
                        <label style={labelStyle}>
                          나의 역할 (Role)
                          <input
                            type="text"
                            value={work.role || ""}
                            onChange={(e) => handleWorkInputChange(idx, "role", e.target.value)}
                            placeholder="예: 안무 및 출연"
                            style={inputStyle}
                          />
                        </label>
                        <label style={labelStyle}>
                          작품 영상
                          <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", fontWeight: 500, display: "block", marginBottom: "4px" }}>
                            이 작품을 소개하는 영상입니다.
                          </span>
                          <input
                            type="text"
                            value={work.video_url || ""}
                            onChange={(e) => handleWorkInputChange(idx, "video_url", e.target.value)}
                            placeholder="https://..."
                            style={inputStyle}
                          />
                        </label>
                      </div>

                      <label style={labelStyle}>
                        작품 소개 요약 (Description)
                        <textarea
                          value={work.description || ""}
                          onChange={(e) => handleWorkInputChange(idx, "description", e.target.value)}
                          placeholder="작품에 대한 간단한 설명을 입력해 주세요."
                          rows={2}
                          style={{ ...textareaStyle, marginBottom: "12px" }}
                        />
                      </label>

                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "16px", alignItems: "end" }} className="form-row-2col">
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <label style={labelStyle}>
                            작품 이미지 대표 URL
                            <input
                              type="text"
                              value={work.image_url || ""}
                              onChange={(e) => handleWorkInputChange(idx, "image_url", e.target.value)}
                              placeholder="https://..."
                              style={inputStyle}
                            />
                          </label>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, idx)}
                              style={{ display: "none" }}
                              id={`work-image-input-${idx}`}
                            />
                            <label
                              htmlFor={`work-image-input-${idx}`}
                              className="btn-outline"
                              style={{
                                padding: "8px 12px",
                                borderRadius: "10px",
                                fontSize: "0.78rem",
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "inline-flex",
                                justifyContent: "center",
                                border: "1.5px solid var(--navy)"
                              }}
                            >
                              📷 파일 업로드
                            </label>

                            {/* SELECT WORK IMAGE AS REPRESENTATIVE PORTRAIT INLINE */}
                            {work.image_url && (
                              <button
                                type="button"
                                onClick={() => {
                                  setProfileImageUrl(work.image_url || "");
                                  alert("대표 이미지로 임시 설정되었습니다! 최상단 저장하기 버튼을 누르면 적용됩니다.");
                                }}
                                style={{
                                  border: "1.5px solid var(--navy)",
                                  borderRadius: "10px",
                                  padding: "8px 12px",
                                  fontSize: "0.78rem",
                                  fontWeight: 800,
                                  background: profileImageUrl === work.image_url ? "var(--accent)" : "#FFFFFF",
                                  cursor: "pointer"
                                }}
                              >
                                {profileImageUrl === work.image_url ? "★ 대표 설정됨" : "☆ 대표로 설정"}
                              </button>
                            )}
                          </div>
                        </div>
                        <div style={{
                          border: "1px solid var(--border)",
                          borderRadius: "10px",
                          height: "90px",
                          overflow: "hidden",
                          background: "var(--bg-warm)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          {work.image_url ? (
                            <img src={work.image_url} alt="Work Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "var(--ink-faint)" }}>이미지 없음</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Premium Gating Promo Card */}
              {!isPremium && works.length >= 3 && (
                <div style={{
                  marginTop: "24px",
                  padding: "24px",
                  background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
                  borderRadius: "14px",
                  border: "1px solid #334155",
                  color: "#FFFFFF",
                  textAlign: "center",
                  boxShadow: "0 10px 25px rgba(23, 20, 17, 0.12)"
                }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 900, marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <span>🔒 Premium</span>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#94A3B8", marginBottom: "16px", lineHeight: 1.5 }}>
                    대표 작품을 무제한 등록하고 AI 자동 업데이트를 받아보세요.
                  </p>
                  <Link href="/premium" onClick={() => analytics.premiumClick("dashboard")} style={{
                    display: "inline-block",
                    textDecoration: "none",
                    background: "var(--accent)",
                    color: "var(--navy)",
                    fontWeight: 900,
                    fontSize: "0.82rem",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "1.5px solid var(--navy)"
                  }}>
                    Premium 알아보기
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Card Preview Sidebar */}
          <div style={{ position: "sticky", top: "40px", display: "flex", flexDirection: "column", gap: "24px" }} className="editor-sidebar">
            <div style={{
              background: "#FFFFFF",
              padding: "24px",
              borderRadius: "18px",
              border: "1px solid var(--border)",
              boxShadow: "0 10px 30px rgba(23, 20, 17, 0.03)"
            }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--navy)", marginBottom: "16px" }}>
                내 POPOK 실시간 카드 미리보기
              </h3>
              
              <div style={{ display: "flex", justifyContent: "center" }}>
                <PopokCard
                  name={name || "이름 입력 전"}
                  nameEn={nameEn || undefined}
                  genre={genre || "장르 입력 전"}
                  instagram={instagram || ""}
                  id={artist.id}
                  slug={slug || artist.id}
                  profileImage={profileImageUrl || undefined}
                />
              </div>
              <p style={{
                color: "var(--ink-muted)",
                fontSize: "0.78rem",
                textAlign: "center",
                marginTop: "16px",
                lineHeight: 1.4
              }}>
                ※ 저장하기를 클릭하면 변경된 정보가 적용되어 실시간으로 반영됩니다.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* SHARE AND QR GENERATION MODAL DIALOG */}
      {shareModalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(23, 20, 17, 0.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px"
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: "20px", border: "1px solid var(--border)",
            width: "100%", maxWidth: "420px", padding: "32px", position: "relative",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            animation: "dimFadeIn 0.3s ease"
          }}>
            <button
              onClick={() => setShareModalOpen(false)}
              style={{
                position: "absolute", top: "18px", right: "18px", border: 0, background: "transparent",
                fontSize: "1.2rem", fontWeight: 900, cursor: "pointer", color: "var(--ink-muted)"
              }}
            >
              ✕
            </button>

            <h3 style={{ fontSize: "1.3rem", fontWeight: 950, color: "var(--navy)", marginBottom: "8px", textAlign: "center" }}>
              내 디지털 명함 공유하기
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", textAlign: "center", marginBottom: "24px", lineHeight: 1.5 }}>
              QR 코드를 스캔하거나 SNS를 통해 하나의 링크로 예술 세계를 연결하세요.
            </p>

            {/* QR Code Frame */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
              padding: "20px", background: "var(--bg-warm)", borderRadius: "14px",
              border: "1px solid var(--border)", marginBottom: "24px"
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicUrl)}`}
                alt="POPOK QR Code"
                style={{ width: "180px", height: "180px", background: "#FFFFFF", padding: "6px", borderRadius: "8px", border: "1px solid var(--border)" }}
              />
              <button
                type="button"
                onClick={handleDownloadQR}
                className="btn-outline"
                style={{ fontSize: "0.78rem", fontWeight: 800, padding: "8px 16px", borderRadius: "8px", border: "1.5px solid var(--navy)" }}
              >
                📥 QR 이미지 다운로드
              </button>
            </div>

            {/* SNS Sharing Links */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 850, color: "var(--navy)" }}>SNS로 공유</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <a
                  href={`https://twitter.com/intent/tweet?text=POPOK에서 저의 포트폴리오 디지털 명함을 만나보세요!&url=${encodeURIComponent(publicUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "6px",
                    textDecoration: "none", background: "#1D9BF0", color: "#FFFFFF", padding: "10px",
                    borderRadius: "10px", fontSize: "0.82rem", fontWeight: 900
                  }}
                >
                  X (Twitter)
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "6px",
                    textDecoration: "none", background: "#1877F2", color: "#FFFFFF", padding: "10px",
                    borderRadius: "10px", fontSize: "0.82rem", fontWeight: 900
                  }}
                >
                  Facebook
                </a>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="btn-lime"
                style={{ width: "100%", padding: "12px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 900, border: "none" }}
              >
                {copied ? "✓ 주소 복사 완료!" : "🔗 포트폴리오 링크 복사"}
              </button>
            </div>

          </div>
        </div>
      )}
      
      {/* AI Import Modal Overlay */}
      {aiModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(23, 20, 17, 0.4)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px"
        }}>
          <div className="card fade-up" style={{
            background: "#FFFFFF",
            border: "1.5px solid var(--border)",
            borderRadius: "20px",
            padding: "40px 32px",
            maxWidth: aiState === "compare" ? "720px" : "480px",
            width: "100%",
            maxHeight: "85vh",
            overflowY: "auto",
            boxShadow: "0 20px 50px rgba(23, 20, 17, 0.15)",
            transition: "max-width 0.2s ease"
          }}>
            {aiState === "import" && (
              <AiProfileImporter
                onParsed={(data) => {
                  setParsedResult(data);
                  setAiState("compare");
                }}
                onCancel={() => setAiModalOpen(false)}
              />
            )}
            {aiState === "compare" && parsedResult && (
              <AiProfileCompare
                currentProfile={{
                  name,
                  name_en: nameEn,
                  genre,
                  role,
                  bio_short: bioShort,
                  bio,
                  works,
                  affiliations,
                  current_activity: [],
                  awards,
                  competitions,
                  education,
                  links
                }}
                parsedProfile={parsedResult}
                onConfirm={(merged) => {
                  // Update state hooks with merged data
                  if (merged.artist.name) setName(merged.artist.name);
                  if (merged.artist.name_en) setNameEn(merged.artist.name_en);
                  if (merged.artist.genre) setGenre(merged.artist.genre);
                  if (merged.artist.role) setRole(merged.artist.role);
                  if (merged.artist.bio_short) setBioShort(merged.artist.bio_short);
                  if (merged.artist.bio) setBio(merged.artist.bio);

                  if (merged.works) setWorks(merged.works);
                  if (merged.affiliations) setAffiliations(merged.affiliations);
                  if (merged.awards) setAwards(merged.awards);
                  if (merged.competitions) setCompetitions(merged.competitions);
                  if (merged.education) setEducation(merged.education);
                  if (merged.links) setLinks(merged.links);

                  setAiModalOpen(false);
                }}
                onCancel={() => setAiState("import")}
              />
            )}
          </div>
        </div>
      )}

      {/* Visual responsive styles for sidebar/editor stack */}
      <style>{`
        @media (max-width: 900px) {
          .editor-grid {
            grid-template-columns: 1fr !important;
          }
          .editor-sidebar {
            position: static !important;
          }
          .dashboard-hero {
            grid-template-columns: 1fr !important;
            padding: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  color: "var(--navy)",
  fontSize: "0.76rem",
  fontWeight: 850,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--border)",
  borderRadius: "12px",
  padding: "13px 14px",
  fontFamily: "inherit",
  fontSize: "0.92rem",
  color: "var(--navy)",
  outline: "none",
  background: "#FFFFFF",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--border)",
  borderRadius: "12px",
  padding: "13px 14px",
  fontFamily: "inherit",
  fontSize: "0.92rem",
  color: "var(--navy)",
  outline: "none",
  background: "#FFFFFF",
  resize: "vertical",
  lineHeight: 1.5,
};

const tagStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "5px 12px",
  borderRadius: "999px",
  fontSize: "0.78rem",
  fontWeight: 800,
  background: "var(--tag-bg)",
  color: "var(--navy)",
};

const smallButtonStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid var(--border-dark)",
  borderRadius: "8px",
  padding: "6px 12px",
  fontSize: "0.78rem",
  fontWeight: 850,
  color: "var(--navy)",
  cursor: "pointer",
  fontFamily: "inherit"
};
