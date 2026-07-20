"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { Company } from "@/types";
import { normalizeWorkImages, cleanWorksForPayload } from "@/lib/company-works";

interface CompanyCmsEditorProps {
  company: Company;
  onSaveSuccess?: (updatedCompany: Company) => void;
}

interface CreditRow {
  role: string;
  name: string;
}

interface WorkItem {
  id: string;
  title: string;
  year?: string;
  role?: string;
  description?: string;
  video_url?: string;
  image_url?: string;
  images?: string[];
  credits?: string;
  credits_list?: CreditRow[];
  links?: any[];
}

interface ReviewItem {
  id?: string;
  title: string;
  publisher?: string;
  date?: string;
  url?: string;
  description?: string;
}

interface ConnectedArtist {
  id: string;
  artist_id: string;
  role: string | null;
  start_year: number | null;
  end_year: number | null;
  is_current: boolean;
  is_primary: boolean;
  artists?: {
    id: string;
    name: string;
    name_en?: string | null;
    slug?: string;
    profile_image_url?: string | null;
    role?: string;
    genre?: string;
  } | null;
}

// ── Pure helpers (no component state) — shared between initial state derivation,
// the save-snapshot baseline, and the outgoing payload builder, so diffing compares
// like-for-like shapes. ──

const parseWorkCredits = (w: any): CreditRow[] => {
  if (Array.isArray(w.credits) && w.credits.length > 0) {
    const rows: CreditRow[] = [];
    w.credits.forEach((item: any) => {
      if (item && typeof item === "object") {
        const role = item.role || "역할";
        if (Array.isArray(item.names)) {
          item.names.forEach((n: any) => {
            if (String(n).trim()) {
              rows.push({ role, name: String(n).trim() });
            }
          });
        } else if (typeof item.name === "string" && item.name.trim()) {
          rows.push({ role, name: item.name.trim() });
        }
      }
    });
    if (rows.length > 0) return rows;
  }

  if (Array.isArray(w.credits_list) && w.credits_list.length > 0) {
    return w.credits_list;
  }

  if (typeof w.credits === "string" && w.credits.trim()) {
    return w.credits
      .split("\n")
      .map((line: string) => {
        const parts = line.split(":");
        if (parts.length >= 2) {
          return { role: parts[0].trim(), name: parts.slice(1).join(":").trim() };
        }
        return { role: "역할", name: line.trim() };
      })
      .filter((c: CreditRow) => c.name);
  }
  if (w.role) {
    return [{ role: "안무/역할", name: w.role }];
  }
  return [];
};

const deriveWorksFromRaw = (rawWorks: any): WorkItem[] => {
  const arr = Array.isArray(rawWorks) ? rawWorks : [];
  return arr.map((w: any, idx: number) => ({
    id: w.id || `work_${idx}`,
    title: w.title || "",
    year: w.year ? String(w.year) : "",
    role: w.role || "",
    description: w.description || "",
    video_url: w.video_url || w.video || "",
    image_url: w.image_url || w.image || "",
    images: normalizeWorkImages(w),
    credits: w.credits || "",
    credits_list: parseWorkCredits(w),
    links: Array.isArray(w.links) ? w.links : [],
  }));
};

const deriveReviewsFromRaw = (rawReviews: any): ReviewItem[] => {
  const arr = Array.isArray(rawReviews) ? rawReviews : [];
  return arr.map((r: any, idx: number) => ({
    id: r.id || `rev_${idx}`,
    title: r.title || r.name || "",
    publisher: r.publisher || r.source || r.press || "",
    date: r.date || "",
    url: r.url || r.link || "",
    description: r.description || r.snippet || r.summary || "",
  }));
};

interface PayloadFields {
  name: string;
  nameEn: string;
  genre: string;
  category: string;
  cityOrRegion: string;
  foundedYear: string;
  mission: string;
  vision: string;
  coreValues: string[];
  bioShort: string;
  bio: string;
  brandColor: string;
  profileImageUrl: string;
  email: string;
  instagram: string;
  website: string;
  portfolioUrl: string;
  works: WorkItem[];
  currentActivity: any[];
  history: any[];
  reviewLinks: ReviewItem[];
  links: any[];
}

// Builds the exact object shape sent to PUT /api/companies/[id]/update.
// Used both for the live "current" state and for deriving the immutable original
// snapshot, so the two are directly comparable field-by-field.
const buildPayload = (f: PayloadFields) => ({
  name: f.name.trim(),
  name_en: f.nameEn.trim(),
  genre: f.genre.trim(),
  category: f.category.trim(),
  city_or_region: f.cityOrRegion.trim(),
  founded_year: f.foundedYear ? parseInt(f.foundedYear, 10) || null : null,
  mission: f.mission.trim(),
  vision: f.vision.trim(),
  core_values: f.coreValues,
  bio_short: f.bioShort.trim(),
  bio: f.bio.trim(),
  brand_color: f.brandColor.trim(),
  profile_image_url: f.profileImageUrl.trim(),
  email: f.email.trim(),
  instagram: f.instagram.trim(),
  website: f.website.trim(),
  portfolio_url: f.portfolioUrl.trim(),
  works: cleanWorksForPayload(f.works),
  current_activity: f.currentActivity,
  history: f.history,
  review_links: f.reviewLinks,
  links: f.links,
});

// Builds the same payload shape directly from a loaded Company row — this is what
// "no edits yet" would look like, i.e. the diff baseline.
const snapshotFromCompany = (c: any) =>
  buildPayload({
    name: c.name || "",
    nameEn: c.name_en || "",
    genre: c.genre || "",
    category: c.category || "",
    cityOrRegion: c.city_or_region || "",
    foundedYear: c.founded_year ? String(c.founded_year) : "",
    mission: c.mission || "",
    vision: c.vision || "",
    coreValues: Array.isArray(c.core_values) ? c.core_values : Array.isArray(c.values) ? c.values : [],
    bioShort: c.bio_short || "",
    bio: c.bio || "",
    brandColor: c.brand_color || "#C8EE52",
    profileImageUrl: c.profile_image_url || "",
    email: c.email || "",
    instagram: c.instagram || "",
    website: c.website || "",
    portfolioUrl: c.portfolio_url || "",
    works: deriveWorksFromRaw(c.works),
    currentActivity: Array.isArray(c.current_activity) ? c.current_activity : [],
    history: Array.isArray(c.history) ? c.history : [],
    reviewLinks: deriveReviewsFromRaw(c.review_links),
    links: Array.isArray(c.links) ? c.links : [],
  });

// Treats null/undefined/"" as equivalent, trims strings, and deep-compares
// arrays/objects by structural content so unrelated fields never look "changed"
// due to reference identity or whitespace/legacy-shape noise.
const normalizeForCompare = (val: any): any => {
  if (val === undefined || val === null) return "";
  if (typeof val === "string") return val.trim();
  return val;
};

const isEqualValue = (a: any, b: any): boolean => {
  const na = normalizeForCompare(a);
  const nb = normalizeForCompare(b);
  if (na && nb && typeof na === "object" && typeof nb === "object") {
    return JSON.stringify(na) === JSON.stringify(nb);
  }
  return na === nb;
};

export default function CompanyCmsEditor({ company, onSaveSuccess }: CompanyCmsEditorProps) {
  // Basic states
  const [name, setName] = useState(company.name || "");
  const [nameEn, setNameEn] = useState(company.name_en || "");
  const [genre, setGenre] = useState(company.genre || "");
  const [category, setCategory] = useState(company.category || "");
  const [cityOrRegion, setCityOrRegion] = useState(company.city_or_region || "");
  const [foundedYear, setFoundedYear] = useState<string>(company.founded_year ? String(company.founded_year) : "");
  const [brandColor, setBrandColor] = useState(company.brand_color || "#C8EE52");

  // Identity states
  const [mission, setMission] = useState(company.mission || "");
  const [vision, setVision] = useState(company.vision || "");
  const [coreValuesInput, setCoreValuesInput] = useState((company.core_values || company.values || []).join(", "));
  const [bioShort, setBioShort] = useState(company.bio_short || "");
  const [bio, setBio] = useState(company.bio || "");

  // Media state: Single Representative Image
  const [profileImageUrl, setProfileImageUrl] = useState(company.profile_image_url || "");

  // Contact states
  const [email, setEmail] = useState(company.email || "");
  const [instagram, setInstagram] = useState(company.instagram || "");
  const [website, setWebsite] = useState(company.website || "");
  const [portfolioUrl, setPortfolioUrl] = useState(company.portfolio_url || "");

  // Works state (Requirement 3 & 4)
  const [works, setWorks] = useState<WorkItem[]>(() => deriveWorksFromRaw(company.works));

  // Current Activity / Projects state
  const [currentActivity, setCurrentActivity] = useState<any[]>(Array.isArray(company.current_activity) ? company.current_activity : []);

  // History state
  const [history, setHistory] = useState<any[]>(Array.isArray(company.history) ? company.history : []);

  // Reviews & Press state (Requirement 2)
  const [reviewLinks, setReviewLinks] = useState<ReviewItem[]>(() => deriveReviewsFromRaw(company.review_links));

  const [links, setLinks] = useState<any[]>(Array.isArray(company.links) ? company.links : []);

  // Immutable snapshot of the last-loaded/last-saved company, in outgoing-payload shape.
  // Save diffs live state against this so only actually-changed fields are ever sent.
  const originalSnapshotRef = useRef(snapshotFromCompany(company));

  // Affiliated Artists State (Requirement 1)
  const [connectedArtists, setConnectedArtists] = useState<ConnectedArtist[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const [artistSearchQuery, setArtistSearchQuery] = useState("");
  const [artistSearchResults, setArtistSearchResults] = useState<any[]>([]);
  const [searchingArtist, setSearchingArtist] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"basic" | "identity" | "media" | "artists" | "works" | "reviews" | "history" | "contact">("basic");
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Fetch connected artists
  const fetchConnectedArtists = useCallback(async () => {
    setLoadingArtists(true);
    try {
      const res = await fetch(`/api/companies/${company.id}/artists`);
      const data = await res.json();
      if (data.success) {
        setConnectedArtists(data.artists || []);
      }
    } catch (err) {
      console.error("[fetchConnectedArtists] Error:", err);
    } finally {
      setLoadingArtists(false);
    }
  }, [company.id]);

  useEffect(() => {
    if (activeTab === "artists") {
      fetchConnectedArtists();
    }
  }, [activeTab, fetchConnectedArtists]);

  // Artist search handler
  useEffect(() => {
    if (!artistSearchQuery.trim()) {
      setArtistSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setSearchingArtist(true);
      fetch(`/api/artists/search?q=${encodeURIComponent(artistSearchQuery.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setArtistSearchResults(data.artists || []);
          }
          setSearchingArtist(false);
        })
        .catch(() => setSearchingArtist(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [artistSearchQuery]);

  useEffect(() => {
    setName(company.name || "");
    setNameEn(company.name_en || "");
    setGenre(company.genre || "");
    setCategory(company.category || "");
    setCityOrRegion(company.city_or_region || "");
    setFoundedYear(company.founded_year ? String(company.founded_year) : "");
    setBrandColor(company.brand_color || "#C8EE52");
    setMission(company.mission || "");
    setVision(company.vision || "");
    setCoreValuesInput((company.core_values || company.values || []).join(", "));
    setBioShort(company.bio_short || "");
    setBio(company.bio || "");
    setProfileImageUrl(company.profile_image_url || "");
    setEmail(company.email || "");
    setInstagram(company.instagram || "");
    setWebsite(company.website || "");
    setPortfolioUrl(company.portfolio_url || "");
    setWorks(deriveWorksFromRaw(company.works));
    setCurrentActivity(Array.isArray(company.current_activity) ? company.current_activity : []);
    setHistory(Array.isArray(company.history) ? company.history : []);
    setReviewLinks(deriveReviewsFromRaw(company.review_links));
    setLinks(Array.isArray(company.links) ? company.links : []);

    // This company load (fresh fetch or post-save refresh) becomes the new diff baseline.
    originalSnapshotRef.current = snapshotFromCompany(company);
  }, [company]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Single Representative Image upload helper
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField("profile");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", `companies/${company.id}`);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        setProfileImageUrl(data.url);
        triggerToast("대표 이미지가 업로드되었습니다.");
      } else {
        triggerToast(data.error || "이미지 업로드 실패");
      }
    } catch {
      triggerToast("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploadingField(null);
    }
  };

  // Work Specific Image Upload (Up to 4 images)
  const handleWorkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, workIndex: number, imageSlotIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(`work_${workIndex}_img_${imageSlotIndex}`);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", `companies/${company.id}/works`);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        setWorks((prev) => {
          const updated = [...prev];
          const workItem = { ...updated[workIndex] };
          const imagesList = [...(workItem.images || [])];
          imagesList[imageSlotIndex] = data.url;
          workItem.images = imagesList.filter(Boolean);
          if (imageSlotIndex === 0) {
            workItem.image_url = data.url;
          }
          updated[workIndex] = workItem;
          return updated;
        });
        triggerToast("작품 이미지가 업로드되었습니다.");
      } else {
        triggerToast(data.error || "이미지 업로드 실패");
      }
    } catch {
      triggerToast("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploadingField(null);
    }
  };

  // Save changes handler — sends only the fields that actually changed since load/last-save.
  const handleSave = async () => {
    if (!name.trim()) {
      triggerToast("단체 이름은 필수 항목입니다.");
      return;
    }

    const parsedValues = coreValuesInput
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    const currentPayload = buildPayload({
      name,
      nameEn,
      genre,
      category,
      cityOrRegion,
      foundedYear,
      mission,
      vision,
      coreValues: parsedValues,
      bioShort,
      bio,
      brandColor,
      profileImageUrl,
      email,
      instagram,
      website,
      portfolioUrl,
      works,
      currentActivity,
      history,
      reviewLinks,
      links,
    });

    const original = originalSnapshotRef.current;
    const diffPayload: Record<string, any> = {};
    (Object.keys(currentPayload) as (keyof typeof currentPayload)[]).forEach((key) => {
      if (!isEqualValue(currentPayload[key], original[key])) {
        diffPayload[key] = currentPayload[key];
      }
    });

    if (Object.keys(diffPayload).length === 0) {
      triggerToast("변경된 내용이 없습니다.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/companies/${company.id}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(diffPayload),
      });

      const data = await res.json();
      if (!data.success) {
        triggerToast(data.error || "저장에 실패했습니다.");
        setSaving(false);
        return;
      }

      triggerToast("단체 정보가 성공적으로 저장되었습니다.");
      // The fields we just wrote are now the confirmed baseline — merge rather than
      // waiting on a parent re-render (which may not happen, or may not swap `company`).
      originalSnapshotRef.current = { ...original, ...diffPayload };
      if (onSaveSuccess && data.company) {
        onSaveSuccess(data.company);
      }
    } catch {
      triggerToast("서버 통신 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // Affiliated Artists Helpers
  const handleAddArtistConnection = async (artist: any) => {
    try {
      const res = await fetch(`/api/companies/${company.id}/artists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist_id: artist.id,
          role: "소속 아티스트",
          is_current: true,
          is_primary: false,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        triggerToast(data.error || "아티스트 소속 등록에 실패했습니다.");
        return;
      }

      triggerToast(`'${artist.name}' 아티스트가 소속으로 등록되었습니다.`);
      setArtistSearchQuery("");
      setArtistSearchResults([]);
      fetchConnectedArtists();
    } catch {
      triggerToast("오류가 발생했습니다.");
    }
  };

  const handleUpdateArtistConnection = async (relation: ConnectedArtist) => {
    try {
      const res = await fetch(`/api/companies/${company.id}/artists/${relation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: relation.role,
          is_current: relation.is_current,
          is_primary: relation.is_primary,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        triggerToast(data.error || "수정에 실패했습니다.");
        return;
      }

      triggerToast("소속 정보가 수정되었습니다.");
      fetchConnectedArtists();
    } catch {
      triggerToast("오류가 발생했습니다.");
    }
  };

  const handleRemoveArtistConnection = async (relationId: string, artistName: string) => {
    if (!confirm(`'${artistName}' 아티스트를 단체 소속에서 해제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/companies/${company.id}/artists/${relationId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!data.success) {
        triggerToast(data.error || "해제에 실패했습니다.");
        return;
      }

      triggerToast("소속 해제되었습니다.");
      fetchConnectedArtists();
    } catch {
      triggerToast("오류가 발생했습니다.");
    }
  };

  // Work Helpers
  const handleAddWork = () => {
    setWorks((prev) => [
      ...prev,
      {
        id: `work_${Date.now()}`,
        title: "",
        year: new Date().getFullYear().toString(),
        role: "",
        description: "",
        video_url: "",
        image_url: "",
        images: [],
        credits: "",
        credits_list: [{ role: "안무", name: "" }],
        links: [],
      },
    ]);
  };

  const handleUpdateWork = (index: number, key: string, val: any) => {
    setWorks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: val };
      return updated;
    });
  };

  const handleRemoveWork = (index: number) => {
    setWorks((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Credits Row Editors
  const handleAddCreditRow = (workIndex: number) => {
    setWorks((prev) => {
      const updated = [...prev];
      const workItem = { ...updated[workIndex] };
      const creditsList = [...(workItem.credits_list || [])];
      creditsList.push({ role: "역할", name: "" });
      workItem.credits_list = creditsList;
      updated[workIndex] = workItem;
      return updated;
    });
  };

  const handleUpdateCreditRow = (workIndex: number, creditIndex: number, field: "role" | "name", val: string) => {
    setWorks((prev) => {
      const updated = [...prev];
      const workItem = { ...updated[workIndex] };
      const creditsList = [...(workItem.credits_list || [])];
      creditsList[creditIndex] = { ...creditsList[creditIndex], [field]: val };
      workItem.credits_list = creditsList;
      updated[workIndex] = workItem;
      return updated;
    });
  };

  const handleRemoveCreditRow = (workIndex: number, creditIndex: number) => {
    setWorks((prev) => {
      const updated = [...prev];
      const workItem = { ...updated[workIndex] };
      const creditsList = [...(workItem.credits_list || [])].filter((_, cidx) => cidx !== creditIndex);
      workItem.credits_list = creditsList;
      updated[workIndex] = workItem;
      return updated;
    });
  };

  // Reviews Helpers
  const handleAddReview = () => {
    setReviewLinks((prev) => [
      ...prev,
      {
        id: `rev_${Date.now()}`,
        title: "",
        publisher: "",
        date: new Date().toISOString().slice(0, 10),
        url: "",
        description: "",
      },
    ]);
  };

  const handleUpdateReview = (index: number, key: string, val: any) => {
    setReviewLinks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: val };
      return updated;
    });
  };

  const handleRemoveReview = (index: number) => {
    setReviewLinks((prev) => prev.filter((_, idx) => idx !== index));
  };

  // History helpers
  const handleAddHistory = () => {
    setHistory((prev) => [...prev, { year: new Date().getFullYear().toString(), event: "" }]);
  };

  const handleUpdateHistory = (index: number, key: string, val: any) => {
    setHistory((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: val };
      return updated;
    });
  };

  const handleRemoveHistory = (index: number) => {
    setHistory((prev) => prev.filter((_, idx) => idx !== index));
  };

  const publicPageHref = `/companies/${company.slug || company.id}`;

  return (
    <div style={{ width: "100%", background: "#FFFFFF", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
      {/* Editor Header Bar */}
      <div
        style={{
          padding: "20px 28px",
          borderBottom: "1px solid var(--border)",
          background: "#FAF9F5",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <span className="mono" style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--ink-muted)", textTransform: "uppercase" }}>
            ORGANIZATION PROFILE CMS
          </span>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 950, color: "var(--navy)", margin: "2px 0 0" }}>
            {company.name} <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ink-muted)" }}>(대표 관리 모드)</span>
          </h2>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <a
            href={publicPageHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "10px 16px",
              fontSize: "0.82rem",
              fontWeight: 800,
              color: "var(--navy)",
              border: "1.5px solid var(--border)",
              borderRadius: "8px",
              textDecoration: "none",
              background: "#FFFFFF",
            }}
          >
            공개 페이지 보기 ↗
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 24px",
              fontSize: "0.88rem",
              fontWeight: 800,
              color: "#FFFFFF",
              backgroundColor: "var(--navy)",
              border: "none",
              borderRadius: "8px",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              boxShadow: "0 4px 12px rgba(23, 20, 17, 0.15)",
            }}
          >
            {saving ? "저장 중..." : "변경사항 저장"}
          </button>
        </div>
      </div>

      {/* Editor Tab Navigation */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "#FFFFFF", overflowX: "auto" }}>
        {[
          { key: "basic", label: "기본 정보 & 브랜딩" },
          { key: "identity", label: "소개 & 미션/비전" },
          { key: "media", label: "대표 이미지" },
          { key: "artists", label: `소속 아티스트 (${connectedArtists.length})` },
          { key: "works", label: `대표작 & 크레딧 (${works.length})` },
          { key: "reviews", label: `기사 & 리뷰 (${reviewLinks.length})` },
          { key: "history", label: `연혁 (${history.length})` },
          { key: "contact", label: "연락처 & SNS" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: "14px 20px",
              fontSize: "0.85rem",
              fontWeight: activeTab === tab.key ? 850 : 600,
              color: activeTab === tab.key ? "var(--navy)" : "var(--ink-muted)",
              border: "none",
              borderBottom: activeTab === tab.key ? "3px solid var(--navy)" : "3px solid transparent",
              background: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div style={{ padding: "32px 28px" }}>
        
        {/* ── Tab 1: Basic Info ── */}
        {activeTab === "basic" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "680px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                  단체명 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", fontSize: "0.9rem", borderRadius: "6px", border: "1px solid var(--border)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                  영문명 (English Name)
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", fontSize: "0.9rem", borderRadius: "6px", border: "1px solid var(--border)" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                고유 주소 (Slug) <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", fontWeight: 500 }}>(수정 불가 - 관리자 전용)</span>
              </label>
              <input
                type="text"
                disabled
                value={company.slug || company.id}
                style={{ width: "100%", padding: "10px 14px", fontSize: "0.9rem", borderRadius: "6px", border: "1px solid var(--border)", background: "#F5F5F5", color: "#666" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                  장르 (Genre)
                </label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="예: 현대무용, 발레"
                  style={{ width: "100%", padding: "10px 14px", fontSize: "0.88rem", borderRadius: "6px", border: "1px solid var(--border)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                  카테고리 (Category)
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="예: dance, music"
                  style={{ width: "100%", padding: "10px 14px", fontSize: "0.88rem", borderRadius: "6px", border: "1px solid var(--border)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                  활동 도시/지역
                </label>
                <input
                  type="text"
                  value={cityOrRegion}
                  onChange={(e) => setCityOrRegion(e.target.value)}
                  placeholder="예: 서울, 경기"
                  style={{ width: "100%", padding: "10px 14px", fontSize: "0.88rem", borderRadius: "6px", border: "1px solid var(--border)" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                  창단 연도 (Founded Year)
                </label>
                <input
                  type="number"
                  value={foundedYear}
                  onChange={(e) => setFoundedYear(e.target.value)}
                  placeholder="예: 2018"
                  style={{ width: "100%", padding: "10px 14px", fontSize: "0.88rem", borderRadius: "6px", border: "1px solid var(--border)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                  브랜드 포인트 컬러 (Accent Color)
                </label>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    style={{ width: "42px", height: "42px", borderRadius: "6px", border: "1px solid var(--border)", cursor: "pointer", padding: "2px" }}
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    placeholder="#C8EE52"
                    style={{ flex: 1, padding: "10px 14px", fontSize: "0.88rem", borderRadius: "6px", border: "1px solid var(--border)", fontFamily: "monospace" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: Identity & Bio ── */}
        {activeTab === "identity" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "680px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                한 줄 소개 (Short Bio)
              </label>
              <input
                type="text"
                value={bioShort}
                onChange={(e) => setBioShort(e.target.value)}
                placeholder="검색 및 디지털 카드에 표시될 요약 소개글"
                style={{ width: "100%", padding: "10px 14px", fontSize: "0.9rem", borderRadius: "6px", border: "1px solid var(--border)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                상세 소개글 (Full Bio)
              </label>
              <textarea
                rows={6}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="단체의 설립 배경, 예술적 지향점, 주요 활동 방향에 대한 상세 설명..."
                style={{ width: "100%", padding: "12px 14px", fontSize: "0.88rem", borderRadius: "6px", border: "1px solid var(--border)", lineHeight: 1.6, resize: "vertical" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                  미션 (Mission)
                </label>
                <textarea
                  rows={3}
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  placeholder="단체의 핵심 사명 및 목적"
                  style={{ width: "100%", padding: "10px 14px", fontSize: "0.85rem", borderRadius: "6px", border: "1px solid var(--border)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                  비전 (Vision)
                </label>
                <textarea
                  rows={3}
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  placeholder="단체의 미래 비전 및 방향성"
                  style={{ width: "100%", padding: "10px 14px", fontSize: "0.85rem", borderRadius: "6px", border: "1px solid var(--border)" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                핵심 가치 (Core Values) <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", fontWeight: 500 }}>(쉼표로 구분)</span>
              </label>
              <input
                type="text"
                value={coreValuesInput}
                onChange={(e) => setCoreValuesInput(e.target.value)}
                placeholder="실험성, 신체성, 연대, 동시대성"
                style={{ width: "100%", padding: "10px 14px", fontSize: "0.88rem", borderRadius: "6px", border: "1px solid var(--border)" }}
              />
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)" }}>
                  현재 활동 / 프로젝트 (Current Activity)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentActivity((prev) => [...prev, { title: "", date: "", description: "", link: "" }])
                  }
                  style={{
                    padding: "6px 14px",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: "#FFFFFF",
                    backgroundColor: "var(--navy)",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  + 프로젝트 추가
                </button>
              </div>

              {currentActivity.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "6px", color: "var(--ink-muted)", fontSize: "0.82rem" }}>
                  진행 중인 프로젝트가 없습니다.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {currentActivity.map((proj, aidx) => (
                    <div key={aidx} style={{ border: "1px solid var(--border)", borderRadius: "6px", padding: "14px", background: "#FAF9F5" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px", marginBottom: "10px" }}>
                        <input
                          type="text"
                          value={proj.title || ""}
                          onChange={(e) => {
                            const updated = [...currentActivity];
                            updated[aidx] = { ...updated[aidx], title: e.target.value };
                            setCurrentActivity(updated);
                          }}
                          placeholder="프로젝트명"
                          style={{ padding: "8px 12px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid var(--border)", background: "#FFFFFF" }}
                        />
                        <input
                          type="text"
                          value={proj.date || ""}
                          onChange={(e) => {
                            const updated = [...currentActivity];
                            updated[aidx] = { ...updated[aidx], date: e.target.value };
                            setCurrentActivity(updated);
                          }}
                          placeholder="예: 2026.08.10 - 2026.11.20"
                          style={{ padding: "8px 12px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid var(--border)", background: "#FFFFFF" }}
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={proj.description || ""}
                        onChange={(e) => {
                          const updated = [...currentActivity];
                          updated[aidx] = { ...updated[aidx], description: e.target.value };
                          setCurrentActivity(updated);
                        }}
                        placeholder="상세 설명"
                        style={{ width: "100%", padding: "8px 12px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid var(--border)", background: "#FFFFFF", marginBottom: "10px", resize: "vertical" }}
                      />
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <input
                          type="text"
                          value={proj.link || ""}
                          onChange={(e) => {
                            const updated = [...currentActivity];
                            updated[aidx] = { ...updated[aidx], link: e.target.value };
                            setCurrentActivity(updated);
                          }}
                          placeholder="관련 정보 링크 (https://...)"
                          style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid var(--border)", background: "#FFFFFF" }}
                        />
                        <button
                          type="button"
                          onClick={() => setCurrentActivity((prev) => prev.filter((_, i) => i !== aidx))}
                          style={{ fontSize: "0.78rem", fontWeight: 800, color: "#991B1B", background: "none", border: "none", cursor: "pointer" }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab 3: Simplified Media (Representative Image Only) ── */}
        {activeTab === "media" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "600px" }}>
            <div style={{ border: "1.5px solid var(--border)", borderRadius: "10px", padding: "24px", background: "#FAF9F5" }}>
              <label style={{ display: "block", fontSize: "0.95rem", fontWeight: 900, color: "var(--navy)", marginBottom: "4px" }}>
                단체 대표 이미지 (Representative Image)
              </label>
              <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
                단체를 대표하는 메인 썸네일 이미지입니다. 검색 결과, 단체 카드, 프로필 페이지 상단 및 기본 히어로 이미지로 활용됩니다.
              </p>

              <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
                {profileImageUrl ? (
                  <div style={{ position: "relative", width: "160px", aspectRatio: "1.33", borderRadius: "8px", overflow: "hidden", border: "1.5px solid var(--border)" }}>
                    <img src={profileImageUrl} alt="Representative" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <div style={{ width: "160px", aspectRatio: "1.33", borderRadius: "8px", border: "1.5px dashed var(--border)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", color: "var(--ink-muted)", background: "#FFFFFF", gap: "4px" }}>
                    <span>🖼️ 이미지 없음</span>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                    id="single-representative-upload"
                  />
                  <label
                    htmlFor="single-representative-upload"
                    style={{
                      padding: "10px 18px",
                      fontSize: "0.85rem",
                      fontWeight: 800,
                      color: "#FFFFFF",
                      backgroundColor: "var(--navy)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "inline-block",
                      textAlign: "center",
                    }}
                  >
                    {uploadingField === "profile" ? "업로드 중..." : profileImageUrl ? "대표 이미지 변경" : "대표 이미지 선택"}
                  </label>

                  {profileImageUrl && (
                    <button
                      type="button"
                      onClick={() => setProfileImageUrl("")}
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "#991B1B",
                        background: "#FFFFFF",
                        border: "1px solid #FCA5A5",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      이미지 삭제
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 4: Affiliated Artists ── */}
        {activeTab === "artists" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "780px" }}>
            
            {/* Search & Add Section */}
            <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", background: "#FAF9F5" }}>
              <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 850, color: "var(--navy)", marginBottom: "6px" }}>
                + 소속 아티스트 검색 및 추가
              </label>
              <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", margin: "0 0 12px 0" }}>
                POPOK 플랫폼에 등록된 아티스트 이름을 검색하여 단체 소속으로 추가할 수 있습니다.
              </p>

              <input
                type="text"
                value={artistSearchQuery}
                onChange={(e) => setArtistSearchQuery(e.target.value)}
                placeholder="아티스트 이름을 입력하세요... (예: 이다연, 노예슬)"
                style={{ width: "100%", padding: "10px 14px", fontSize: "0.88rem", borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: "#FFFFFF" }}
              />

              {searchingArtist && (
                <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)", marginTop: "8px" }}>
                  검색 중...
                </div>
              )}

              {!searchingArtist && artistSearchResults.length > 0 && (
                <div style={{ marginTop: "10px", border: "1px solid var(--border)", borderRadius: "6px", background: "#FFFFFF", maxHeight: "200px", overflowY: "auto" }}>
                  {artistSearchResults.map((art) => (
                    <div
                      key={art.id}
                      style={{
                        padding: "10px 14px",
                        borderBottom: "1px solid var(--border-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {art.profile_image_url ? (
                          <img src={art.profile_image_url} alt="" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>
                            👤
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--navy)" }}>{art.name}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)" }}>{art.role || art.genre || "아티스트"}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddArtistConnection(art)}
                        style={{
                          padding: "6px 12px",
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: "#FFFFFF",
                          backgroundColor: "var(--navy)",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        + 소속 추가
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Connected Artists List */}
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--navy)", marginBottom: "14px" }}>
                현재 연결된 소속 아티스트 목록 ({connectedArtists.length}명)
              </h3>

              {loadingArtists ? (
                <div style={{ padding: "20px", color: "var(--ink-muted)", fontSize: "0.85rem" }}>
                  소속 목록 조회 중...
                </div>
              ) : connectedArtists.length === 0 ? (
                <div style={{ padding: "30px", border: "1px dashed var(--border)", borderRadius: "8px", textAlign: "center", color: "var(--ink-muted)", fontSize: "0.85rem" }}>
                  연결된 소속 아티스트가 없습니다. 상단의 아티스트 검색을 통해 단체 멤버를 등록해보세요.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {connectedArtists.map((rel) => {
                    const artistInfo = rel.artists;
                    return (
                      <div
                        key={rel.id}
                        style={{
                          border: "1.5px solid var(--border)",
                          borderRadius: "8px",
                          padding: "16px 20px",
                          background: "#FFFFFF",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {artistInfo?.profile_image_url ? (
                              <img src={artistInfo.profile_image_url} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
                            ) : (
                              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#FAF9F5", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>
                                🎭
                              </div>
                            )}
                            <div>
                              <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "var(--navy)" }}>
                                {artistInfo?.name || "알 수 없는 아티스트"}
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                                {artistInfo?.role || artistInfo?.genre || "아티스트"}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveArtistConnection(rel.id, artistInfo?.name || "아티스트")}
                            style={{
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              color: "#991B1B",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                          >
                            소속 해제
                          </button>
                        </div>

                        {/* Editable relation settings */}
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "12px", alignItems: "center", background: "#FAF9F5", padding: "12px 14px", borderRadius: "6px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
                              직책/역할 (Role)
                            </label>
                            <input
                              type="text"
                              value={rel.role || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setConnectedArtists((prev) =>
                                  prev.map((item) => (item.id === rel.id ? { ...item, role: val } : item))
                                );
                              }}
                              placeholder="예: 대표 안무가 / 단원"
                              style={{ width: "100%", padding: "6px 10px", fontSize: "0.82rem", borderRadius: "4px", border: "1px solid var(--border)" }}
                            />
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <input
                              type="checkbox"
                              id={`current_${rel.id}`}
                              checked={rel.is_current}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setConnectedArtists((prev) =>
                                  prev.map((item) => (item.id === rel.id ? { ...item, is_current: checked } : item))
                                );
                              }}
                              style={{ cursor: "pointer" }}
                            />
                            <label htmlFor={`current_${rel.id}`} style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", cursor: "pointer" }}>
                              현재 활동 중
                            </label>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <input
                              type="checkbox"
                              id={`primary_${rel.id}`}
                              checked={rel.is_primary}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setConnectedArtists((prev) =>
                                  prev.map((item) => (item.id === rel.id ? { ...item, is_primary: checked } : item))
                                );
                              }}
                              style={{ cursor: "pointer" }}
                            />
                            <label htmlFor={`primary_${rel.id}`} style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", cursor: "pointer" }}>
                              대표 아티스트
                            </label>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              onClick={() => handleUpdateArtistConnection(rel)}
                              style={{
                                padding: "6px 12px",
                                fontSize: "0.75rem",
                                fontWeight: 800,
                                color: "var(--navy)",
                                background: "#FFFFFF",
                                border: "1px solid var(--navy)",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                            >
                              설정 저장
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Tab 5: Representative Works & Credits ── */}
        {activeTab === "works" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "840px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--navy)", margin: 0 }}>
                  대표작 및 크레딧 관리 (Selected Works & Credits)
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", margin: "4px 0 0" }}>
                  작품 설명, 영상 링크, 최대 4장의 이미지 슬라이더, 무제한 크레딧(안무/무용/조명/음악 등)을 설정합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddWork}
                style={{
                  padding: "10px 18px",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  backgroundColor: "var(--navy)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                + 대표작 추가
              </button>
            </div>

            {works.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "8px", color: "var(--ink-muted)", fontSize: "0.85rem" }}>
                등록된 대표작이 없습니다. 상단의 '+ 대표작 추가' 버튼을 눌러 작품을 등록해보세요.
              </div>
            ) : (
              works.map((work, widx) => (
                <div key={work.id || widx} style={{ border: "1.5px solid var(--border)", borderRadius: "10px", padding: "24px", background: "#FAF9F5" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                    <span className="mono" style={{ fontSize: "0.75rem", fontWeight: 850, color: "var(--navy)" }}>
                      WORK #{widx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveWork(widx)}
                      style={{ fontSize: "0.78rem", fontWeight: 800, color: "#991B1B", background: "none", border: "none", cursor: "pointer" }}
                    >
                      작품 삭제
                    </button>
                  </div>

                  {/* Basic Work Fields */}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
                        작품명 *
                      </label>
                      <input
                        type="text"
                        value={work.title || ""}
                        onChange={(e) => handleUpdateWork(widx, "title", e.target.value)}
                        placeholder="예: 추락에도 포옹"
                        style={{ width: "100%", padding: "8px 12px", fontSize: "0.88rem", borderRadius: "4px", border: "1px solid var(--border)", background: "#FFFFFF" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
                        발표 연도
                      </label>
                      <input
                        type="text"
                        value={work.year || ""}
                        onChange={(e) => handleUpdateWork(widx, "year", e.target.value)}
                        placeholder="2024"
                        style={{ width: "100%", padding: "8px 12px", fontSize: "0.88rem", borderRadius: "4px", border: "1px solid var(--border)", background: "#FFFFFF" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
                        대표 역할
                      </label>
                      <input
                        type="text"
                        value={work.role || ""}
                        onChange={(e) => handleUpdateWork(widx, "role", e.target.value)}
                        placeholder="안무 / 출연"
                        style={{ width: "100%", padding: "8px 12px", fontSize: "0.88rem", borderRadius: "4px", border: "1px solid var(--border)", background: "#FFFFFF" }}
                      />
                    </div>
                  </div>

                  {/* Video URL */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
                      영상 URL (Youtube / Vimeo / MP4 링크)
                    </label>
                    <input
                      type="text"
                      value={work.video_url || ""}
                      onChange={(e) => handleUpdateWork(widx, "video_url", e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      style={{ width: "100%", padding: "8px 12px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid var(--border)", background: "#FFFFFF" }}
                    />
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
                      작품 상세 설명
                    </label>
                    <textarea
                      rows={3}
                      value={work.description || ""}
                      onChange={(e) => handleUpdateWork(widx, "description", e.target.value)}
                      placeholder="작품의 의도, 콘셉트, 주요 기획 설명..."
                      style={{ width: "100%", padding: "8px 12px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid var(--border)", background: "#FFFFFF", resize: "vertical" }}
                    />
                  </div>

                  {/* Multi-Image Upload (Up to 4 Images) */}
                  <div style={{ marginBottom: "24px", border: "1px solid var(--border)", padding: "16px", borderRadius: "6px", background: "#FFFFFF" }}>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 850, color: "var(--navy)", marginBottom: "8px" }}>
                      📸 작품 스틸컷 / 이미지 슬라이더 (최대 4장)
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                      {[0, 1, 2, 3].map((slotIdx) => {
                        const imgUrl = work.images?.[slotIdx];
                        return (
                          <div key={slotIdx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div
                              style={{
                                width: "100%",
                                aspectRatio: "1.33",
                                borderRadius: "6px",
                                border: "1.5px dashed var(--border)",
                                background: "#FAF9F5",
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                position: "relative",
                              }}
                            >
                              {imgUrl ? (
                                <>
                                  <img src={imgUrl} alt={`Slot ${slotIdx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newImages = [...(work.images || [])];
                                      newImages.splice(slotIdx, 1);
                                      handleUpdateWork(widx, "images", newImages);
                                    }}
                                    style={{
                                      position: "absolute",
                                      top: "4px",
                                      right: "4px",
                                      background: "rgba(0,0,0,0.7)",
                                      color: "#FFF",
                                      border: "none",
                                      borderRadius: "50%",
                                      width: "22px",
                                      height: "22px",
                                      fontSize: "0.8rem",
                                      cursor: "pointer",
                                    }}
                                  >
                                    ×
                                  </button>
                                </>
                              ) : (
                                <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", fontWeight: 700 }}>
                                  #{slotIdx + 1} 이미지
                                </span>
                              )}
                            </div>

                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleWorkImageUpload(e, widx, slotIdx)}
                              style={{ display: "none" }}
                              id={`work_${widx}_img_slot_${slotIdx}`}
                            />
                            <label
                              htmlFor={`work_${widx}_img_slot_${slotIdx}`}
                              style={{
                                textAlign: "center",
                                padding: "5px 8px",
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                color: "var(--navy)",
                                backgroundColor: "#FAF9F5",
                                border: "1px solid var(--border)",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                            >
                              {uploadingField === `work_${widx}_img_${slotIdx}` ? "업로드 중..." : imgUrl ? "변경" : "+ 파일 선택"}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Multi-Row Credits Editor */}
                  <div style={{ border: "1px solid var(--border)", padding: "16px", borderRadius: "6px", background: "#FFFFFF" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <label style={{ fontSize: "0.82rem", fontWeight: 850, color: "var(--navy)" }}>
                        👥 크레딧 항목 관리 (무제한 항목 추가)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddCreditRow(widx)}
                        style={{
                          padding: "5px 12px",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          color: "var(--navy)",
                          background: "#FAF9F5",
                          border: "1px solid var(--navy)",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        + 크레딧 항목 추가
                      </button>
                    </div>

                    {(work.credits_list || []).length === 0 ? (
                      <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)", textAlign: "center", padding: "12px", background: "#FAF9F5", borderRadius: "4px" }}>
                        크레딧 항목이 없습니다. '+ 크레딧 항목 추가' 버튼을 눌러 안무가, 무용수, 스태프 등을 추가해보세요.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {(work.credits_list || []).map((credit, cidx) => (
                          <div key={cidx} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <input
                              type="text"
                              value={credit.role}
                              onChange={(e) => handleUpdateCreditRow(widx, cidx, "role", e.target.value)}
                              placeholder="역할 (예: 안무, 무용, 조명)"
                              style={{ width: "130px", padding: "6px 10px", fontSize: "0.82rem", borderRadius: "4px", border: "1px solid var(--border)" }}
                            />
                            <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--ink-muted)" }}>:</span>
                            <input
                              type="text"
                              value={credit.name}
                              onChange={(e) => handleUpdateCreditRow(widx, cidx, "name", e.target.value)}
                              placeholder="이름 (예: 이다연, 노예슬)"
                              style={{ flex: 1, padding: "6px 10px", fontSize: "0.82rem", borderRadius: "4px", border: "1px solid var(--border)" }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveCreditRow(widx, cidx)}
                              style={{ fontSize: "0.78rem", color: "#991B1B", background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                            >
                              삭제
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        )}

        {/* ── Tab 6: Reviews & Articles ── */}
        {activeTab === "reviews" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "780px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--navy)", margin: 0 }}>
                  언론 기사 및 리뷰 관리 (Press & Reviews)
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", margin: "4px 0 0" }}>
                  언론 보도, 평론 기사, 비평 및 인용문 항목을 추가합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddReview}
                style={{
                  padding: "10px 18px",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  backgroundColor: "var(--navy)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                + 기사/리뷰 추가
              </button>
            </div>

            {reviewLinks.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "8px", color: "var(--ink-muted)", fontSize: "0.85rem" }}>
                등록된 언론 기사 또는 리뷰가 없습니다. '+ 기사/리뷰 추가' 버튼을 눌러 등록해보세요.
              </div>
            ) : (
              reviewLinks.map((rev, ridx) => (
                <div key={rev.id || ridx} style={{ border: "1.5px solid var(--border)", borderRadius: "8px", padding: "20px", background: "#FAF9F5" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span className="mono" style={{ fontSize: "0.7rem", fontWeight: 850, color: "var(--navy)" }}>
                      ARTICLE #{ridx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveReview(ridx)}
                      style={{ fontSize: "0.78rem", fontWeight: 800, color: "#991B1B", background: "none", border: "none", cursor: "pointer" }}
                    >
                      삭제
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
                        기사/리뷰 제목 *
                      </label>
                      <input
                        type="text"
                        value={rev.title || ""}
                        onChange={(e) => handleUpdateReview(ridx, "title", e.target.value)}
                        placeholder="예: [리뷰] 몸의 시학으로 써내려간 동시대 무용"
                        style={{ width: "100%", padding: "8px 12px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid var(--border)", background: "#FFFFFF" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
                        언론사 / 출처 (Publisher)
                      </label>
                      <input
                        type="text"
                        value={rev.publisher || ""}
                        onChange={(e) => handleUpdateReview(ridx, "publisher", e.target.value)}
                        placeholder="예: 댄스포럼, 동아일보"
                        style={{ width: "100%", padding: "8px 12px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid var(--border)", background: "#FFFFFF" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
                        발행일 (Date)
                      </label>
                      <input
                        type="text"
                        value={rev.date || ""}
                        onChange={(e) => handleUpdateReview(ridx, "date", e.target.value)}
                        placeholder="2024.05.12"
                        style={{ width: "100%", padding: "8px 12px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid var(--border)", background: "#FFFFFF" }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
                      기사 링크 URL
                    </label>
                    <input
                      type="text"
                      value={rev.url || ""}
                      onChange={(e) => handleUpdateReview(ridx, "url", e.target.value)}
                      placeholder="https://..."
                      style={{ width: "100%", padding: "8px 12px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid var(--border)", background: "#FFFFFF" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
                      기사 요약 및 주요 인용문 (Description)
                    </label>
                    <textarea
                      rows={2}
                      value={rev.description || ""}
                      onChange={(e) => handleUpdateReview(ridx, "description", e.target.value)}
                      placeholder="주요 인용구나 요약글..."
                      style={{ width: "100%", padding: "8px 12px", fontSize: "0.82rem", borderRadius: "4px", border: "1px solid var(--border)", background: "#FFFFFF" }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Tab 7: History Timeline ── */}
        {activeTab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "680px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--navy)", margin: 0 }}>
                단체 주요 연혁 (History Timeline)
              </h3>
              <button
                type="button"
                onClick={handleAddHistory}
                style={{
                  padding: "8px 16px",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  backgroundColor: "var(--navy)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                + 연혁 추가
              </button>
            </div>

            {history.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "6px", color: "var(--ink-muted)", fontSize: "0.85rem" }}>
                등록된 연혁이 없습니다. 주요 활동 및 연혁을 추가해보세요.
              </div>
            ) : (
              history.map((item, hidx) => (
                <div key={hidx} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <input
                    type="text"
                    value={item.year || ""}
                    onChange={(e) => handleUpdateHistory(hidx, "year", e.target.value)}
                    placeholder="2024"
                    style={{ width: "100px", padding: "8px 12px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid var(--border)" }}
                  />
                  <input
                    type="text"
                    value={item.event || item.title || ""}
                    onChange={(e) => handleUpdateHistory(hidx, "event", e.target.value)}
                    placeholder="서울아츠페스티벌 참가 및 정기공연 개최"
                    style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem", borderRadius: "4px", border: "1px solid var(--border)" }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveHistory(hidx)}
                    style={{ fontSize: "0.8rem", color: "#991B1B", background: "none", border: "none", cursor: "pointer" }}
                  >
                    삭제
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Tab 8: Contact & Socials ── */}
        {activeTab === "contact" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "680px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                대표 이메일 (Email)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@company.com"
                style={{ width: "100%", padding: "10px 14px", fontSize: "0.9rem", borderRadius: "6px", border: "1px solid var(--border)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                인스타그램 (Instagram URL or @handle)
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/company_official 또는 @handle"
                style={{ width: "100%", padding: "10px 14px", fontSize: "0.9rem", borderRadius: "6px", border: "1px solid var(--border)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                공식 홈페이지 (Website URL)
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.company.com"
                style={{ width: "100%", padding: "10px 14px", fontSize: "0.9rem", borderRadius: "6px", border: "1px solid var(--border)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                포트폴리오 / PDF 다운로드 링크
              </label>
              <input
                type="text"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://..."
                style={{ width: "100%", padding: "10px 14px", fontSize: "0.9rem", borderRadius: "6px", border: "1px solid var(--border)" }}
              />
            </div>
          </div>
        )}

      </div>

      {/* Floating Save Toast */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "var(--navy)",
            color: "#FFFFFF",
            padding: "10px 24px",
            borderRadius: "6px",
            fontSize: "0.85rem",
            fontWeight: 800,
            zIndex: 1200,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
