"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";
import PopokCard from "@/components/PopokCard";
import { analytics } from "@/lib/analytics";
import MotionProfile from "@/components/MotionProfile";
import YouTubeMotionPreview from "@/components/YouTubeMotionPreview";
import { getYouTubePreviewAspectRatio, isYouTubeUrl } from "@/lib/youtube";
import { isSameVideoUrl, getYouTubeEmbedUrl, isDirectVideoUrl } from "@/lib/video";
import { isVimeoUrl, getVimeoEmbedUrl } from "@/lib/videoLinks";
import { getCompanyDetailHref } from "@/lib/companyRoute";
import { toObjectArray, safeYear, getValidWorks } from "@/lib/normalize";
import {
  normalizeArtistEducation,
  normalizeArtistCurrentActivity,
  normalizeArtistAffiliations,
  normalizeArtistAwards,
  normalizeArtistCompetitions,
} from "@/lib/artist-profile";
import SendPortfolioSection from "@/components/portfolio-requests/SendPortfolioSection";
import type { PortfolioRequestViewerState } from "@/lib/portfolioRequestsServer";
import RepresentativeGallery from "@/components/RepresentativeGallery";
import { normalizeWorkImages } from "@/lib/works";

// Safe default while /api/portfolio-requests/viewer-state is loading (or if
// it ever fails) — the CTA must still mount and behave correctly for a
// logged-out viewer (click -> /auth) rather than disappear. Only a
// successful fetch can ever set isSelf/artist/existingRequestStatus to
// anything other than these "logged out" values.
const DEFAULT_PORTFOLIO_VIEWER_STATE: PortfolioRequestViewerState = {
  isLoggedIn: false,
  artist: null,
  existingRequestStatus: null,
  isSelf: false,
};

// Shared section tokens — matches app/companies/[slug]/CompanyClientView.tsx
// and its subcomponents (components/company/CompanyIdentity.tsx,
// CompanyPortfolio.tsx, CompanyHistory.tsx, CompanyContact.tsx,
// CompanyAwardsLinks.tsx) exactly, so the individual artist page reads as
// the same editorial/brochure document as the company page: no per-section
// card boxes or shadows, just a thin bottom border and consistent vertical
// rhythm between sections.
const SECTION_STYLE: CSSProperties = { padding: "50px 0", borderBottom: "1px solid var(--border)" };
const SECTION_LABEL_STYLE: CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 800,
  color: "var(--navy)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

interface WorkItem {
  id: string;
  title: string;
  year: string;
  description: string;
  role: string;
  genre?: string;
  venue?: string;
  externalLink?: string;
  image: string;
  videoUrl: string;
  credits: string;
  previewStart?: number;
  previewEnd?: number;
  previewAspectRatio?: "16 / 9" | "9 / 16";
  media?: {
    type: "youtube" | "vimeo" | "video" | "image";
    url?: string;
    src?: string;
    poster?: string;
    previewStart?: number;
    previewEnd?: number;
    aspectRatio?: "16 / 9" | "9 / 16";
  };
}

export default function ArtistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [artist, setArtist] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeWork, setActiveWork] = useState<WorkItem | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [timeStr, setTimeStr] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [portfolioViewerState, setPortfolioViewerState] = useState<PortfolioRequestViewerState>(DEFAULT_PORTFOLIO_VIEWER_STATE);
  const pathname = usePathname();

  const handleOpenWork = (work: WorkItem) => {
    setActiveImageIndex(0);
    setActiveWork(work);
  };

  useEffect(() => {
    setActiveImageIndex(0);
  }, [activeWork]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  };

  useEffect(() => {
    params.then(({ id: pid }) => setId(decodeURIComponent(pid)));
  }, [params]);

  // "포퐄 보내기" CTA state — this page is a client component (unlike the
  // company detail page, which computes this server-side), so it fetches the
  // shared viewer-state endpoint once the artist's real uuid (recordId) is
  // known. portfolioViewerState already starts as DEFAULT_PORTFOLIO_VIEWER_STATE
  // (logged-out shape) — this effect only ever upgrades it on a successful
  // response; a slow/failed fetch leaves the CTA visible in its safe default
  // state instead of unmounting it.
  useEffect(() => {
    const recordId = artist?.recordId;
    if (!recordId) return;
    fetch(`/api/portfolio-requests/viewer-state?targetType=artist&targetId=${encodeURIComponent(recordId)}`)
      .then((r) => r.json())
      .then((res) => {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[artist portfolio CTA] viewer-state response", { recordId, res });
        }
        if (res.success) setPortfolioViewerState(res.data);
        else console.error("[artist portfolio CTA] viewer-state fetch returned success:false", res);
      })
      .catch((err) => {
        console.error("[artist portfolio CTA] viewer-state fetch failed", err);
      });
  }, [artist?.recordId]);

  // Temporary dev-only visibility into why the CTA is/isn't showing —
  // remove once the report's root cause is confirmed against a real session.
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !artist) return;
    console.debug("[artist portfolio CTA] render state", {
      targetArtistId: artist.recordId || artist.id,
      targetOwnerId: artist.owner_id,
      status: artist.status,
      viewerState: portfolioViewerState,
      shouldRender: true,
    });
  }, [artist, portfolioViewerState]);

  // Load artist data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/artists/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(({ data, error: err, detail }) => {
        if (err) {
          setError(`${err}${detail ? ` (${detail})` : ""}`);
        } else {
          setArtist(data);
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(`네트워크 오류: ${String(e)}`);
        setLoading(false);
      });
  }, [id]);

  // Record a view — only after the artist has actually loaded in a real
  // browser (never during SSR/prefetch, and never for a draft/missing
  // artist, since that fetch above would have already failed). Guarded by
  // sessionStorage so repeated refreshes in the same tab/session don't
  // inflate the count; a new session or device increments again.
  // Track artist view event immediately on page load when artist is loaded
  useEffect(() => {
    if (!artist) return;
    const artistKey = artist.recordId || artist.id;
    if (!artistKey) return;
    analytics.artistViewed(artistKey, artist.name);
  }, [artist?.recordId, artist?.id]);

  // Record a view — only after the artist has actually loaded in a real
  // browser (never during SSR/prefetch, and never for a draft/missing
  // artist, since that fetch above would have already failed). Guarded by
  // sessionStorage so repeated refreshes in the same tab/session don't
  // inflate the count; a new session or device increments again.
  useEffect(() => {
    if (!artist) return;
    const artistKey = artist.recordId || artist.id;
    if (!artistKey || typeof window === "undefined") return;

    const sessionKey = `popok_artist_view_${artistKey}`;
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "1");

    fetch(`/api/artists/${encodeURIComponent(artistKey)}/view`, { method: "POST" })
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && typeof res.view_count === "number") {
          setArtist((prev: any) => (prev ? { ...prev, view_count: res.view_count } : prev));
        }
      })
      .catch(() => {
        // View-count recording must never break the detail page.
      });
  }, [artist?.recordId, artist?.id]);

  // Ticking local clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      const s = String(d.getSeconds()).padStart(2, "0");
      setTimeStr(`${h}:${m}:${s}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard Escape listener to close bottom sheet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveWork(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Keyboard Arrow navigation for active work modal carousel
  useEffect(() => {
    if (!activeWork) return;
    const images = normalizeWorkImages(activeWork);
    if (images.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeWork]);

  const handleShareUrl = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      triggerToast("포트폴리오 주소가 복사되었습니다.");
      analytics.profileShared("copy", "artist", artist?.slug || artist?.id || id);
    }
  };

  const handleDownloadQr = async () => {
    if (typeof window === "undefined") return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}`;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${artist?.name || "artist"}_POPOK_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      triggerToast("QR 코드 이미지가 저장되었습니다.");
    } catch (error) {
      console.error("QR Download failed", error);
      window.open(qrUrl, "_blank");
    }
  };

  if (loading) return (
    <div style={{ maxWidth: "800px", margin: "80px auto", textAlign: "center" }}>
      <LoadingSpinner message="아티스트 정보를 불러오는 중..." />
    </div>
  );

  if (error || !artist) return (
    <div style={{ maxWidth: "800px", margin: "80px auto", textAlign: "center" }}>
      <ErrorMessage message={error ?? "아티스트를 찾을 수 없습니다."} />
    </div>
  );

  const cleanInstagramHandle = (url: string | null) => {
    if (!url) return "@username";
    const cleaned = url.trim();
    if (cleaned.startsWith("@")) return cleaned;
    try {
      const rawPath = cleaned
        .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, "")
        .replace(/\/$/, "");
      const username = rawPath.split("/")[0].split("?")[0];
      return username ? `@${username}` : `@${artist.name}`;
    } catch (e) {
      return `@${artist.name}`;
    }
  };

  // Compile works list — only real archived pieces
  const validWorkRecords = getValidWorks<any>(artist.works ?? artist.portfolio_works);
  const displayWorks: WorkItem[] = validWorkRecords.map((w: any, idx: number) => {
    const images = normalizeWorkImages(w);
    return {
      id: w.id || `work-${idx}`,
      title: typeof w.title === "string" ? w.title.trim() : String(w.title),
      year: safeYear(w.year) || "연도미상",
      description: typeof w.description === "string" ? w.description.trim() : "",
      role: typeof w.role === "string" ? w.role.trim() : "",
      genre: typeof w.genre === "string" ? w.genre.trim() : "",
      venue: typeof w.venue === "string" ? w.venue.trim() : "",
      externalLink: typeof (w.link || w.url || w.source_url) === "string" ? (w.link || w.url || w.source_url).trim() : "",
      image: images[0] || w.image_url || "/images/placeholders/cake-placeholder.png",
      images,
      videoUrl: w.video_url || w.video || w.videoUrl || "",
      credits: typeof w.credits === "string" ? w.credits.trim() : (w.role || ""),
      previewStart: Number.isFinite(Number(w.previewStart ?? w.preview_start)) ? Number(w.previewStart ?? w.preview_start) : 0,
      previewEnd: Number.isFinite(Number(w.previewEnd ?? w.preview_end)) ? Number(w.previewEnd ?? w.preview_end) : 15,
      previewAspectRatio: w.previewAspectRatio || w.preview_aspect_ratio || w.aspectRatio || w.aspect_ratio,
      media: w.media || null,
    };
  });

  // ── Activity Timeline: current_activity + affiliations only (education,
  // awards, competitions each get their own section below). Entries with a
  // real numeric year sort newest-first; current_activity has no year field
  // in practice so it always leads at the top as "CURRENT".
  interface TimelineEntry { label: string; text: string; year: number | null; }
  const timelineEntries: TimelineEntry[] = (() => {
    const entries: TimelineEntry[] = [];
    normalizeArtistCurrentActivity(artist.current_activity).forEach((text) => {
      entries.push({ label: "CURRENT", text, year: null });
    });
    normalizeArtistAffiliations(artist.affiliations).forEach((aff) => {
      const text = aff.position ? `${aff.name} · ${aff.position}` : (aff.name as string);
      const yearNum = Number(safeYear(aff.year));
      entries.push({ label: "AFFILIATION", text, year: Number.isFinite(yearNum) && safeYear(aff.year) ? yearNum : null });
    });
    return entries;
  })();
  const timelineCurrent = timelineEntries.filter((e) => e.label === "CURRENT");
  const timelineRest = timelineEntries.filter((e) => e.label !== "CURRENT");
  const timelineDated = timelineRest.filter((e) => e.year !== null).sort((a, b) => (b.year as number) - (a.year as number));
  const timelineUndated = timelineRest.filter((e) => e.year === null);
  const activityTimeline: TimelineEntry[] = [...timelineCurrent, ...timelineDated, ...timelineUndated];

  // ── Education — plain strings in practice (no separate year/school/major
  // fields), so each entry is rendered as-is, original order preserved.
  const educationList = normalizeArtistEducation(artist.education);

  // ── Awards & Competitions — shared shape via lib/artist-profile.ts
  // (normalizeArtistAwards/normalizeArtistCompetitions), then dedupe by
  // (year, title, org) and sort newest-first when a real year exists,
  // otherwise keep original order — this dedupe/sort is display-only and
  // deliberately not part of the shared normalizer (the edit dashboard
  // needs the user's own original, non-deduped order preserved).
  interface AwardLike { year?: string | number; title?: string; result?: string; organization?: string; }
  function sortAndDedupeAwardList(raw: AwardLike[]): AwardLike[] {
    const seen = new Set<string>();
    const deduped: AwardLike[] = [];
    for (const item of raw) {
      const key = `${safeYear(item.year)}|${(item.title || "").trim().toLowerCase()}|${(item.organization || "").trim().toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }
    const withYear = deduped.filter((item) => Number.isFinite(Number(safeYear(item.year))) && safeYear(item.year));
    const withoutYear = deduped.filter((item) => !(Number.isFinite(Number(safeYear(item.year))) && safeYear(item.year)));
    withYear.sort((a, b) => Number(safeYear(b.year)) - Number(safeYear(a.year)));
    return [...withYear, ...withoutYear];
  }
  const awardsList = sortAndDedupeAwardList(normalizeArtistAwards(artist.awards));
  const competitionsList = sortAndDedupeAwardList(normalizeArtistCompetitions(artist.competitions));
  const combinedAwardsCount = awardsList.length + competitionsList.length;
  const splitAwardsAndCompetitions = combinedAwardsCount > 6;

  // ── Reviews & Articles — review_links, not the legacy `reviews` shape.
  interface ReviewLike { title?: string; publication?: string; date?: string; year?: string | number; work?: string; url?: string; label?: string; }
  const reviewItems = toObjectArray<ReviewLike>(artist.review_links);
  function getReviewDomain(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  }

  // ── Contact Info — priority-ordered, deduped, capped at 3.
  interface ContactCandidate { label: string; href: string; }
  function normalizeHref(raw: string): string {
    const trimmed = raw.trim();
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("mailto:")) return trimmed;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return `mailto:${trimmed}`;
    return `https://${trimmed}`;
  }
  function dedupeKey(href: string): string {
    return href.replace(/^mailto:/, "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").toLowerCase();
  }
  const contactCandidates: ContactCandidate[] = (() => {
    const list: ContactCandidate[] = [];
    if (artist.instagram) list.push({ label: cleanInstagramHandle(artist.instagram), href: normalizeHref(artist.instagram) });
    if (artist.website) list.push({ label: artist.website.replace(/^https?:\/\//, ""), href: normalizeHref(artist.website) });
    if (artist.portfolio_url) list.push({ label: "Portfolio", href: normalizeHref(artist.portfolio_url) });
    if (artist.email) list.push({ label: artist.email, href: `mailto:${artist.email}` });
    if (artist.youtube_url) list.push({ label: "YouTube", href: normalizeHref(artist.youtube_url) });
    toObjectArray<{ url?: string; label?: string }>(artist.links).forEach((link) => {
      if (typeof link.url === "string" && link.url.trim()) {
        list.push({ label: link.label || getReviewDomain(link.url), href: normalizeHref(link.url) });
      }
    });

    const seen = new Set<string>();
    const deduped: ContactCandidate[] = [];
    for (const item of list) {
      const key = dedupeKey(item.href);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }
    return deduped.slice(0, 3);
  })();

  // Motion profile video comes ONLY from motion_video_url (1순위: artist.motion_video_url)
  const representativeVideoUrl: string = artist.motion_video_url || "";

  const englishName = artist.name_en || (artist.name ? artist.name.toUpperCase() : "CREATIVE");
  const tags = Array.isArray(artist.tags) ? artist.tags : [artist.field, artist.genre].filter(Boolean);

  const getCoordinates = () => {
    let hash = 0;
    for (let i = 0; i < artist.id.length; i++) {
      hash = artist.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lat = (37.5665 + (hash % 100) / 1000).toFixed(4);
    const lng = (126.978 + (Math.abs(hash) % 100) / 1000).toFixed(4);
    return `${lat}° N, ${lng}° E`;
  };

  const parsedActiveMedia = activeWork ? (() => {
    if (activeWork.media && typeof activeWork.media === "object") {
      return {
        ...activeWork.media,
        previewStart: activeWork.media.previewStart ?? activeWork.previewStart ?? 0,
        previewEnd: activeWork.media.previewEnd ?? activeWork.previewEnd ?? 15,
        aspectRatio: activeWork.media.aspectRatio ?? activeWork.previewAspectRatio,
      };
    }
    const videoUrl = activeWork.videoUrl || "";
    if (videoUrl.trim()) {
      const url = videoUrl.trim();
      if (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("youtube-nocookie.com")) {
        return {
          type: "youtube" as const,
          url,
          previewStart: activeWork.previewStart ?? 0,
          previewEnd: activeWork.previewEnd ?? 15,
          aspectRatio: activeWork.previewAspectRatio,
        };
      }
      if (url.includes("vimeo.com")) {
        return { type: "vimeo" as const, url };
      }
      if (url.endsWith(".mp4") || url.includes("/media/") || url.includes("/motion/")) {
        return { type: "video" as const, src: url, poster: activeWork.image };
      }
    }
    return { type: "image" as const, src: activeWork.image };
  })() : null;

  return (
    <div style={{ background: "var(--bg-warm)", minHeight: "100vh", paddingBottom: "100px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .artist-detail-container {
          max-width: 1040px;
          margin: 0 auto;
          padding: 40px 24px;
        }
        .works-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          column-gap: 24px;
          row-gap: 32px;
        }
        .work-tile {
          cursor: pointer;
        }
        .work-tile-image-wrapper {
          position: relative;
          aspect-ratio: 1.4;
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--border);
          background-color: #FAF8F5;
        }
        .work-tile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .work-tile:hover .work-tile-image {
          transform: scale(1.03);
        }
        .work-tile:hover .work-tile-title {
          text-decoration: underline;
        }
        @media (max-width: 1024px) {
          .works-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            column-gap: 20px !important;
            row-gap: 28px !important;
          }
        }
        @media (max-width: 640px) {
          .works-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .artist-detail-container {
            padding: 24px 16px !important;
          }
          .education-row, .award-row {
            grid-template-columns: 1fr !important;
            gap: 4px !important;
          }
        }
        .connected-org-card:hover {
          background: #F0EDE4 !important;
        }
        .press-link:hover {
          text-decoration: underline !important;
        }
        .artist-work-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(23, 20, 17, 0.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          padding: 40px 20px;
        }
        .artist-drawer-main {
          width: 640px;
          max-width: 100%;
          height: auto;
          max-height: 88vh;
          background-color: #FFFFFF;
          box-shadow: 0 20px 50px rgba(23, 20, 17, 0.2);
          border-radius: 10px;
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          position: relative;
        }
        @media (max-width: 768px) {
          .artist-work-modal-backdrop {
            padding: 0 !important;
            align-items: flex-end !important;
          }
          .artist-drawer-main {
            width: 100% !important;
            max-width: 100% !important;
            height: 90vh !important;
            max-height: 90vh !important;
            border-radius: 16px 16px 0 0 !important;
          }
        }
      ` }} />
      
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: "fixed", bottom: "30px", left: "50%", transform: "translateX(-50%)",
          background: "var(--navy)", color: "#FFFFFF", padding: "10px 24px", borderRadius: "30px",
          fontSize: "0.85rem", fontWeight: 700, zIndex: 1000, boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          animation: "fadeIn 0.2s ease"
        }}>
          {toastMsg}
        </div>
      )}

      {/* Dynamic Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(245,241,232,0.92)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{
          maxWidth: "1040px", margin: "0 auto", padding: "0 24px", height: "56px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ fontWeight: 900, fontSize: "1.3rem", color: "var(--navy)", letterSpacing: "-0.04em", display: "flex", alignItems: "center", gap: "2px" }}>
              POPOK
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
            </div>
          </Link>
          <div style={{ display: "flex", gap: "16px" }}>
            <Link href="/artists" style={{ textDecoration: "none", fontSize: "0.85rem", fontWeight: 700, color: "var(--navy)" }}>
              Artists
            </Link>
            <Link href="/onboarding" style={{ textDecoration: "none", fontSize: "0.85rem", fontWeight: 700, color: "var(--ink-muted)" }}>
              Register
            </Link>
          </div>
        </div>
      </header>

      <div className="artist-detail-container">

        {/* Back Link — returns to whichever /artists filter view the user came from */}
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/artists");
            }
          }}
          style={{
            background: "none", border: "none", padding: 0, cursor: "pointer",
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px",
            color: "var(--ink-muted)", fontSize: "0.8rem", fontWeight: 700, marginBottom: "32px"
          }}
        >
          ← 아티스트 둘러보기
        </button>

        {/* ──────────────── 1. MOTION PROFILE (Reels-like vertical preview - TOP) ──────────────── */}
        <section style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "60px" }}>
          <div style={{ maxWidth: "600px", width: "100%", textAlign: "center", marginBottom: "24px" }}>
            <span className="mono" style={{ fontSize: "0.72rem", color: "var(--accent-dark)", fontWeight: 850, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Motion Profile Preview
            </span>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--navy)", marginTop: "4px", letterSpacing: "-0.02em" }}>
              15초 모션 프로필 미리보기
            </h3>
          </div>

          <MotionProfile
            name={artist.name}
            genre={artist.genre}
            image={artist.profile_image_url || (Array.isArray(artist.profile_image_urls) && artist.profile_image_urls[0]) || artist.profileImage || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(artist.name)}`}
            quote={artist.bio_short}
            videoUrl={representativeVideoUrl}
          />
        </section>

        {/* ──────────────── 2. ABOUT / PROFILE (Mock web window framework) ──────────────── */}
        <section style={{
          background: "#FFFFFF",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 12px 32px rgba(23, 20, 17, 0.03)",
          marginBottom: "60px"
        }}>
          {/* Mock Browser Header */}
          <div style={{
            background: "#FAF8F5",
            borderBottom: "1px solid var(--border)",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            position: "relative"
          }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EAE6DD" }} />
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EAE6DD" }} />
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EAE6DD" }} />
            <div style={{
              margin: "0 auto", background: "#FFFFFF", border: "1px solid var(--border)",
              borderRadius: "4px", fontSize: "0.7rem", color: "var(--ink-muted)",
              padding: "2px 24px", fontFamily: "monospace"
            }}>
              popok.kr/artists/{artist.id}
            </div>
          </div>

          {/* Browser Content */}
          <div style={{ padding: "40px 32px" }}>
            
            {/* 3-Column Info Rows */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "36px",
              borderBottom: "1px solid var(--border)",
              paddingBottom: "36px",
              marginBottom: "32px"
            }}>
              {/* Col 1: Connected Organization */}
              <div style={{ minWidth: 0 }}>
                <span className="mono" style={{ fontSize: "0.62rem", color: "var(--ink-faint)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
                  CONNECTED ORGANIZATION
                </span>
                {artist.connectedCompany ? (
                  <Link
                    href={getCompanyDetailHref(artist.connectedCompany.company.slug || artist.connectedCompany.company.id)}
                    className="connected-org-card"
                    style={{
                      display: "flex", gap: "10px", alignItems: "center", textDecoration: "none",
                      padding: "10px", borderRadius: "4px", border: "1px solid var(--border)",
                      background: "#FAF8F5", transition: "background 0.15s ease", minWidth: 0,
                    }}
                  >
                    <img
                      src={artist.connectedCompany.company.profile_image_url || "/images/placeholders/cake-placeholder.png"}
                      alt={artist.connectedCompany.company.name}
                      style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, fontSize: "0.88rem", color: "var(--navy)", overflowWrap: "break-word", wordBreak: "keep-all" }}>
                          {artist.connectedCompany.company.name}
                        </span>
                        {artist.connectedCompany.company.verified && (
                          <span style={{ fontSize: "0.56rem", fontWeight: 800, color: "var(--navy)", background: "var(--accent)", padding: "2px 6px", borderRadius: "7px", whiteSpace: "nowrap" }}>
                            POPOK VERIFIED
                          </span>
                        )}
                      </div>
                      {artist.connectedCompany.company.name_en && (
                        <span className="mono" style={{ fontSize: "0.6rem", color: "var(--ink-faint)", display: "block" }}>
                          {artist.connectedCompany.company.name_en}
                        </span>
                      )}
                      <div style={{ fontSize: "0.7rem", color: "var(--ink-muted)", marginTop: "2px" }}>
                        {[artist.connectedCompany.role, artist.connectedCompany.company.genre, artist.connectedCompany.company.city_or_region].filter(Boolean).join(" · ")}
                      </div>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--accent-dark)", display: "block", marginTop: "4px" }}>
                        단체 포퐄 보기 →
                      </span>
                    </div>
                  </Link>
                ) : artist.company ? (
                  <Link
                    href={`/organizations/apply?orgName=${encodeURIComponent(artist.company)}`}
                    className="connected-org-card"
                    style={{
                      display: "flex", gap: "10px", alignItems: "center", textDecoration: "none",
                      padding: "10px", borderRadius: "4px", border: "1px dashed var(--border-dark)",
                      background: "#FAF8F5", transition: "background 0.15s ease", minWidth: 0,
                    }}
                  >
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "4px", background: "var(--bg-warm)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0,
                    }}>
                      🏢
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: "0.88rem", color: "var(--navy)", overflowWrap: "break-word", wordBreak: "keep-all" }}>
                        {artist.company}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--ink-muted)", marginTop: "2px" }}>
                        아직 POPOK 등록 전
                      </div>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--accent-dark)", display: "block", marginTop: "4px" }}>
                        단체 포퐄 등록하기 →
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div>
                    <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--navy)", margin: 0 }}>
                      Independent Artist
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "4px" }}>
                      현재 연결된 단체가 없습니다.
                    </p>
                  </div>
                )}
              </div>

              {/* Col 2: About Me */}
              <div>
                <span className="mono" style={{ fontSize: "0.62rem", color: "var(--ink-faint)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
                  ABOUT ME
                </span>
                <p style={{ fontSize: "0.85rem", color: "var(--navy)", lineHeight: 1.6, whiteSpace: "pre-line", margin: 0 }}>
                  {artist.bio || artist.bio_short || "POPOK 아티스트 레지스트리에 정식 등록된 창작자입니다. 흩어져 있는 활동과 기록을 수집하여 포트폴리오를 구성해 나가는 여정에 있습니다."}
                </p>
              </div>

              {/* Col 3: Contact Info */}
              <div>
                <span className="mono" style={{ fontSize: "0.62rem", color: "var(--ink-faint)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
                  CONTACT INFO
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem" }}>
                  {contactCandidates.length > 0 ? (
                    contactCandidates.map((c, idx) => (
                      <a
                        key={idx}
                        href={c.href}
                        target={c.href.startsWith("mailto:") ? undefined : "_blank"}
                        rel="noopener noreferrer"
                        style={{
                          color: "var(--navy)",
                          fontWeight: 700,
                          textDecoration: "none",
                          overflowWrap: "break-word",
                          wordBreak: "break-all",
                        }}
                      >
                        {c.label} ↗
                      </a>
                    ))
                  ) : (
                    <span style={{ color: "var(--ink-muted)", fontSize: "0.75rem" }}>
                      등록된 연락처 정보가 없습니다.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* View count — small and unobtrusive, right below profile info */}
            <div style={{ textAlign: "right", marginBottom: "8px" }}>
              <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-faint)", fontWeight: 700 }}>
                조회수 {(artist.view_count ?? 0).toLocaleString("ko-KR")}회
              </span>
            </div>

            {/* Typography Overlay Banner */}
            <div style={{ position: "relative", textAlign: "center", padding: "20px 0", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <h2 className="display" style={{ fontSize: "clamp(2rem, 8vw, 5.5rem)", color: "rgba(23,20,17,0.03)", textTransform: "uppercase", fontWeight: 900, margin: 0 }}>
                {englishName}
              </h2>
              {/* Absolute tag overlay */}
              <div style={{ position: "absolute", display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", pointerEvents: "none" }}>
                {tags.map((tag: string, idx: number) => (
                  <span
                    key={tag}
                    className="tag"
                    style={{
                      transform: idx % 2 === 0 ? "rotate(-2deg)" : "rotate(3deg)",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      background: idx % 2 === 0 ? "var(--accent)" : "var(--navy)",
                      color: idx % 2 === 0 ? "var(--navy)" : "#FFFFFF",
                      border: "none",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Name & basic info — compact, readable line under the watermark;
                blank fields are skipped entirely rather than left as empty dots. */}
            <div style={{
              display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "center",
              gap: "8px", marginTop: "12px", textAlign: "center",
            }}>
              <span style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--navy)" }}>{artist.name}</span>
              {artist.name_en && (
                <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>{artist.name_en}</span>
              )}
              {artist.verified && (
                <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "var(--navy)", background: "var(--accent)", padding: "2px 7px", borderRadius: "8px" }}>
                  POPOK VERIFIED
                </span>
              )}
              {[artist.role, artist.genre, artist.category, artist.city_or_region].filter(Boolean).length > 0 && (
                <span className="mono" style={{ fontSize: "0.7rem", color: "var(--accent-dark)", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  {[artist.role, artist.genre, artist.category, artist.city_or_region].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>

          </div>
        </section>

        {/* ── REPRESENTATIVE GALLERY (Unconditional, returns null if empty) ── */}
        <RepresentativeGallery images={artist.profile_image_urls} />

        {/* ── 2.5. VIDEO PROFILE (Additional Video Section) ── */}
        {artist.youtube_url && (
          <section style={{ ...SECTION_STYLE, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ maxWidth: "600px", width: "100%", textAlign: "center", marginBottom: "24px" }}>
              <span className="mono" style={{ fontSize: "0.72rem", color: "var(--accent-dark)", fontWeight: 850, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                Video Profile
              </span>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--navy)", marginTop: "4px", letterSpacing: "-0.02em" }}>
                소개 및 하이라이트 영상
              </h3>
            </div>

            <div style={{
              width: "100%",
              maxWidth: "720px",
              aspectRatio: "16 / 9",
              background: "#171411",
              borderRadius: "20px",
              border: "2px solid var(--navy)",
              boxShadow: "0 20px 40px rgba(23, 20, 17, 0.15)",
              overflow: "hidden",
            }}>
              {(() => {
                const url = artist.youtube_url;
                const isYt = isYouTubeUrl(url);
                const isVim = isVimeoUrl(url);
                const isDirect = isDirectVideoUrl(url);

                if (isYt) {
                  const ytEmbed = getYouTubeEmbedUrl(url);
                  return (
                    <iframe
                      src={ytEmbed ? `${ytEmbed}?autoplay=0&controls=1&rel=0` : ""}
                      style={{ width: "100%", height: "100%", border: 0 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="YouTube video player"
                    />
                  );
                } else if (isVim) {
                  const vimEmbed = getVimeoEmbedUrl(url, false);
                  return (
                    <iframe
                      src={vimEmbed || ""}
                      style={{ width: "100%", height: "100%", border: 0 }}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title="Vimeo video player"
                    />
                  );
                } else if (isDirect) {
                  return (
                    <video
                      src={url}
                      controls
                      playsInline
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  );
                }
                return (
                  <div style={{ display: "flex", alignItems: "center", justifyItems: "center", height: "100%", color: "#999", padding: "20px", textAlign: "center" }}>
                    재생할 수 없는 영상 주소입니다.
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {/* ──────────────── 3. ACTIVITY TIMELINE — current_activity + affiliations only ──────────────── */}
        {activityTimeline.length > 0 && (
          <section style={SECTION_STYLE}>
            <h3 className="mono" style={{ ...SECTION_LABEL_STYLE, marginBottom: "24px" }}>
              Activity Timeline
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", borderLeft: "1px solid var(--border)", paddingLeft: "16px", marginLeft: "4px" }}>
              {activityTimeline.map((entry, idx) => (
                <div key={idx} style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute", left: "-20px", top: "6px", width: "5px", height: "5px",
                    borderRadius: "50%", background: "var(--accent-dark)"
                  }} />
                  <span className="mono" style={{ fontSize: "0.62rem", color: "var(--ink-faint)", fontWeight: 800, letterSpacing: "0.05em", display: "block", marginBottom: "3px" }}>
                    {entry.year ? `${entry.year} · ${entry.label}` : entry.label}
                  </span>
                  <p style={{ fontSize: "0.85rem", color: "var(--navy)", fontWeight: 600, margin: 0, lineHeight: 1.45 }}>
                    {entry.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ──────────────── 4. SELECTED WORKS — flat editorial grid, whole-tile click ──────────────── */}
        <section style={SECTION_STYLE}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "28px" }}>
            <h3 className="mono" style={SECTION_LABEL_STYLE}>
              Selected Works
            </h3>
            <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>
              {displayWorks.length} WORKS ARCHIVED
            </span>
          </div>

          {displayWorks.length === 0 ? (
            <div style={{ padding: "50px 24px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "4px", color: "var(--ink-muted)", fontSize: "0.82rem" }}>
              등록된 작품 포트폴리오가 없습니다.
            </div>
          ) : (
            <div className="works-grid">
              {displayWorks.map((work) => (
                <div
                  key={work.id}
                  className="work-tile"
                  onClick={() => setActiveWork(work)}
                  style={{ display: "flex", flexDirection: "column", height: "100%" }}
                >
                  {/* Image */}
                  <div className="work-tile-image-wrapper">
                    {work.image && !work.image.includes("cake-placeholder") ? (
                      <img
                        src={work.image}
                        alt={work.title}
                        className="work-tile-image"
                      />
                    ) : (
                      /* Same "no image" placeholder treatment as the Company Detail portfolio grid */
                      <div style={{
                        width: "100%", height: "100%", display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", background: "#FAF8F5", gap: "8px",
                      }}>
                        <span style={{
                          fontWeight: 950, fontSize: "1rem", color: "var(--navy)", letterSpacing: "-0.04em",
                          display: "flex", alignItems: "center", gap: "2px"
                        }}>
                          POPOK
                          <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
                        </span>
                        <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          준비중
                        </span>
                      </div>
                    )}

                    <span style={{
                      position: "absolute", top: "10px", right: "10px", background: "var(--navy)",
                      color: "#FFFFFF", padding: "3px 8px", borderRadius: "2px", fontSize: "0.62rem",
                      fontWeight: 700, zIndex: 1
                    }}>
                      {work.year}
                    </span>
                  </div>

                  {/* Caption */}
                  <div style={{ paddingTop: "12px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <div className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-faint)", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase" }}>
                      {(work.role || work.genre) && (
                        <span style={{ fontWeight: 700, color: "var(--accent-dark)" }}>
                          {[work.role, work.genre].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      {work.venue && <span>· {work.venue}</span>}
                    </div>
                    <h4 style={{
                      fontSize: "0.95rem", fontWeight: 800, color: "var(--navy)", margin: "4px 0 2px",
                      letterSpacing: "-0.01em", lineHeight: 1.35,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {work.title}
                    </h4>
                    {work.description && (
                      <p style={{
                        fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.5, margin: "2px 0 0",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
                      }}>
                        {work.description}
                      </p>
                    )}

                    <div style={{ marginTop: "auto", paddingTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                      <button
                        type="button"
                        onClick={() => setActiveWork(work)}
                        className="work-tile-title"
                        style={{
                          background: "none", border: "none", padding: 0, cursor: "pointer",
                          fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)",
                          display: "inline-flex", alignItems: "center", gap: "4px",
                        }}
                      >
                        View Detail <span>→</span>
                      </button>
                      {work.externalLink && (
                        <a
                          href={work.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-muted)", textDecoration: "none" }}
                        >
                          외부 링크 ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ──────────────── 5. EDUCATION — plain strings, no separate year/school/major fields ──────────────── */}
        {educationList.length > 0 && (
          <section style={SECTION_STYLE}>
            <h3 className="mono" style={{ ...SECTION_LABEL_STYLE, marginBottom: "24px" }}>
              Education
            </h3>
            <div className="education-list" style={{ display: "flex", flexDirection: "column" }}>
              {educationList.map((entry, idx) => (
                <div
                  key={idx}
                  className="education-row"
                  style={{
                    display: "grid", gridTemplateColumns: "40px 1fr", gap: "16px",
                    padding: "14px 0", borderTop: idx > 0 ? "1px solid var(--border-light)" : "none",
                  }}
                >
                  <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-faint)", fontWeight: 700 }}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <p style={{ fontSize: "0.85rem", color: "var(--navy)", fontWeight: 600, margin: 0, lineHeight: 1.5, overflowWrap: "break-word", wordBreak: "keep-all" }}>
                    {entry}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ──────────────── 6. AWARDS & COMPETITIONS ──────────────── */}
        {combinedAwardsCount > 0 && (
          <section style={SECTION_STYLE}>
            <h3 className="mono" style={{ ...SECTION_LABEL_STYLE, marginBottom: "24px" }}>
              {splitAwardsAndCompetitions ? "Awards" : "Awards & Competitions"}
            </h3>
            <AwardRows items={splitAwardsAndCompetitions ? awardsList : [...awardsList, ...competitionsList]} />

            {splitAwardsAndCompetitions && competitionsList.length > 0 && (
              <>
                <h3 className="mono" style={{ ...SECTION_LABEL_STYLE, margin: "36px 0 24px" }}>
                  Competitions
                </h3>
                <AwardRows items={competitionsList} />
              </>
            )}
          </section>
        )}

        {/* ──────────────── 7. REVIEWS & ARTICLES — review_links, flat list ──────────────── */}
        {reviewItems.length > 0 && (
          <section style={SECTION_STYLE}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px" }}>
              <h3 className="mono" style={SECTION_LABEL_STYLE}>
                Reviews & Articles
              </h3>
              <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-faint)" }}>
                {reviewItems.length} ITEMS
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {reviewItems.map((rev, idx) => {
                const url = typeof rev.url === "string" ? rev.url.trim() : "";
                const title = rev.title || rev.publication || (url ? getReviewDomain(url) : "관련 자료");
                const subtitle = [rev.work, rev.publication && rev.title ? rev.publication : null, rev.date || (rev.year ? safeYear(rev.year) : null)]
                  .filter(Boolean)
                  .join(" · ") || "관련 평론 및 언론 보도";

                const row = (
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 0", borderTop: idx > 0 ? "1px solid var(--border-light)" : "none",
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--navy)", overflowWrap: "break-word" }}>
                        {title}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                        {subtitle}
                      </span>
                    </div>
                    {url && (
                      <span style={{
                        fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)",
                        whiteSpace: "nowrap", flexShrink: 0, marginLeft: "12px",
                      }}>
                        Read ↗
                      </span>
                    )}
                  </div>
                );

                return url ? (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press-link"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {row}
                  </a>
                ) : (
                  <div key={idx}>{row}</div>
                );
              })}
            </div>
          </section>
        )}

        {/* ──────────────── 9. DIGITAL CARD & SHARE ──────────────── */}
        <section style={{ ...SECTION_STYLE, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-faint)", fontWeight: 800, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
            DIGITAL CARD & QR
          </span>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--navy)", margin: 0, marginBottom: "6px" }}>
            {artist.name} 작가의 명함을 공유해보세요
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", marginTop: 0, marginBottom: "28px" }}>
            카드에 마우스를 올리거나 클릭하면 뒷면 QR 코드를 스캔할 수 있습니다.
          </p>

          {/* Visual 3D Flippable Digital Business Card */}
          <div style={{ marginBottom: "28px", width: "100%", display: "flex", justifyContent: "center" }}>
            <PopokCard
              name={artist.name}
              nameEn={artist.name_en || undefined}
              genre={artist.genre}
              instagram={artist.instagram}
              id={String(artist.recordId || artist.id || "")}
              slug={artist.slug || artist.id || id}
              profileImage={artist.profile_image_url || undefined}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
            <button
              onClick={handleShareUrl}
              style={{
                padding: "11px 22px", borderRadius: "4px", border: "1px solid var(--navy)",
                background: "transparent", color: "var(--navy)", fontSize: "0.78rem", fontWeight: 800,
                textTransform: "uppercase", letterSpacing: "0.03em", cursor: "pointer",
              }}
            >
              Copy URL
            </button>
            <button
              onClick={handleDownloadQr}
              style={{
                padding: "11px 22px", borderRadius: "4px", border: "1px solid var(--navy)",
                background: "transparent", color: "var(--navy)", fontSize: "0.78rem", fontWeight: 800,
                textTransform: "uppercase", letterSpacing: "0.03em", cursor: "pointer",
              }}
            >
              Save QR
            </button>
          </div>
        </section>

        {/* ──────────────── 10. FOOTER METRICS ──────────────── */}
        <footer style={{
          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "20px",
          padding: "24px 0",
          fontSize: "0.72rem", color: "var(--ink-faint)", fontFamily: "monospace"
        }}>
          <div style={{ display: "flex", gap: "16px" }}>
            <span>LOC: SEOUL, KR</span>
            <span>{getCoordinates()}</span>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#C8EE52", display: "inline-block" }} />
            <span>TIME: {timeStr || "00:00:00"}</span>
          </div>
        </footer>

      </div>

      {/* ──────────────── 8. WORK DETAIL MODAL ──────────────── */}
      {activeWork && parsedActiveMedia && (
        <div className="artist-work-modal-backdrop" onClick={() => setActiveWork(null)}>
          <div className="artist-drawer-main" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                position: "sticky",
                top: 0,
                backgroundColor: "rgba(255,255,255,0.96)",
                backdropFilter: "blur(8px)",
                padding: "16px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                zIndex: 10,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <span className="mono" style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--accent-dark)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                  {[activeWork.role, activeWork.genre].filter(Boolean).join(" · ") || "WORK ARCHIVE"}
                </span>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 950, color: "var(--navy)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>
                  {activeWork.title}
                </h3>
              </div>
              <button onClick={() => setActiveWork(null)} style={{ border: "none", background: "none", fontSize: "1.6rem", fontWeight: 300, cursor: "pointer", color: "var(--ink-muted)", padding: "4px 8px", lineHeight: 1 }}>
                ×
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Media Section */}
              {(() => {
                const workImages = normalizeWorkImages(activeWork);
                return (
                  <div style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: parsedActiveMedia.type === "youtube"
                      ? ((parsedActiveMedia as any).aspectRatio || getYouTubePreviewAspectRatio(parsedActiveMedia.url || ""))
                      : (parsedActiveMedia.type === "vimeo" || parsedActiveMedia.type === "video") ? "16 / 9" : "1.6",
                    backgroundColor: "#171411",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    userSelect: "none",
                  }}>
                    {parsedActiveMedia.type === "youtube" && isYouTubeUrl(parsedActiveMedia.url || "") ? (
                      <iframe
                        src={getYouTubeEmbedUrl(parsedActiveMedia.url || "") ? `${getYouTubeEmbedUrl(parsedActiveMedia.url || "")}?autoplay=0&controls=1&rel=0` : ""}
                        style={{ width: "100%", height: "100%", border: 0 }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={activeWork.title}
                      />
                    ) : parsedActiveMedia.type === "vimeo" && getVimeoEmbedUrl(parsedActiveMedia.url || "") ? (
                      <iframe
                        src={getVimeoEmbedUrl(parsedActiveMedia.url || "") || ""}
                        style={{ width: "100%", height: "100%", border: 0 }}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title={activeWork.title}
                      />
                    ) : parsedActiveMedia.type === "video" && parsedActiveMedia.src ? (
                      <video
                        src={parsedActiveMedia.src}
                        poster={parsedActiveMedia.poster || activeWork.image}
                        controls
                        playsInline
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : workImages.length > 0 ? (
                      <>
                        <img
                          src={workImages[activeImageIndex] || workImages[0]}
                          alt={`${activeWork.title} ${activeImageIndex + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />

                        {workImages.length > 1 && (
                          <>
                            {/* Prev Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIndex((prev) => (prev === 0 ? workImages.length - 1 : prev - 1));
                              }}
                              aria-label="이전 이미지"
                              style={{
                                position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                                width: "36px", height: "36px", borderRadius: "50%",
                                backgroundColor: "rgba(23, 20, 17, 0.75)", color: "#FFFFFF",
                                border: "1px solid rgba(255, 255, 255, 0.25)", backdropFilter: "blur(4px)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", fontSize: "1.3rem", lineHeight: 1, zIndex: 5,
                              }}
                            >
                              ‹
                            </button>

                            {/* Next Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIndex((prev) => (prev === workImages.length - 1 ? 0 : prev + 1));
                              }}
                              aria-label="다음 이미지"
                              style={{
                                position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                                width: "36px", height: "36px", borderRadius: "50%",
                                backgroundColor: "rgba(23, 20, 17, 0.75)", color: "#FFFFFF",
                                border: "1px solid rgba(255, 255, 255, 0.25)", backdropFilter: "blur(4px)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", fontSize: "1.3rem", lineHeight: 1, zIndex: 5,
                              }}
                            >
                              ›
                            </button>

                            {/* Counter Badge */}
                            <span className="mono" style={{
                              position: "absolute", bottom: "12px", right: "12px",
                              background: "rgba(23, 20, 17, 0.75)", color: "#FFFFFF",
                              padding: "3px 8px", borderRadius: "10px", fontSize: "0.68rem",
                              fontWeight: 700, backdropFilter: "blur(4px)", zIndex: 5,
                            }}>
                              {activeImageIndex + 1} / {workImages.length}
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <div style={{
                        width: "100%", height: "100%", display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", background: "#FAF8F5", gap: "10px"
                      }}>
                        <span style={{
                          fontWeight: 950, fontSize: "1.5rem", color: "var(--navy)", letterSpacing: "-0.04em",
                          display: "flex", alignItems: "center", gap: "2px"
                        }}>
                          POPOK
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
                        </span>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          준비중
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Meta Info & Description */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span className="mono" style={{ fontSize: "0.8rem", color: "var(--ink-muted)", fontWeight: 700 }}>
                    {activeWork.year}
                  </span>
                  {activeWork.venue && (
                    <span className="mono" style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>
                      · {activeWork.venue}
                    </span>
                  )}
                  {activeWork.role && (
                    <span className="tag" style={{ background: "var(--accent)", color: "var(--navy)", border: "none", fontSize: "0.65rem", fontWeight: 800 }}>
                      {activeWork.role}
                    </span>
                  )}
                </div>

                {activeWork.description && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span className="mono" style={{ fontSize: "0.62rem", color: "var(--ink-faint)", fontWeight: 700, letterSpacing: "0.05em" }}>
                      PROJECT DESCRIPTION
                    </span>
                    <p style={{ fontSize: "0.85rem", color: "var(--navy)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
                      {activeWork.description}
                    </p>
                  </div>
                )}

                {activeWork.credits && (
                  <div style={{
                    display: "flex", flexDirection: "column", gap: "6px", background: "#FAF8F5",
                    border: "1px solid var(--border)", padding: "16px", borderRadius: "8px"
                  }}>
                    <span className="mono" style={{ fontSize: "0.62rem", color: "var(--ink-faint)", fontWeight: 700, letterSpacing: "0.05em" }}>
                      CREDITS / CONTRIBUTORS
                    </span>
                    <p style={{ fontSize: "0.78rem", color: "var(--navy)", fontWeight: 700, fontFamily: "monospace", margin: 0, lineHeight: 1.45 }}>
                      {activeWork.credits}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button Footer */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>
                  ID: {activeWork.id}
                </span>
                {(activeWork.videoUrl || activeWork.externalLink) ? (
                  <a
                    href={activeWork.videoUrl || activeWork.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "10px 20px", borderRadius: "20px", background: "var(--navy)",
                      color: "#FFFFFF", fontSize: "0.8rem", fontWeight: 800, textDecoration: "none",
                      display: "inline-flex", alignItems: "center", gap: "4px"
                    }}
                  >
                    {activeWork.videoUrl ? "Watch Video ↗" : "외부 링크 ↗"}
                  </a>
                ) : (
                  <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontFamily: "monospace" }}>
                    No External Link
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 포퐄 보내기 CTA — was previously nested inside the
          `{activeWork && parsedActiveMedia && (...)}` work-detail bottom
          sheet fragment above, which only renders after a viewer clicks
          into a specific work. That meant this section never mounted
          during normal browsing at all (true for every viewer state,
          including logged-out), regardless of the viewer-state fetch or
          isSelf logic. It now sits at the top level of the page so it
          always mounts once the artist record has loaded. `artist.status`
          is not gated further here — /api/artists/[id] (via
          getArtistById/getArtistBySlug in lib/artists.ts) does not filter
          by status at all, so a viewer already looking at this page has
          already been served the artist regardless of status; the DB
          default is also `status || "published"`. The viewer's own
          profile is hidden via isSelf inside SendPortfolioSection, not
          here. portfolioViewerState always has a value (defaults to the
          logged-out shape) — never gated on it being "loaded" first, so a
          slow/failed fetch can no longer hide this entire section.
          Rendered directly (no wrapping container div) so it lays out
          exactly like on the company page — SendPortfolioSection already
          centers its own content at 1040px internally. */}
      <SendPortfolioSection
        target={{ type: "artist", id: artist.recordId || artist.id, name: artist.name, imageUrl: artist.profile_image_url || artist.profileImage || null }}
        viewerState={portfolioViewerState}
        currentPath={pathname}
        onToast={triggerToast}
      />

    </div>
  );
}

interface AwardLike { year?: string | number; title?: string; result?: string; organization?: string; }

// Desktop: year left / details right. Mobile: stacked (see .award-row rule
// in the page's <style> block). Blank fields are simply omitted.
function AwardRows({ items }: { items: AwardLike[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="award-row"
          style={{
            display: "grid", gridTemplateColumns: "80px 1fr", gap: "16px",
            padding: "14px 0", borderTop: idx > 0 ? "1px solid var(--border-light)" : "none",
          }}
        >
          <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-faint)", fontWeight: 700 }}>
            {item.year != null && String(item.year).trim() ? String(item.year) : ""}
          </span>
          <div style={{ minWidth: 0 }}>
            {item.title && (
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy)", margin: 0, overflowWrap: "break-word", wordBreak: "keep-all" }}>
                {item.title}
              </p>
            )}
            {(item.result || item.organization) && (
              <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", margin: "4px 0 0", overflowWrap: "break-word", wordBreak: "keep-all" }}>
                {[item.result, item.organization].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
