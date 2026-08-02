"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { formatUnreadCount } from "@/lib/messages";
import { useOptionalPopokChatData } from "@/components/messages/PopokChatDataProvider";
import PopokCard from "@/components/PopokCard";
import ArtistStoryShareModal from "@/components/artist/ArtistStoryShareModal";
import AiProfileImporter from "@/components/profile/AiProfileImporter";
import AiProfileCompare from "@/components/profile/AiProfileCompare";
import { analytics } from "@/lib/analytics";
import { getArtistPath, getArtistPublicUrl } from "@/lib/publicProfileUrls";
import CompanyCmsEditor from "@/components/company/CompanyCmsEditor";
import CompanyClaimModal from "@/components/company/CompanyClaimModal";
import ReceivedPortfolioRequests from "@/components/portfolio-requests/ReceivedPortfolioRequests";
import SentPortfolioRequests from "@/components/portfolio-requests/SentPortfolioRequests";
import { SHOW_PREMIUM_UI } from "@/lib/featureFlags";
import QuickUploadPanel from "@/components/my-popok/QuickUploadPanel";
import WorkDetailModal from "@/components/works/WorkDetailModal";
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
import { normalizeWorkImages, normalizeWorks, cleanWorksForPayload } from "@/lib/works";
import type { Company } from "@/types";
import { useMobileBodyScrollLock } from "@/hooks/useMobileBodyScrollLock";
import ProfileEditorNav, { type ProfileEditorSection } from "@/components/profile/ProfileEditorNav";
import WorksCardEditor from "@/components/profile/WorksCardEditor";
import { ArrayField, StringArrayField } from "@/components/admin/ArrayField";
import { compressImageForUpload } from "@/lib/clientImageCompression";
import { getListImageUrl } from "@/lib/imageUrls";


type PendingWorkImage = {
  id: string;
  url: string;
  fileName?: string;
  selected: boolean;
  uploadedAt?: string;
};

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
  dashboard_image_order?: string[];
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
  review_links?: any[];
}


function normalizeInstagramForPayload(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const username = trimmed
    .replace(/^@/, "")
    .replace(/^(www\.)?instagram\.com\//i, "")
    .split(/[/?#]/)[0]
    .trim();
  return username ? `https://instagram.com/${username}` : null;
}
export default function MyPopokClient({
  initialArtist,
  profileType,
  initialOwnedCompanies = [],
  adminMode = false,
  saveEndpoint = "/api/artists/me",
  saveMethod = "POST",
  saveHeaders = {},
  ownerStatusLabel,
}: {
  initialArtist: Artist;
  profileType?: string | null;
  initialOwnedCompanies?: Company[];
  /**
   * True when this form is mounted from /admin/artists/[id]/edit instead of
   * /my-popok. Reuses this exact component (same fields, same save-payload
   * shape) rather than a separate admin form — only differences are: the
   * company-management / 받은·보낸 포퐄 context switcher (self-serve-account
   * concepts that don't apply to "an admin editing someone else's artist")
   * is hidden in favor of an admin notice banner, and saves go to
   * `saveEndpoint`/`saveMethod`/`saveHeaders` instead of the self-serve route.
   */
  adminMode?: boolean;
  /** Save request target — defaults to the self-serve POST /api/artists/me. */
  saveEndpoint?: string;
  saveMethod?: "POST" | "PATCH";
  /** Extra headers merged into the save request (e.g. the admin passcode). */
  saveHeaders?: Record<string, string>;
  /** Admin-mode-only: precomputed ownership status text, e.g. "연결된 사용자 있음" / "소유자 없는 프로필". */
  ownerStatusLabel?: string;
}) {
  const [artist, setArtist] = useState<Artist>(initialArtist);
  const [ownedCompanies, setOwnedCompanies] = useState<Company[]>(initialOwnedCompanies);
  const [selectedContext, setSelectedContext] = useState<string>("artist"); // "artist" | "received-requests" | "sent-requests" | company.id
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const chatData = useOptionalPopokChatData();
  const unreadChatCount = chatData?.unreadCount || 0;
  const [activeEditorSection, setActiveEditorSection] = useState<ProfileEditorSection>("basic");
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

  // V2 (feature/home-feed-v2): /my-popok?upload=1 — used by onboarding
  // completion and the logged-in "작업 올리기" CTA on Home — scrolls straight
  // to the Quick Upload panel instead of leaving the visitor at the top of
  // the whole dashboard. Same window.location read pattern as ?tab= above.
  const quickUploadRef = useRef<HTMLDivElement>(null);
  const workPreviewRef = useRef<HTMLDivElement>(null);
  const [pendingWorkImages, setPendingWorkImages] = useState<PendingWorkImage[]>([]);
  const [pendingWorkTitle, setPendingWorkTitle] = useState("");
  const [pendingWorkMode, setPendingWorkMode] = useState<"new" | "existing">("new");
  const [existingWorkId, setExistingWorkId] = useState("");
  const [groupedWorkDraft, setGroupedWorkDraft] = useState<Work | null>(null);
  const [previewWork, setPreviewWork] = useState<Work | null>(null);
  const [draggedDashboardImageIndex, setDraggedDashboardImageIndex] = useState<number | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("upload") === "1") {
      window.requestAnimationFrame(() => quickUploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, []);

  const scrollToWorkPreview = () => {
    window.requestAnimationFrame(() => workPreviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  // WORK 미리보기 — opens the same WorkDetailModal the public artist page
  // uses, for whichever work in `works` the user clicked.
  const openWorkPreviewDetail = (workId: string) => {
    const work = works.find((w) => w.id === workId);
    if (work) setPreviewWork(work);
  };

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
  const [reviewLinks, setReviewLinks] = useState<any[]>(Array.isArray(artist.review_links) ? artist.review_links : []);

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
  useMobileBodyScrollLock(shareModalOpen || aiModalOpen || claimModalOpen);

  // ESC closes the AI import/resume modal — it already has an explicit X
  // button; this just adds the keyboard equivalent.
  useEffect(() => {
    if (!aiModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAiModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aiModalOpen]);

  const [slugStatus, setSlugStatus] = useState<{
    valid: boolean;
    checking: boolean;
    message: string;
  }>({ valid: true, checking: false, message: "" });

  const publicProfileKey = slug || artist.slug || artist.id;
  const artistPath = getArtistPath(publicProfileKey);
  const publicUrl = getArtistPublicUrl(publicProfileKey);

  // Dynamic Status Badge mapping
  const statusConfig = useMemo(() => {
    if (artist.verified) {
      return { label: "🔵 POPOK Artist 관리중", color: "#EFF6FF", textColor: "#1D4ED8", borderColor: "#BFDBFE" };
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
      formData.append("file", await compressImageForUpload(file));
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

  const handleCompanyLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, companyId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadImageFile(file, `company_logo_${companyId}`);
    if (url) {
      try {
        const res = await fetch(`/api/companies/${companyId}/update`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile_image_url: url }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setOwnedCompanies((prev) =>
            prev.map((c) => (c.id === companyId ? { ...c, profile_image_url: url } : c))
          );
          alert("단체 로고가 성공적으로 업데이트되었습니다.");
        } else {
          alert(data.error || "단체 로고 저장에 실패했습니다.");
        }
      } catch {
        alert("서버 통신 중 오류가 발생했습니다.");
      }
    }
  };

  // Work Image Upload handler (multiple selection, up to 8 images per work)
  const handleWorkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, workIdx: number, imgIdx?: number) => {
    const input = e.currentTarget;
    const selectedFiles = Array.from(input.files || []);
    if (selectedFiles.length === 0) return;

    const currentImages = normalizeWorkImages(works[workIdx]);
    const isReplacing = imgIdx !== undefined && imgIdx < currentImages.length;
    const availableSlots = Math.max(0, 4 - currentImages.length + (isReplacing ? 1 : 0));
    const files = selectedFiles.slice(0, availableSlots);
    if (selectedFiles.length > files.length) alert(`한 작품에는 사진을 최대 4장까지 올릴 수 있어요. 선택한 사진 중 ${files.length}장만 추가합니다.`);

    const uploadedUrls: string[] = [];
    for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
      const slotIndex = isReplacing && fileIndex === 0 ? imgIdx! : currentImages.length + uploadedUrls.length;
      const url = await uploadImageFile(files[fileIndex], `work_${workIdx}_${slotIndex}`);
      if (url) uploadedUrls.push(url);
    }

    if (uploadedUrls.length > 0) {
      setWorks((current) => {
        const updatedWorks = [...current];
        const targetWork = { ...updatedWorks[workIdx] };
        const nextImages = normalizeWorkImages(targetWork);
        if (isReplacing && imgIdx !== undefined) nextImages[imgIdx] = uploadedUrls.shift()!;
        nextImages.push(...uploadedUrls);
        targetWork.images = currentImages.length > 4 ? nextImages : nextImages.slice(0, 4);
        targetWork.image_url = targetWork.images[0] || "";
        updatedWorks[workIdx] = targetWork;
        return updatedWorks;
      });
    }
    input.value = "";
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
  const handleAddWork = (): string => {
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
    setWorks(current => [...current, newWork]);
    return newWork.id;
  };

  // Uploaded files stay in a temporary client-side inbox. They do not become
  // works until the artist explicitly groups and reviews them. Storage uploads
  // survive the form interaction, while no placeholder work rows are written.
  const handleQuickUploadedFile = (url: string, file: File) => {
    setPendingWorkImages((prev) => [...prev, {
      id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url,
      fileName: file.name,
      selected: true,
      uploadedAt: new Date().toISOString(),
    }]);
  };

  const togglePendingWorkImage = (id: string) => {
    setPendingWorkImages((prev) => {
      const target = prev.find((image) => image.id === id);
      if (!target) return prev;
      const selectedCount = prev.filter((image) => image.selected).length;
      if (!target.selected && selectedCount >= 4) {
        alert("한 작품에는 사진을 최대 4장까지 묶을 수 있어요.");
        return prev;
      }
      return prev.map((image) => image.id === id ? { ...image, selected: !image.selected } : image);
    });
  };

  const prepareGroupedWork = () => {
    const selected = pendingWorkImages.filter((image) => image.selected).slice(0, 4);
    if (selected.length === 0) {
      alert("같은 작품으로 묶을 사진을 선택해 주세요.");
      return;
    }
    if (!pendingWorkTitle.trim()) {
      alert("작품명을 입력해 주세요.");
      return;
    }
    setGroupedWorkDraft({
      id: `new-work-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: pendingWorkTitle.trim(),
      year: new Date().getFullYear(),
      role: "",
      description: "",
      image_url: selected[0].url,
      images: selected.map((image) => image.url),
      video_url: "",
    });
  };

  const finalizeGroupedWork = () => {
    if (!groupedWorkDraft) return;
    const selectedIds = new Set(pendingWorkImages.filter((image) => image.selected).map((image) => image.id));
    setWorks((current) => [...current, groupedWorkDraft]);
    setPendingWorkImages((prev) => prev.filter((image) => !selectedIds.has(image.id)));
    setPendingWorkTitle("");
    setGroupedWorkDraft(null);
    analytics.workCreated(1);
  };

  const addPendingImagesToExistingWork = () => {
    const workIndex = works.findIndex((work) => work.id === existingWorkId);
    if (workIndex < 0) {
      alert("사진을 추가할 기존 작품을 선택해 주세요.");
      return;
    }
    const currentImages = normalizeWorkImages(works[workIndex]);
    const capacity = 4 - currentImages.length;
    if (capacity <= 0) {
      alert("선택한 작품에는 이미 사진이 4장 등록되어 있어요.");
      return;
    }
    const selected = pendingWorkImages.filter((image) => image.selected);
    if (selected.length === 0) {
      alert("기존 작품에 추가할 사진을 선택해 주세요.");
      return;
    }
    const imagesToAdd = selected.slice(0, capacity);
    const addedIds = new Set(imagesToAdd.map((image) => image.id));
    setWorks((current) => current.map((work, index) => {
      if (index !== workIndex) return work;
      const images = [...normalizeWorkImages(work), ...imagesToAdd.map((image) => image.url)].slice(0, 4);
      return { ...work, images, image_url: images[0] || "" };
    }));
    setPendingWorkImages((current) => current.filter((image) => !addedIds.has(image.id)));
    if (selected.length > imagesToAdd.length) alert(`남은 공간만큼 ${imagesToAdd.length}장만 추가했어요. 나머지 사진은 임시 보관함에 남겨두었습니다.`);
    setExistingWorkId("");
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

  // Reorders the existing works array only; the DB/API shape remains unchanged.
  const handleReorderWorks = (fromIndex: number, toIndex: number) => {
    setWorks(current => {
      const reordered = [...current];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      return reordered;
    });
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

      const res = await fetch(saveEndpoint, {
        method: saveMethod,
        headers: { "Content-Type": "application/json", ...saveHeaders },
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
          instagram: normalizeInstagramForPayload(instagram),
          website: website.trim() || null,
          works: cleanedWorks,
          affiliations: cleanArtistAffiliationsForPayload(affiliations),
          current_activity: cleanArtistCurrentActivityForPayload(currentActivity),
          education: cleanArtistEducationForPayload(education),
          awards: cleanArtistAwardsForPayload(awards),
          competitions: cleanArtistCompetitionsForPayload(competitions),
          links,
          review_links: reviewLinks
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
        // V2 (feature/home-feed-v2): "잘 올라갔는지" 바로 확인할 수 있도록
        // 저장 완료 후 WORK 미리보기로 자동 스크롤 (기존엔 맨 위로 스크롤).
        window.requestAnimationFrame(() => workPreviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
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

  // WORK 미리보기 — same shape ArtistWorkGallery expects on the public
  // artist page (components/artists/ArtistWorkGallery.tsx), built from this
  // dashboard's own `works` state so it's always in sync with what's about
  // to be saved.
  const dashboardWorkImages = useMemo(() => {
    const images = works.flatMap((work, workIndex) => normalizeWorkImages(work).map((url, imageIndex) => ({
      id: `${work.id}-${imageIndex}`, url, workId: work.id, workIndex, imageIndex,
      title: work.title?.trim() || "제목 없는 작업",
    })));
    const savedOrder: string[] = works[0]?.dashboard_image_order || [];
    const rank = new Map<string, number>(savedOrder.map((url: string, index: number) => [url, index]));
    return [...images].sort((a, b) => (rank.get(a.url) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.url) ?? Number.MAX_SAFE_INTEGER));
  }, [works]);

  const handleMoveDashboardImage = (fromFlatIndex: number, toFlatIndex: number) => {
    if (toFlatIndex < 0 || toFlatIndex >= dashboardWorkImages.length || works.length === 0) return;
    const orderedUrls = dashboardWorkImages.map((image) => image.url);
    const [moved] = orderedUrls.splice(fromFlatIndex, 1);
    orderedUrls.splice(toFlatIndex, 0, moved);
    setWorks((current) => current.map((work, index) => index === 0 ? { ...work, dashboard_image_order: orderedUrls } : work));
  };

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh", padding: "40px 16px 120px" }}>
      <div className="my-popok-container" style={{ maxWidth: "1080px", margin: "0 auto" }}>
        
        {/* ADMIN OVERRIDE NOTICE — replaces the self-serve account switcher
            below (company management / 받은·보낸 포퐄 don't apply when an
            admin is editing someone else's artist profile). */}
        {adminMode && (
          <div
            style={{
              marginBottom: "24px",
              background: "#FFFBEB",
              borderRadius: "16px",
              border: "1.5px solid #FCD34D",
              padding: "14px 24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "1.1rem" }} aria-hidden="true">🛠️</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#92400E" }}>
              관리자 권한으로 아티스트 프로필을 편집하고 있습니다.
            </span>
            {ownerStatusLabel && (
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: "#92400E",
                  background: "rgba(255,255,255,0.6)",
                  border: "1px solid #FCD34D",
                  borderRadius: "10px",
                  padding: "3px 10px",
                }}
              >
                {ownerStatusLabel}
              </span>
            )}
          </div>
        )}

        {/* ACCOUNT / ORGANIZATION CONTEXT SWITCHER BAR */}
        {!adminMode && (
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
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", flex: 1, minWidth: 0 }}>
            <span className="mono" style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--ink-muted)", textTransform: "uppercase" }}>
              내 프로필 / 단체 관리:
            </span>

            {/* Profile and POPOK navigation */}
            <div className="my-popok-management-tabs" role="navigation" aria-label="내 프로필과 포퐄 관리">
              <button type="button" onClick={() => setSelectedContext("artist")} aria-current={selectedContext === "artist" ? "page" : undefined} className="my-popok-management-pill" style={{ border: selectedContext === "artist" ? "1.5px solid var(--navy)" : "1px solid var(--border)", backgroundColor: selectedContext === "artist" ? "var(--navy)" : "#FFFFFF", color: selectedContext === "artist" ? "#FFFFFF" : "var(--navy)" }}>
                <span>내 프로필</span><span style={{ opacity: 0.75, fontSize: "0.75rem" }}>({artist.name})</span>
              </button>
              <Link href="/my-popok/messages" className="my-popok-management-pill my-popok-chat-pill" style={{ border: "1px solid var(--accent)", background: "var(--accent)", color: "var(--navy)" }}>
                포퐄챗
                {unreadChatCount > 0 && <span className="popok-chat-tab-badge" aria-label={`읽지 않은 포퐄챗 ${unreadChatCount}개`}>{formatUnreadCount(unreadChatCount)}</span>}
              </Link>
              <button type="button" onClick={() => setSelectedContext("received-requests")} aria-current={selectedContext === "received-requests" ? "page" : undefined} className="my-popok-management-pill" style={{ border: selectedContext === "received-requests" ? "1.5px solid var(--navy)" : "1px solid var(--border)", backgroundColor: selectedContext === "received-requests" ? "var(--navy)" : "#FFFFFF", color: selectedContext === "received-requests" ? "#FFFFFF" : "var(--navy)" }}>받은 포퐄</button>
              <button type="button" onClick={() => setSelectedContext("sent-requests")} aria-current={selectedContext === "sent-requests" ? "page" : undefined} className="my-popok-management-pill" style={{ border: selectedContext === "sent-requests" ? "1.5px solid var(--navy)" : "1px solid var(--border)", backgroundColor: selectedContext === "sent-requests" ? "var(--navy)" : "#FFFFFF", color: selectedContext === "sent-requests" ? "#FFFFFF" : "var(--navy)" }}>보낸 포퐄</button>
              {ownedCompanies.length > 0 && <span className="my-popok-management-separator" aria-hidden="true">|</span>}
              {ownedCompanies.map((comp) => (
                <button key={comp.id} type="button" onClick={() => setSelectedContext(comp.id)} aria-current={selectedContext === comp.id ? "page" : undefined} className="my-popok-management-pill" style={{ border: selectedContext === comp.id ? "1.5px solid var(--navy)" : "1px solid var(--border)", backgroundColor: selectedContext === comp.id ? "var(--navy)" : "#FFFFFF", color: selectedContext === comp.id ? "#FFFFFF" : "var(--navy)" }}>
                  <span>{comp.name}</span><span style={{ fontSize: "0.62rem", background: selectedContext === comp.id ? "rgba(255,255,255,0.2)" : "#FAF9F5", padding: "2px 6px", borderRadius: "10px" }}>단체</span>
                </button>
              ))}
            </div>
            <style>{`
              .my-popok-management-tabs { min-width: 0; max-width: 100%; display: flex; align-items: center; gap: 8px; overflow-x: auto; overscroll-behavior-inline: contain; scrollbar-width: thin; padding: 2px 2px 6px; }
              .my-popok-management-pill { min-height: 44px; padding: 8px 16px; border-radius: 999px; font-size: .82rem; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 7px; flex-shrink: 0; cursor: pointer; text-decoration: none; transition: background-color .15s ease, color .15s ease, border-color .15s ease; }
              .my-popok-management-pill:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
              .my-popok-management-separator { color: var(--border-dark); flex-shrink: 0; margin: 0 4px; }
              .my-popok-chat-pill .popok-chat-tab-badge { background: var(--navy); color: #fff; }
              .popok-chat-tab-badge { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; display: inline-grid; place-items: center; background: var(--accent); color: var(--navy); font-size: .68rem; font-weight: 950; line-height: 1; }
              @media (max-width: 767px) { .my-popok-management-tabs { width: 100%; margin-inline: -2px; padding-inline: 2px; } .my-popok-management-tabs::-webkit-scrollbar { height: 3px; } .my-popok-management-tabs::-webkit-scrollbar-thumb { background: var(--border-dark); border-radius: 999px; } }
            `}</style>
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
        )}

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
          border: "1.5px solid var(--border)",
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
                  ? "※ 이름, 프로필 사진, 소개, 영상, 대표작품, SNS를 모두 등록하면 100%가 완성됩니다."
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
                <Link href={artistPath} target="_blank" style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--navy)", textDecoration: "underline", wordBreak: "break-all" }}>
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
                  href={artistPath}
                  target="_blank"
                  style={{ ...smallButtonStyle, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                >
                  새창보기 ↗
                </Link>
              </div>
            </div>
          </div>

          {/* Right panel: Quick actions */}
          <aside style={{
            background: "var(--bg-warm)",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            alignSelf: "stretch",
            justifyContent: "center"
          }}>
            <h2 style={{ fontSize: "0.92rem", fontWeight: 950, color: "var(--navy)", margin: "0 0 4px" }}>
              퀵 메뉴 (Quick Actions)
            </h2>
            <button type="button" onClick={() => setAiModalOpen(true)} style={{ ...quickActionButtonStyle, background: "var(--navy)", color: "var(--accent)", borderColor: "var(--navy)" }}>
              ✨ AI로 프로필 업데이트
            </button>
            <button type="button" onClick={() => setShareModalOpen(true)} style={quickActionButtonStyle}>
              📤 명함 공유 / 다운로드
            </button>
            <button type="button" onClick={handleSave} disabled={saving} style={{ ...quickActionButtonStyle, background: "var(--accent)", borderColor: "var(--accent)", cursor: saving ? "wait" : "pointer" }}>
              {saving ? "저장 중..." : "💾 변경사항 저장하기"}
            </button>
          </aside>
        </section>

        {/* ──────────────── QUICK UPLOAD — V2 ──────────────── */}
        <section ref={quickUploadRef} style={{
          background: "#FFFFFF", border: "1.5px solid var(--border)", borderRadius: "24px",
          padding: "32px", boxShadow: "0 12px 36px rgba(23, 20, 17, 0.04)", marginBottom: "32px",
        }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 950, color: "var(--navy)", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            새 작업을 올려볼까요?
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", margin: "0 0 24px" }}>
            작품 사진을 올리고 새 작품으로 묶거나 기존 작품에 추가할 수 있어요.
          </p>

          <div>
            <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 900, color: "var(--navy)", marginBottom: "12px" }}>
              📸 사진 여러 장 업로드
            </span>
            <div
              style={{
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: "0 8px 24px rgba(23, 20, 17, 0.03)",
                borderRadius: "16px",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 16px 36px rgba(23, 20, 17, 0.08)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(23, 20, 17, 0.03)";
              }}
            >
              <QuickUploadPanel
                uploadFile={(file) => uploadImageFile(file, `quick_${Date.now()}`)}
                onUploaded={handleQuickUploadedFile}
                disabled={pendingWorkImages.length >= 24}
              />
            </div>
          </div>

          {pendingWorkImages.length > 0 && (
            <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "end", flexWrap: "wrap" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "0.9rem", color: "var(--navy)" }}>임시 사진 보관함</strong>
                  <span style={{ fontSize: "0.76rem", color: "var(--ink-muted)" }}>같은 작품의 사진을 최대 4장까지 선택하세요. 아직 작품은 생성되지 않았습니다.</span>
                </div>
                <span style={{ fontSize: "0.76rem", fontWeight: 850, color: "var(--accent-dark)" }}>{pendingWorkImages.filter((image) => image.selected).length}장 선택</span>
              </div>

              <div className="pending-work-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))", gap: "10px" }}>
                {pendingWorkImages.map((image) => (
                  <div key={image.id} style={{ position: "relative" }}>
                    <button type="button" onClick={() => togglePendingWorkImage(image.id)} aria-pressed={image.selected} style={{ width: "100%", aspectRatio: "1", display: "block", padding: 0, overflow: "hidden", borderRadius: "12px", border: image.selected ? "3px solid var(--accent-dark)" : "1px solid var(--border)", background: "#EAE6DD", cursor: "pointer" }}>
                      <img src={getListImageUrl(image.url, 600)} alt={image.fileName || "업로드한 작품 사진"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <span style={{ position: "absolute", top: "7px", left: "7px", width: "24px", height: "24px", display: "grid", placeItems: "center", borderRadius: "50%", background: image.selected ? "var(--accent)" : "rgba(23,20,17,.62)", color: image.selected ? "var(--navy)" : "#fff", fontSize: "0.72rem", fontWeight: 950 }}>{image.selected ? "✓" : ""}</span>
                    </button>
                    <button type="button" onClick={() => setPendingWorkImages((prev) => prev.filter((item) => item.id !== image.id))} aria-label="임시 사진 제거" style={{ position: "absolute", top: "7px", right: "7px", width: "24px", height: "24px", border: 0, borderRadius: "50%", background: "rgba(23,20,17,.7)", color: "#fff", cursor: "pointer" }}>×</button>
                    <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "5px", fontSize: "0.66rem", color: "var(--ink-muted)" }}>{image.fileName || "사진"}</span>
                  </div>
                ))}
              </div>

              {!groupedWorkDraft ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {works.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "4px", borderRadius: "12px", background: "#F1EEE7" }}>
                      <button type="button" onClick={() => setPendingWorkMode("new")} style={{ padding: "11px 10px", border: pendingWorkMode === "new" ? "1.5px solid var(--navy)" : "1px solid transparent", borderRadius: "9px", background: pendingWorkMode === "new" ? "#fff" : "transparent", color: "var(--navy)", fontWeight: 900, cursor: "pointer" }}>새 작품으로 묶기</button>
                      <button type="button" onClick={() => setPendingWorkMode("existing")} style={{ padding: "11px 10px", border: pendingWorkMode === "existing" ? "1.5px solid var(--navy)" : "1px solid transparent", borderRadius: "9px", background: pendingWorkMode === "existing" ? "#fff" : "transparent", color: "var(--navy)", fontWeight: 900, cursor: "pointer" }}>기존 작품에 추가</button>
                    </div>
                  )}
                  {pendingWorkMode === "existing" && works.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "10px" }} className="group-work-controls">
                      <select value={existingWorkId} onChange={(event) => setExistingWorkId(event.target.value)} style={{ ...inputStyle, minWidth: 0 }}>
                        <option value="">사진을 추가할 작품 선택</option>
                        {works.map((work) => {
                          const imageCount = normalizeWorkImages(work).length;
                          return <option key={work.id} value={work.id} disabled={imageCount >= 4}>{work.title || "제목 없는 작품"} ({imageCount}/4장)</option>;
                        })}
                      </select>
                      <button type="button" onClick={addPendingImagesToExistingWork} className="btn-lime" style={{ padding: "12px 20px", border: 0, borderRadius: "10px", fontWeight: 900, cursor: "pointer" }}>선택한 작품에 추가</button>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "10px" }} className="group-work-controls">
                      <input type="text" value={pendingWorkTitle} onChange={(event) => setPendingWorkTitle(event.target.value)} placeholder="작품명 (예: Re:Choreograph 다시 쓰는 몸)" style={{ ...inputStyle, minWidth: 0 }} />
                      <button type="button" onClick={prepareGroupedWork} className="btn-lime" style={{ padding: "12px 20px", border: 0, borderRadius: "10px", fontWeight: 900, cursor: "pointer" }}>하나의 작품으로 묶기</button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: "20px", border: "1px solid var(--border)", borderRadius: "14px", background: "#FAF9F5", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div><strong style={{ color: "var(--navy)" }}>작품 초안 검토</strong><p style={{ margin: "4px 0 0", color: "var(--ink-muted)", fontSize: "0.75rem" }}>{normalizeWorkImages(groupedWorkDraft).length}장의 사진이 하나의 작품에 포함됩니다.</p></div>
                  <div className="group-work-fields" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <input style={inputStyle} value={groupedWorkDraft.title} onChange={(event) => setGroupedWorkDraft({ ...groupedWorkDraft, title: event.target.value })} placeholder="작품명" />
                    <input style={inputStyle} value={groupedWorkDraft.year || ""} onChange={(event) => setGroupedWorkDraft({ ...groupedWorkDraft, year: event.target.value })} placeholder="연도" />
                    <input style={inputStyle} value={groupedWorkDraft.role || ""} onChange={(event) => setGroupedWorkDraft({ ...groupedWorkDraft, role: event.target.value })} placeholder="역할" />
                    <textarea style={{ ...inputStyle, minHeight: "90px", resize: "vertical", gridColumn: "1 / -1" }} value={groupedWorkDraft.description || ""} onChange={(event) => setGroupedWorkDraft({ ...groupedWorkDraft, description: event.target.value })} placeholder="작품 설명" />
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button type="button" onClick={finalizeGroupedWork} className="btn-lime" style={{ padding: "11px 18px", border: 0, borderRadius: "999px", fontWeight: 900, cursor: "pointer" }}>작품 목록에 추가</button>
                    <button type="button" onClick={() => setGroupedWorkDraft(null)} style={{ padding: "11px 18px", border: "1px solid var(--border-dark)", borderRadius: "999px", background: "#fff", fontWeight: 800, cursor: "pointer" }}>다시 선택</button>
                  </div>
                  <p style={{ margin: 0, color: "var(--ink-muted)", fontSize: "0.72rem" }}>추가 후 상단의 ‘변경사항 저장하기’를 누르면 공개 프로필에 반영됩니다.</p>
                </div>
              )}
            </div>
          )}
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

        {/* ──────────────── WORK 미리보기 — V2 (feature/home-feed-v2):
            "방금 업로드한 사진이 공개 페이지에서 어떻게 보이는지" 바로 확인하는
            용도. 실제 공개 아티스트 페이지와 동일한 컴포넌트(ArtistWorkGallery +
            WorkDetailModal)를 그대로 재사용 — 새 카드 스타일을 따로 만들지
            않는다. 저장 성공 시 이 섹션으로 자동 스크롤된다(handleSave 참고).
            프로필 다듬기(About/Career/Awards/Education/Current Activity/Links)는
            운영팀 CMS가 담당하므로 이 대시보드에서는 제거했다. ──────────────── */}
        <section ref={workPreviewRef} style={{ marginBottom: "24px" }}>
          <div style={{ marginBottom: "12px" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--navy)", margin: "0 0 4px" }}>
              업로드한 사진
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", margin: 0 }}>
              사진을 드래그해 순서를 바꿀 수 있어요. 작품별 정보는 아래 WORKS에서 관리하세요.
            </p>
          </div>

          {dashboardWorkImages.length === 0 ? (
            <div style={{ padding: "50px 24px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "12px", color: "var(--ink-muted)", fontSize: "0.85rem" }}>
              아직 올린 사진이 없어요. 위에서 사진을 올려보세요.
            </div>
          ) : (
            <div className="dashboard-photo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
              {dashboardWorkImages.map((image, flatIndex) => (
                <div
                  key={image.id}
                  data-dashboard-image-index={flatIndex}
                  draggable
                  onDragStart={(event) => {
                    setDraggedDashboardImageIndex(flatIndex);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", String(flatIndex));
                  }}
                  onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const fromIndex = Number(event.dataTransfer.getData("text/plain"));
                    if (Number.isInteger(fromIndex) && fromIndex !== flatIndex) handleMoveDashboardImage(fromIndex, flatIndex);
                    setDraggedDashboardImageIndex(null);
                  }}
                  onDragEnd={() => setDraggedDashboardImageIndex(null)}
                  onPointerDown={(event) => {
                    if (event.pointerType === "touch") {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setDraggedDashboardImageIndex(flatIndex);
                    }
                  }}
                  onPointerMove={(event) => {
                    if (event.pointerType !== "touch" || draggedDashboardImageIndex === null) return;
                    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-dashboard-image-index]");
                    const targetIndex = Number(target?.dataset.dashboardImageIndex);
                    if (Number.isInteger(targetIndex) && targetIndex !== draggedDashboardImageIndex) {
                      handleMoveDashboardImage(draggedDashboardImageIndex, targetIndex);
                      setDraggedDashboardImageIndex(targetIndex);
                    }
                  }}
                  onPointerUp={() => setDraggedDashboardImageIndex(null)}
                  onPointerCancel={() => setDraggedDashboardImageIndex(null)}
                  style={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden", borderRadius: "12px", background: "#EEEAE2", cursor: "grab", touchAction: "pan-y", opacity: draggedDashboardImageIndex === flatIndex ? .62 : 1, transform: draggedDashboardImageIndex === flatIndex ? "scale(.97)" : "none", transition: "transform .15s ease, opacity .15s ease" }}
                >
                  <img src={getListImageUrl(image.url, 600)} alt={image.title} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", userSelect: "none" }} />
                  <span style={{ position: "absolute", top: "8px", left: "8px", padding: "4px 7px", borderRadius: "999px", background: "rgba(23,20,17,.72)", color: "#fff", fontSize: ".65rem", fontWeight: 900, pointerEvents: "none" }}>{flatIndex + 1}</span>
                  <span aria-hidden="true" style={{ position: "absolute", right: "8px", bottom: "8px", padding: "5px 8px", borderRadius: "999px", background: "rgba(23,20,17,.72)", color: "#fff", fontSize: ".7rem", fontWeight: 900, pointerEvents: "none" }}>⋮⋮</span>
                </div>
              ))}           </div>
          )}

          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <Link
              href={artistPath}
              target="_blank"
              className="btn-lime"
              style={{
                textDecoration: "none", display: "inline-block", padding: "13px 28px",
                borderRadius: "999px", fontSize: "0.88rem", fontWeight: 800,
              }}
            >
              공개 페이지 보기
            </Link>
          </div>
        </section>

        {/* ──────────────── AI Resume Upload & Manual Edit Notice ──────────────── */}
        <section style={{
          background: "#FFFFFF",
          border: "1.5px dashed var(--accent-dark)",
          borderRadius: "24px",
          padding: "32px",
          marginTop: "32px",
          marginBottom: "24px",
          boxShadow: "0 12px 36px rgba(23, 20, 17, 0.04)",
          textAlign: "center"
        }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 950, color: "var(--navy)", margin: "0 0 8px" }}>
            📄 이력서 파일로 프로필 정보 한 번에 채우기
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", margin: "0 0 20px" }}>
            학력, 경력, 수상, 작품 이력이 적힌 PDF·DOCX 파일을 올리면 AI가 아래 모든 상세 항목들을 자동으로 입력해드려요.
          </p>
          <button
            type="button"
            onClick={() => {
              setAiState("import");
              setAiModalOpen(true);
            }}
            className="btn-outline"
            style={{
              padding: "12px 28px", borderRadius: "10px", fontWeight: 850, fontSize: "0.88rem",
              border: "1.5px solid var(--navy)", cursor: "pointer", transition: "all 0.15s ease"
            }}
          >
            ✨ AI 이력서 분석 및 자동 채우기
          </button>
        </section>

        {/* 💡 Manual Edit Notice */}
        <div style={{
          background: "var(--bg-warm)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "16px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "0.82rem",
          fontWeight: 800,
          color: "var(--navy)",
          lineHeight: 1.5
        }}>
          <span>💡</span>
          <span>
            아래 각 탭(기본 정보, 소개·미디어, 작품·프로젝트 등)을 클릭하여 상세 정보를 직접 수동으로 입력하거나 수정하실 수 있습니다.<br />수정이 끝난 후에는 맨 아래의 <strong>[변경사항 저장하기]</strong> 버튼을 눌러주세요.
          </span>
        </div>

        {/* ──────────────── 상세 정보 항목별 수정 (기존 플로우 복원) ──────────────── */}
        <div style={{ marginTop: "32px", borderTop: "1px solid var(--border)", paddingTop: "32px" }}>
          <ProfileEditorNav active={activeEditorSection} onChange={setActiveEditorSection} />

          <div style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: "32px",
            alignItems: "start",
            marginTop: "24px"
          }} className="editor-grid">
            
            {/* Main Edit Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              
              {/* Card 1: 기본 정보 & 프로필 이미지 */}
              <div hidden={activeEditorSection !== "basic"} className="editor-card" style={{ background: "#FFFFFF", padding: "32px", borderRadius: "18px", border: "1px solid var(--border)" }}>
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
                          <img src={getListImageUrl(profileImageUrl, 300)} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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

                </div>
              </div>

              {/* Card 2: 프로필 미디어 및 소개 */}
              <div hidden={activeEditorSection !== "intro"} className="editor-card" style={{ background: "#FFFFFF", padding: "32px", borderRadius: "18px", border: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--navy)", marginBottom: "20px", borderBottom: "1.5px solid var(--border)", paddingBottom: "10px" }}>
                  2. 프로필 소개 및 비디오 URL
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

                  <label style={labelStyle}>
                    Instagram 사용자명 또는 링크
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@username 또는 https://instagram.com/username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      inputMode="url"
                      style={inputStyle}
                    />
                    <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", fontWeight: 650 }}>
                      사용자명만 입력해도 저장할 때 Instagram 링크로 자동 변환됩니다.
                    </span>
                  </label>                </div>
              </div>

              <div hidden={activeEditorSection !== "works"}>
                {/* Card 3: 작품 목록 관리 (jsonb) */}
                <WorksCardEditor
                  works={works}
                  canAdd
                  countLabel={`${works.length}개`}
                  uploadingSlot={uploadingSlot}
                  onAdd={handleAddWork}
                  onRemove={handleRemoveWork}
                  onChange={handleWorkInputChange}
                  onImageUpload={handleWorkImageUpload}
                  onImageRemove={handleRemoveWorkImage}
                  onReorder={handleReorderWorks}
                />

                {/* Premium 안내 카드 */}
                <div style={{ padding: "20px", background: "var(--navy)", borderRadius: "14px", color: "#FFFFFF", textAlign: "center" }}>
                  <strong>✨ POPOK Artist (Coming Soon)</strong>
                  <p style={{ fontSize: "0.82rem", color: "#CBD5E1", margin: "8px 0 14px", lineHeight: 1.6 }}>
                    현재는 오픈 기념으로 모든 기능을 무료로 이용하실 수 있습니다.<br />
                    앞으로 AI 활동 관리, 자동 포트폴리오 업데이트, 공연 홍보 등 다양한 POPOK Artist 기능이 추가될 예정입니다.<br />
                    감사합니다 💚
                  </p>
                  <button
                    type="button"
                    disabled
                    style={{
                      display: "inline-block",
                      padding: "9px 18px",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      fontWeight: 900,
                      background: "rgba(255,255,255,0.15)",
                      color: "rgba(255,255,255,0.65)",
                      border: "none",
                      cursor: "not-allowed",
                    }}
                  >
                    현재 모든 기능 무료 이용 중
                  </button>
                </div>
              </div>

              {/* Card 4: 활동 타임라인 (current_activity + affiliations) */}
              <div hidden={activeEditorSection !== "activity"} className="editor-card" style={{ background: "#FFFFFF", padding: "32px", borderRadius: "18px", border: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 950, color: "var(--navy)", marginBottom: "20px", borderBottom: "1.5px solid var(--border)", paddingBottom: "10px" }}>
                  4. 활동 타임라인
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <StringArrayField
                    label="현재 활동 (CURRENT)"
                    variant="dashboard"
                    items={currentActivity}
                    onChange={setCurrentActivity}
                    placeholder="예: OO컴퍼니 출강 중"
                  />
                  <ArrayField<ArtistAffiliation>
                    label="소속 / 활동 이력 (AFFILIATION)"
                    variant="dashboard"
                    items={affiliations}
                    onChange={setAffiliations}
                    newItem={() => ({})}
                    addLabel="+ 소속·활동 이력 추가"
                    renderItem={(item, set) => (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                        <input style={inputStyle} placeholder="소속/프로젝트명" value={item.name || ""} onChange={(e) => set({ ...item, name: e.target.value })} />
                        <input style={inputStyle} placeholder="역할/직책 (선택)" value={item.position || ""} onChange={(e) => set({ ...item, position: e.target.value })} />
                        <input style={inputStyle} placeholder="연도 (선택)" value={item.year || ""} onChange={(e) => set({ ...item, year: e.target.value })} />
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Card 5: 학력 */}
              <div hidden={activeEditorSection !== "education"} className="editor-card" style={{ background: "#FFFFFF", padding: "32px", borderRadius: "18px", border: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 950, color: "var(--navy)", marginBottom: "20px", borderBottom: "1.5px solid var(--border)", paddingBottom: "10px" }}>
                  5. 학력
                </h2>
                <StringArrayField
                  label="학력 (Education)"
                  variant="dashboard"
                  items={education}
                  onChange={setEducation}
                  placeholder="예: 한국예술종합학교 무용이론과 졸업"
                />
              </div>

              {/* Card 6: 수상 및 선정 / 콩쿠르 및 진출 */}
              <div hidden={activeEditorSection !== "awards"} className="editor-card" style={{ background: "#FFFFFF", padding: "32px", borderRadius: "18px", border: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 950, color: "var(--navy)", marginBottom: "20px", borderBottom: "1.5px solid var(--border)", paddingBottom: "10px" }}>
                  6. 수상 및 선정
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <ArrayField<ArtistAward>
                    label="수상 및 선정 내역 (Awards)"
                    variant="dashboard"
                    items={awards}
                    onChange={setAwards}
                    newItem={() => ({})}
                    addLabel="+ 수상 및 선정 내역 추가"
                    renderItem={(item, set) => (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                        <input style={inputStyle} placeholder="연도 (예: 2026)" value={item.year || ""} onChange={(e) => set({ ...item, year: e.target.value })} />
                        <input style={inputStyle} placeholder="수상·선정명" value={item.title || ""} onChange={(e) => set({ ...item, title: e.target.value })} />
                        <input style={inputStyle} placeholder="주최 기관 (선택)" value={item.organization || ""} onChange={(e) => set({ ...item, organization: e.target.value })} />
                        <input style={inputStyle} placeholder="결과 (선택, 예: 대상)" value={item.result || ""} onChange={(e) => set({ ...item, result: e.target.value })} />
                      </div>
                    )}
                  />
                  <ArrayField<ArtistAward>
                    label="콩쿠르 및 진출 (Competitions)"
                    variant="dashboard"
                    items={competitions}
                    onChange={setCompetitions}
                    newItem={() => ({})}
                    addLabel="+ 콩쿠르 및 진출 내역 추가"
                    renderItem={(item, set) => (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                        <input style={inputStyle} placeholder="연도 (예: 2025)" value={item.year || ""} onChange={(e) => set({ ...item, year: e.target.value })} />
                        <input style={inputStyle} placeholder="콩쿠르명" value={item.title || ""} onChange={(e) => set({ ...item, title: e.target.value })} />
                        <input style={inputStyle} placeholder="주최 기관 (선택)" value={item.organization || ""} onChange={(e) => set({ ...item, organization: e.target.value })} />
                        <input style={inputStyle} placeholder="결과 (선택, 예: 본선 진출)" value={item.result || ""} onChange={(e) => set({ ...item, result: e.target.value })} />
                      </div>
                    )}
                  />
                </div>
              </div>


              <div hidden={activeEditorSection !== "media"} className="editor-card" style={{ background: "#FFFFFF", padding: "32px", borderRadius: "18px", border: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 950, color: "var(--navy)", marginBottom: "20px", borderBottom: "1.5px solid var(--border)", paddingBottom: "10px" }}>
                  7. 인터뷰 · 기사 · 외부 링크
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                  <ArrayField<any>
                    label="인터뷰 및 기사"
                    variant="dashboard"
                    items={reviewLinks}
                    onChange={setReviewLinks}
                    newItem={() => ({ title: "", publication: "", year: "", url: "" })}
                    addLabel="+ 인터뷰 또는 기사 추가"
                    renderItem={(item, set) => (
                      <div style={{ display: "grid", gap: "8px", width: "100%" }}>
                        <input style={inputStyle} placeholder="제목" value={item.title || ""} onChange={(e) => set({ ...item, title: e.target.value })} />
                        <input style={inputStyle} placeholder="매체명" value={item.publication || ""} onChange={(e) => set({ ...item, publication: e.target.value })} />
                        <input style={inputStyle} placeholder="연도 또는 날짜" value={item.year || item.date || ""} onChange={(e) => set({ ...item, year: e.target.value, date: undefined })} />
                        <input style={inputStyle} type="url" placeholder="https://..." value={item.url || ""} onChange={(e) => set({ ...item, url: e.target.value })} />
                      </div>
                    )}
                  />
                  <ArrayField<any>
                    label="외부 링크"
                    variant="dashboard"
                    items={links}
                    onChange={setLinks}
                    newItem={() => ({ label: "", url: "" })}
                    addLabel="+ 외부 링크 추가"
                    renderItem={(item, set) => (
                      <div style={{ display: "grid", gap: "8px", width: "100%" }}>
                        <input style={inputStyle} placeholder="링크 이름 (예: 개인 홈페이지)" value={item.label || ""} onChange={(e) => set({ ...item, label: e.target.value })} />
                        <input style={inputStyle} type="url" placeholder="https://..." value={item.url || ""} onChange={(e) => set({ ...item, url: e.target.value })} />
                      </div>
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
                
              </div>
            </div>

          </div>

          {/* Centered Save Changes Button for detailed editor */}
          <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-lime"
              style={{
                width: "100%", maxWidth: "320px", padding: "16px 32px", borderRadius: "12px",
                fontWeight: 900, fontSize: "1rem", border: "none", cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 8px 24px rgba(23, 20, 17, 0.08)", transition: "all 0.15s ease"
              }}
            >
              {saving ? "저장 중..." : "💾 변경사항 저장하기"}
            </button>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.78rem", margin: 0, textAlign: "center" }}>
              ※ 저장하기를 클릭하면 변경된 정보가 적용되어 실시간으로 반영됩니다.
            </p>
          </div>
        </div>
      </>
      )}

      <ArtistStoryShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        artist={{
          id: String(artist.id),
          slug: slug || artist.slug || artist.id,
          name: name || artist.name,
          nameEn: nameEn || artist.name_en,
          genre: genre || artist.genre,
          role: role || artist.role,
          instagram: instagram || artist.instagram,
          profileImage: profileImageUrl || artist.profile_image_url || null,
          profileUrl: publicUrl,
        }}
      />
      
      {/* AI Import Modal Overlay */}
      {aiModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          overscrollBehavior: "contain",
          background: "rgba(23, 20, 17, 0.4)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px"
        }}>
          <div className="card fade-up" style={{
            position: "relative",
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
            {/* Explicit close button — this modal previously had no way to
                back out except AiProfileImporter's own internal cancel link. */}
            <button
              type="button"
              onClick={() => setAiModalOpen(false)}
              aria-label="이력서 업로드 닫기"
              style={{
                position: "absolute", top: "12px", right: "12px", zIndex: 1,
                width: "44px", height: "44px", borderRadius: "50%",
                border: "none", background: "transparent", color: "var(--ink-muted)",
                fontSize: "1.4rem", lineHeight: 1, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ×
            </button>
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
                  links,
                  review_links: reviewLinks
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

                  if (merged.works) {
                    setWorks(merged.works.map((work: Work) => {
                      const preservedImages = normalizeWorkImages(work);
                      return {
                        ...work,
                        images: preservedImages,
                        image_url: preservedImages[0] || work.image_url || "",
                      };
                    }));
                  }
                  if (merged.affiliations) setAffiliations(merged.affiliations);
                  if (merged.current_activity) setCurrentActivity(merged.current_activity);
                  if (merged.awards) setAwards(merged.awards);
                  if (merged.competitions) setCompetitions(merged.competitions);
                  if (merged.education) setEducation(merged.education);
                  if (merged.links) setLinks(merged.links);
                  if (merged.review_links) setReviewLinks(merged.review_links);

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

      {/* WORK 미리보기 detail drawer — same WorkDetailModal the public
          artist page uses. */}
      {previewWork && (
        <WorkDetailModal
          work={previewWork}
          accentColor="var(--accent-dark)"
          onClose={() => setPreviewWork(null)}
        />
      )}

      {/* Visual responsive styles for the Quick Upload split and editor layout */}
      <style>{`
        @media (max-width: 480px) {
          .quick-upload-split { gap: 14px !important; }
          .pending-work-grid, .dashboard-photo-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .group-work-controls, .group-work-fields { grid-template-columns: 1fr !important; }
        }
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

const PROFILE_TYPE_LABEL: Record<string, string> = {
  artist: "개인",
  organization: "단체",
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

const quickActionButtonStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "54px",
  padding: "13px 16px",
  border: "1.5px solid var(--navy)",
  borderRadius: "12px",
  background: "#FFFFFF",
  color: "var(--navy)",
  fontFamily: "inherit",
  fontSize: "0.9rem",
  fontWeight: 900,
  textAlign: "center",
  cursor: "pointer",
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
  fontWeight: 400,
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
  fontWeight: 400,
  fontSize: "0.92rem",
  color: "var(--navy)",
  outline: "none",
  background: "#FFFFFF",
  resize: "vertical",
  lineHeight: 1.5,
};

