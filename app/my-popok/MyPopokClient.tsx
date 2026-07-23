"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import PopokCard from "@/components/PopokCard";
import AiProfileImporter from "@/components/profile/AiProfileImporter";
import AiProfileCompare from "@/components/profile/AiProfileCompare";
import { analytics } from "@/lib/analytics";
import CompanyCmsEditor from "@/components/company/CompanyCmsEditor";
import CompanyClaimModal from "@/components/company/CompanyClaimModal";
import ReceivedPortfolioRequests from "@/components/portfolio-requests/ReceivedPortfolioRequests";
import SentPortfolioRequests from "@/components/portfolio-requests/SentPortfolioRequests";
import { ArrayField, StringArrayField } from "@/components/admin/ArrayField";
import {
  normalizeArtistEducation,
  normalizeArtistCurrentActivity,
  normalizeArtistAffiliations,
  normalizeArtistAwards,
  normalizeArtistCompetitions,
  normalizeArtistRepresentativeImages,
  cleanArtistRepresentativeImagesForPayload,
  cleanArtistEducationForPayload,
  cleanArtistCurrentActivityForPayload,
  cleanArtistAffiliationsForPayload,
  cleanArtistAwardsForPayload,
  cleanArtistCompetitionsForPayload,
  type ArtistAffiliation,
  type ArtistAward,
} from "@/lib/artist-profile";
import { normalizeWorkImages, normalizeWorks, cleanWorksForPayload, cleanWorkForPayload } from "@/lib/works";
import type { Company } from "@/types";

interface Work {
  id: string;
  title: string;
  year?: string | number | null;
  description?: string;
  role?: string;
  image_url?: string;
  images?: string[];
  video_url?: string;
  credits?: any;
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
  profile_image_urls?: string[];
  motion_video_url?: string | null;
  youtube_url?: string | null;
  instagram?: string | null;
  website?: string | null;
  works?: Work[] | null;
  status?: string | null;
  verified?: boolean | null;
  affiliations?: ArtistAffiliation[];
  current_activity?: string[];
  education?: string[];
  awards?: ArtistAward[];
  competitions?: ArtistAward[];
  links?: any[];
}

const PROFILE_TYPE_LABEL: Record<string, string> = {
  artist: "개인",
  organization: "단체",
};

export default function MyPopokClient({
  initialArtist,
  profileType,
  initialOwnedCompanies = [],
}: {
  initialArtist: Artist;
  profileType?: string | null;
  initialOwnedCompanies?: Company[];
}) {
  const [artist, setArtist] = useState<Artist>(initialArtist);
  const [ownedCompanies, setOwnedCompanies] = useState<Company[]>(initialOwnedCompanies);
  const [selectedContext, setSelectedContext] = useState<string>("artist"); // "artist" | "received-requests" | "sent-requests" | company.id
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const isPremium = false; // Stripe payment connection toggle point

  // Deep-link support: /my-popok?tab=received-portfolios (used by the
  // "새로운 포퐄이 도착했습니다" email's CTA button) or ?tab=sent-portfolios.
  // Reads window.location directly (not next/navigation's useSearchParams())
  // so this doesn't force a Suspense boundary onto the whole dashboard for
  // one deep-link param.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "received-portfolios") setSelectedContext("received-requests");
    else if (tab === "sent-portfolios") setSelectedContext("sent-requests");
  }, []);

  // Form states
  const [name, setName] = useState(artist.name || "");
  const [nameEn, setNameEn] = useState(artist.name_en || "");
  const [slug, setSlug] = useState(artist.slug || "");
  const [genre, setGenre] = useState(artist.genre || "");
  const [role, setRole] = useState(artist.role || "");
  const [bio, setBio] = useState(artist.bio || "");
  const [bioShort, setBioShort] = useState(artist.bio_short || "");
  const [profileImageUrl, setProfileImageUrl] = useState(artist.profile_image_url || "");
  const [profileImageUrls, setProfileImageUrls] = useState<string[]>(() =>
    normalizeArtistRepresentativeImages(artist.profile_image_urls)
  );
  const [motionVideoUrl, setMotionVideoUrl] = useState(artist.motion_video_url || "");
  const [youtubeUrl, setYoutubeUrl] = useState(artist.youtube_url || "");
  const [instagram, setInstagram] = useState(artist.instagram || "");
  const [website, setWebsite] = useState(artist.website || "");
  const [works, setWorks] = useState<Work[]>(() =>
    (Array.isArray(artist.works) ? artist.works : []).map(w => ({
      ...w,
      images: normalizeWorkImages(w)
    }))
  );

  // Activity Timeline / Education / Awards & Competitions — normalized on
  // load via lib/artist-profile.ts so any legacy/malformed shape in the DB
  // (defensive only; live data has none as of 2026-07-21) never breaks the
  // edit form. Same normalizers the public page uses, so what's editable
  // here always matches what's rendered there.
  const [affiliations, setAffiliations] = useState<ArtistAffiliation[]>(() => normalizeArtistAffiliations(artist.affiliations));
  const [currentActivity, setCurrentActivity] = useState<string[]>(() => normalizeArtistCurrentActivity(artist.current_activity));
  const [education, setEducation] = useState<string[]>(() => normalizeArtistEducation(artist.education));
  const [awards, setAwards] = useState<ArtistAward[]>(() => normalizeArtistAwards(artist.awards));
  const [competitions, setCompetitions] = useState<ArtistAward[]>(() => normalizeArtistCompetitions(artist.competitions));
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

  // Slot upload indicator
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  // Generic File Upload helper
  const uploadImageFile = async (file: File, slotKey: string): Promise<string | null> => {
    setUploadingSlot(slotKey);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", "artists/media");
      formData.append("bucket", "artist-media");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success && data.url) {
        return data.url;
      } else {
        alert(data.error || "이미지 업로드에 실패했습니다.");
        return null;
      }
    } catch {
      alert("이미지 업로드 중 오류가 발생했습니다.");
      return null;
    } finally {
      setUploadingSlot(null);
    }
  };

  // Profile Image Upload handler
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const url = await uploadImageFile(file, "profile");
    if (url) setProfileImageUrl(url);
    setUploadingImage(false);
  };

  // Representative Image Upload handler (up to 3 images)
  const handleRepresentativeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, slotIdx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImageFile(file, `rep_${slotIdx}`);
    if (url) {
      const updated = [...profileImageUrls];
      updated[slotIdx] = url;
      setProfileImageUrls(cleanArtistRepresentativeImagesForPayload(updated));
    }
  };

  // Representative Image Remove handler (slot removal from state only)
  const handleRemoveRepresentativeImage = (slotIdx: number) => {
    const updated = profileImageUrls.filter((_, idx) => idx !== slotIdx);
    setProfileImageUrls(updated);
  };

  // Work Image Upload handler (up to 4 images per work)
  const handleWorkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, workIdx: number, imgIdx?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const slotKey = `work_${workIdx}_${imgIdx ?? "new"}`;
    const url = await uploadImageFile(file, slotKey);
    if (url) {
      const updatedWorks = [...works];
      const targetWork = { ...updatedWorks[workIdx] };
      const currentImages = normalizeWorkImages(targetWork);

      if (imgIdx !== undefined && imgIdx < currentImages.length) {
        currentImages[imgIdx] = url;
      } else if (currentImages.length < 4) {
        currentImages.push(url);
      }

      targetWork.images = currentImages;
      targetWork.image_url = currentImages[0] || "";
      updatedWorks[workIdx] = targetWork;
      setWorks(updatedWorks);
    }
  };

  // Work Image Remove handler
  const handleRemoveWorkImage = (workIdx: number, imgIdx: number) => {
    const updatedWorks = [...works];
    const targetWork = { ...updatedWorks[workIdx] };
    const currentImages = normalizeWorkImages(targetWork).filter((_, idx) => idx !== imgIdx);

    targetWork.images = currentImages;
    targetWork.image_url = currentImages[0] || "";
    updatedWorks[workIdx] = targetWork;
    setWorks(updatedWorks);
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
      images: [],
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
      const cleanedWorks = cleanWorksForPayload(works);

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
          profile_image_urls: cleanArtistRepresentativeImagesForPayload(profileImageUrls),
          motion_video_url: motionVideoUrl.trim() || null,
          youtube_url: youtubeUrl.trim() || null,
          instagram: instagram.trim() || null,
          website: website.trim() || null,
          works: cleanedWorks,
          affiliations: cleanArtistAffiliationsForPayload(affiliations),
          current_activity: cleanArtistCurrentActivityForPayload(currentActivity),
          education: cleanArtistEducationForPayload(education),
          awards: cleanArtistAwardsForPayload(awards),
          competitions: cleanArtistCompetitionsForPayload(competitions),
          links
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setArtist(data.data);
        if (data.data?.profile_image_urls) {
          setProfileImageUrls(normalizeArtistRepresentativeImages(data.data.profile_image_urls));
        }
        if (data.data?.works) {
          setWorks(normalizeWorks(data.data.works));
        }
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

  const selectedCompany = useMemo(() => {
    if (selectedContext === "artist") return null;
    return ownedCompanies.find((c) => c.id === selectedContext) || null;
  }, [selectedContext, ownedCompanies]);

  const handleUpdateOwnedCompanyInState = (updatedCompany: Company) => {
    setOwnedCompanies((prev) =>
      prev.map((c) => (c.id === updatedCompany.id ? updatedCompany : c))
    );
  };

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh", padding: "40px 16px 120px" }}>
      <div className="my-popok-container" style={{ maxWidth: "1080px", margin: "0 auto" }}>
        
        {/* ACCOUNT / ORGANIZATION CONTEXT SWITCHER BAR */}
        <div
          style={{
            marginBottom: "24px",
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1.5px solid var(--border)",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            boxShadow: "0 4px 16px rgba(23, 20, 17, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <span className="mono" style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--ink-muted)", textTransform: "uppercase" }}>
              내 프로필 / 단체 관리:
            </span>

            {/* Profile Options */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setSelectedContext("artist")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  border: selectedContext === "artist" ? "1.5px solid var(--navy)" : "1px solid var(--border)",
                  backgroundColor: selectedContext === "artist" ? "var(--navy)" : "#FFFFFF",
                  color: selectedContext === "artist" ? "#FFFFFF" : "var(--navy)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <span>○ 내 프로필</span>
                <span style={{ opacity: 0.75, fontSize: "0.75rem" }}>({artist.name})</span>
              </button>

              {ownedCompanies.length > 0 && (
                <span style={{ color: "var(--border-dark)", fontSize: "0.8rem", margin: "0 4px" }}>|</span>
              )}

              {ownedCompanies.map((comp) => (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => setSelectedContext(comp.id)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    border: selectedContext === comp.id ? "1.5px solid var(--navy)" : "1px solid var(--border)",
                    backgroundColor: selectedContext === comp.id ? "var(--navy)" : "#FFFFFF",
                    color: selectedContext === comp.id ? "#FFFFFF" : "var(--navy)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>○ {comp.name}</span>
                  <span style={{ fontSize: "0.62rem", background: selectedContext === comp.id ? "rgba(255,255,255,0.2)" : "#FAF9F5", padding: "2px 6px", borderRadius: "10px" }}>
                    단체
                  </span>
                </button>
              ))}

              <span style={{ color: "var(--border-dark)", fontSize: "0.8rem", margin: "0 4px" }}>|</span>

              <button
                type="button"
                onClick={() => setSelectedContext("received-requests")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  border: selectedContext === "received-requests" ? "1.5px solid var(--navy)" : "1px solid var(--border)",
                  backgroundColor: selectedContext === "received-requests" ? "var(--navy)" : "#FFFFFF",
                  color: selectedContext === "received-requests" ? "#FFFFFF" : "var(--navy)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                받은 포퐄
              </button>

              <button
                type="button"
                onClick={() => setSelectedContext("sent-requests")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  border: selectedContext === "sent-requests" ? "1.5px solid var(--navy)" : "1px solid var(--border)",
                  backgroundColor: selectedContext === "sent-requests" ? "var(--navy)" : "#FFFFFF",
                  color: selectedContext === "sent-requests" ? "#FFFFFF" : "var(--navy)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                보낸 포퐄
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setClaimModalOpen(true)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 800,
              color: "var(--navy)",
              background: "#FAF9F5",
              border: "1.5px solid var(--navy)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "var(--navy)"}
            onMouseOut={(e) => e.currentTarget.style.background = "#FAF9F5"}
          >
            + 단체 연결 신청
          </button>
        </div>

        {/* CONDITIONAL RENDER: ORGANIZATION CMS, PORTFOLIO REQUESTS, OR PERSONAL ARTIST CMS */}
        {selectedCompany ? (
          <CompanyCmsEditor
            company={selectedCompany}
            onSaveSuccess={handleUpdateOwnedCompanyInState}
          />
        ) : selectedContext === "received-requests" ? (
          <ReceivedPortfolioRequests onToast={(msg) => alert(msg)} />
        ) : selectedContext === "sent-requests" ? (
          <SentPortfolioRequests onToast={(msg) => alert(msg)} />
        ) : (
          <>
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
              background: "#FFFFFF",
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
            background: "#FFFFFF",
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
            
            {/* Card 1: 기본 정보 & 프로필/대표 이미지 갤러리 */}
            <div className="editor-card" style={{ background: "#FFFFFF", padding: "32px", borderRadius: "18px", border: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--navy)", marginBottom: "20px", borderBottom: "1.5px solid var(--border)", paddingBottom: "10px" }}>
                1. 기본 활동 정보 & 프로필 이미지
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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

                {/* 프로필 이미지 (프로필 썸네일·사진 1장) */}
                <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "16px" }}>
                  <label style={{ ...labelStyle, fontSize: "0.85rem", color: "var(--navy)" }}>
                    프로필 사진 (프로필 썸네일 1장)
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
                    <div style={{
                      width: "90px", height: "90px", borderRadius: "50%", overflow: "hidden",
                      border: "2px solid var(--border)", background: "#FAF9F5",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      {profileImageUrl ? (
                        <img src={profileImageUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>사진 없음</span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexGrow: 1 }}>
                      <input
                        type="text"
                        value={profileImageUrl}
                        onChange={(e) => setProfileImageUrl(e.target.value)}
                        placeholder="https://..."
                        style={inputStyle}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        style={{ display: "none" }}
                        id="profile-photo-file-input"
                        disabled={uploadingImage || uploadingSlot === "profile"}
                      />
                      <label
                        htmlFor="profile-photo-file-input"
                        className="btn-outline"
                        style={{
                          padding: "8px 14px", borderRadius: "8px", fontSize: "0.78rem",
                          fontWeight: 800, cursor: (uploadingImage || uploadingSlot === "profile") ? "not-allowed" : "pointer",
                          display: "inline-flex", justifyContent: "center", alignItems: "center",
                          border: "1.5px solid var(--navy)", width: "fit-content"
                        }}
                      >
                        {uploadingSlot === "profile" ? "업로드 중..." : "📸 사진 업로드"}
                      </label>
                    </div>
                  </div>
                </div>

                {/* 대표 이미지 갤러리 (공개 상세페이지 대표 갤러리 최대 3장) */}
                <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                    <label style={{ ...labelStyle, fontSize: "0.85rem", color: "var(--navy)", margin: 0 }}>
                      공개 상세페이지 대표 이미지 갤러리 (최대 3장)
                    </label>
                    <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", fontWeight: 700 }}>
                      {profileImageUrls.length} / 3 장
                    </span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)", display: "block", marginBottom: "12px" }}>
                    공개 프로필 하단 갤러리 영역에 표출됩니다. (프로필 사진과 별개로 관리됩니다)
                  </span>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                    {[0, 1, 2].map((slotIdx) => {
                      const imgUrl = profileImageUrls[slotIdx];
                      const isUploadingThis = uploadingSlot === `rep_${slotIdx}`;
                      return (
                        <div
                          key={slotIdx}
                          style={{
                            position: "relative",
                            aspectRatio: "1.3 / 1",
                            borderRadius: "10px",
                            border: "1.5px dashed var(--border)",
                            background: "#FAF9F5",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "6px"
                          }}
                        >
                          {imgUrl ? (
                            <>
                              <img src={imgUrl} alt={`대표 이미지 ${slotIdx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              <button
                                type="button"
                                onClick={() => handleRemoveRepresentativeImage(slotIdx)}
                                style={{
                                  position: "absolute", top: "6px", right: "6px",
                                  width: "24px", height: "24px", borderRadius: "50%",
                                  background: "rgba(23, 20, 17, 0.8)", color: "#FFFFFF",
                                  border: "none", cursor: "pointer", fontSize: "0.9rem",
                                  display: "flex", alignItems: "center", justifyContent: "center"
                                }}
                                title="슬롯 제거"
                              >
                                ×
                              </button>
                            </>
                          ) : (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleRepresentativeImageUpload(e, slotIdx)}
                                style={{ display: "none" }}
                                id={`rep-img-input-${slotIdx}`}
                                disabled={Boolean(uploadingSlot)}
                              />
                              <label
                                htmlFor={`rep-img-input-${slotIdx}`}
                                style={{
                                  width: "100%", height: "100%", display: "flex",
                                  flexDirection: "column", alignItems: "center", justifyContent: "center",
                                  cursor: uploadingSlot ? "not-allowed" : "pointer", gap: "4px"
                                }}
                              >
                                <span style={{ fontSize: "1.1rem" }}>{isUploadingThis ? "⏳" : "🖼️"}</span>
                                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--navy)" }}>
                                  {isUploadingThis ? "업로드 중..." : `대표 ${slotIdx + 1}`}
                                </span>
                              </label>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* Card 2: 프로필 미디어 및 소개 */}
            <div className="editor-card" style={{ background: "#FFFFFF", padding: "32px", borderRadius: "18px", border: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--navy)", marginBottom: "20px", borderBottom: "1.5px solid var(--border)", paddingBottom: "10px" }}>
                2. 프로필 소개 및 비디어 URL
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="form-row-2col">
                  <label style={labelStyle}>
                    15초 모션 영상 URL
                    <input
                      type="text"
                      value={motionVideoUrl}
                      onChange={(e) => setMotionVideoUrl(e.target.value)}
                      placeholder="https://... (MP4 / WebM)"
                      style={inputStyle}
                    />
                  </label>
                  <label style={labelStyle}>
                    유튜브 소개/하이라이트 영상 URL
                    <input
                      type="text"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      style={inputStyle}
                    />
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
                <div style={{ textAlign: "center", padding: "40px", background: "#FFFFFF", borderRadius: "12px", border: "1px dashed var(--border-dark)" }}>
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

                      {/* Work Multi-Images (Up to 4 images) */}
                      <div style={{ marginTop: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                          <label style={{ ...labelStyle, fontSize: "0.8rem", color: "var(--navy)", margin: 0 }}>
                            작품 이미지 (최대 4장)
                          </label>
                          <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", fontWeight: 700 }}>
                            {normalizeWorkImages(work).length} / 4 장
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                          {[0, 1, 2, 3].map((imgIdx) => {
                            const workImgs = normalizeWorkImages(work);
                            const imgUrl = workImgs[imgIdx];
                            const isUploadingThis = uploadingSlot === `work_${idx}_${imgIdx}`;
                            return (
                              <div
                                key={imgIdx}
                                style={{
                                  position: "relative",
                                  aspectRatio: "1.3 / 1",
                                  borderRadius: "8px",
                                  border: "1.5px dashed var(--border)",
                                  background: "#FFFFFF",
                                  overflow: "hidden",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "4px"
                                }}
                              >
                                {imgUrl ? (
                                  <>
                                    <img src={imgUrl} alt={`Work ${idx + 1} Img ${imgIdx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveWorkImage(idx, imgIdx)}
                                      style={{
                                        position: "absolute", top: "4px", right: "4px",
                                        width: "20px", height: "20px", borderRadius: "50%",
                                        background: "rgba(23, 20, 17, 0.8)", color: "#FFFFFF",
                                        border: "none", cursor: "pointer", fontSize: "0.8rem",
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                      }}
                                      title="이미지 삭제"
                                    >
                                      ×
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleWorkImageUpload(e, idx, imgIdx)}
                                      style={{ display: "none" }}
                                      id={`work-img-input-${idx}-${imgIdx}`}
                                      disabled={Boolean(uploadingSlot)}
                                    />
                                    <label
                                      htmlFor={`work-img-input-${idx}-${imgIdx}`}
                                      style={{
                                        width: "100%", height: "100%", display: "flex",
                                        flexDirection: "column", alignItems: "center", justifyContent: "center",
                                        cursor: uploadingSlot ? "not-allowed" : "pointer", gap: "2px"
                                      }}
                                    >
                                      <span style={{ fontSize: "1rem" }}>{isUploadingThis ? "⏳" : "📷"}</span>
                                      <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--navy)" }}>
                                        {isUploadingThis ? "업로드..." : `+ 이미지 ${imgIdx + 1}`}
                                      </span>
                                    </label>
                                  </>
                                )}
                              </div>
                            );
                          })}
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

            {/* Card 4: 활동 타임라인 (공개 페이지의 ACTIVITY TIMELINE — current_activity + affiliations) */}
            <div className="editor-card" style={{ background: "#FFFFFF", padding: "32px", borderRadius: "18px", border: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--navy)", marginBottom: "20px", borderBottom: "1.5px solid var(--border)", paddingBottom: "10px" }}>
                4. 활동 타임라인
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <StringArrayField
                  label="현재 활동 (CURRENT)"
                  items={currentActivity}
                  onChange={setCurrentActivity}
                  placeholder="예: OO컴퍼니 출강 중"
                />
                <ArrayField<ArtistAffiliation>
                  label="소속 / 활동 이력 (AFFILIATION)"
                  items={affiliations}
                  onChange={setAffiliations}
                  newItem={() => ({})}
                  addLabel="+ 소속·활동 이력 추가"
                  renderItem={(item, set) => (
                    <>
                      <input style={inputStyle} placeholder="소속/프로젝트명" value={item.name || ""} onChange={(e) => set({ ...item, name: e.target.value })} />
                      <input style={inputStyle} placeholder="역할/직책 (선택)" value={item.position || ""} onChange={(e) => set({ ...item, position: e.target.value })} />
                      <input style={inputStyle} placeholder="연도 (선택)" value={item.year || ""} onChange={(e) => set({ ...item, year: e.target.value })} />
                    </>
                  )}
                />
              </div>
            </div>

            {/* Card 5: 학력 */}
            <div className="editor-card" style={{ background: "#FFFFFF", padding: "32px", borderRadius: "18px", border: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--navy)", marginBottom: "20px", borderBottom: "1.5px solid var(--border)", paddingBottom: "10px" }}>
                5. 학력
              </h2>
              <StringArrayField
                label="학력 (Education)"
                items={education}
                onChange={setEducation}
                placeholder="예: 한국예술종합학교 무용이론과 졸업"
              />
            </div>

            {/* Card 6: 수상 및 선정 / 콩쿠르 및 진출 */}
            <div className="editor-card" style={{ background: "#FFFFFF", padding: "32px", borderRadius: "18px", border: "1px solid var(--border)" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--navy)", marginBottom: "20px", borderBottom: "1.5px solid var(--border)", paddingBottom: "10px" }}>
                6. 수상 및 선정
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <ArrayField<ArtistAward>
                  label="수상 및 선정 내역 (Awards)"
                  items={awards}
                  onChange={setAwards}
                  newItem={() => ({})}
                  addLabel="+ 수상 및 선정 내역 추가"
                  renderItem={(item, set) => (
                    <>
                      <input style={inputStyle} placeholder="연도 (예: 2026)" value={item.year || ""} onChange={(e) => set({ ...item, year: e.target.value })} />
                      <input style={inputStyle} placeholder="수상·선정명" value={item.title || ""} onChange={(e) => set({ ...item, title: e.target.value })} />
                      <input style={inputStyle} placeholder="주최 기관 (선택)" value={item.organization || ""} onChange={(e) => set({ ...item, organization: e.target.value })} />
                      <input style={inputStyle} placeholder="결과 (선택, 예: 대상)" value={item.result || ""} onChange={(e) => set({ ...item, result: e.target.value })} />
                    </>
                  )}
                />
                <ArrayField<ArtistAward>
                  label="콩쿠르 및 진출 (Competitions)"
                  items={competitions}
                  onChange={setCompetitions}
                  newItem={() => ({})}
                  addLabel="+ 콩쿠르 및 진출 내역 추가"
                  renderItem={(item, set) => (
                    <>
                      <input style={inputStyle} placeholder="연도 (예: 2025)" value={item.year || ""} onChange={(e) => set({ ...item, year: e.target.value })} />
                      <input style={inputStyle} placeholder="콩쿠르명" value={item.title || ""} onChange={(e) => set({ ...item, title: e.target.value })} />
                      <input style={inputStyle} placeholder="주최 기관 (선택)" value={item.organization || ""} onChange={(e) => set({ ...item, organization: e.target.value })} />
                      <input style={inputStyle} placeholder="결과 (선택, 예: 본선 진출)" value={item.result || ""} onChange={(e) => set({ ...item, result: e.target.value })} />
                    </>
                  )}
                />
              </div>
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
      </>
      )}

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
              padding: "20px", background: "#FFFFFF", borderRadius: "14px",
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
                  current_activity: currentActivity,
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
                  if (merged.current_activity) setCurrentActivity(merged.current_activity);
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

      </div>

      {/* Company Claim Modal */}
      <CompanyClaimModal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        userName={artist.name}
      />

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
