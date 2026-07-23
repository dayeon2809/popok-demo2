"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
import { normalizeWorkImages } from "@/lib/works";
import CompanyUpcomingPerformances from "@/components/company/CompanyUpcomingPerformances";
import SectionHeader from "@/components/ui/SectionHeader";
import RelatedArtists from "@/components/RelatedArtists";
import { useAutoFlip } from "@/lib/useAutoFlip";
import type { Performance, Artist } from "@/types";

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

// Hero photo slider images — up to 3 representative photos (same field
// RepresentativeGallery used to read), falling back to the single profile
// image when none are set. Pulled out to module scope so both the
// auto-advance effect (which runs before the component's loading/error
// early-returns) and the render body can derive the same list without
// duplicating the logic.
function getHeroImages(artist: any): string[] {
  if (!artist) return [];
  const urls = (Array.isArray(artist.profile_image_urls) ? artist.profile_image_urls : [])
    .map((u: any) => (typeof u === "string" ? u.trim() : ""))
    .filter(Boolean)
    .slice(0, 3);
  if (urls.length > 0) return urls;
  const fallback = artist.profile_image_url || artist.profileImage || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(artist.name)}`;
  return [fallback];
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
  const [upcomingPerformances, setUpcomingPerformances] = useState<Performance[]>([]);
  const [relatedArtists, setRelatedArtists] = useState<Artist[]>([]);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [heroTouchStartX, setHeroTouchStartX] = useState<number | null>(null);
  const heroAutoAdvancePausedRef = useRef(false);
  const heroAutoAdvanceResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heroCardFlip = useAutoFlip();
  const digitalCardFlip = useAutoFlip();
  const pathname = usePathname();

  const handleOpenWork = (work: WorkItem) => {
    setActiveImageIndex(0);
    setActiveWork(work);
  };

  useEffect(() => {
    setActiveImageIndex(0);
  }, [activeWork]);

  // Hero photo slider — auto-advance every 3s, pausing briefly whenever the
  // viewer manually navigates (arrows/dots/swipe) so a manual pick doesn't
  // get immediately overridden by the timer.
  const pauseHeroAutoAdvance = (delay = 6000) => {
    heroAutoAdvancePausedRef.current = true;
    if (heroAutoAdvanceResumeTimerRef.current) clearTimeout(heroAutoAdvanceResumeTimerRef.current);
    heroAutoAdvanceResumeTimerRef.current = setTimeout(() => {
      heroAutoAdvancePausedRef.current = false;
    }, delay);
  };

  useEffect(() => {
    const images = getHeroImages(artist);
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      if (heroAutoAdvancePausedRef.current) return;
      setHeroImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => {
      clearInterval(interval);
      if (heroAutoAdvanceResumeTimerRef.current) clearTimeout(heroAutoAdvanceResumeTimerRef.current);
    };
  }, [artist]);

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

  // Upcoming Performance section data — client-fetched (this page stays a
  // single client component, see app/api/artists/[id]/upcoming-performances)
  // rather than doing the company page's server-side Promise.all fetch.
  // Empty array is the safe default: the section renders nothing until a
  // real result arrives (CompanyUpcomingPerformances's showEmptyState=false).
  useEffect(() => {
    const recordId = artist?.recordId;
    if (!recordId) return;
    fetch(`/api/artists/${encodeURIComponent(recordId)}/upcoming-performances`)
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res?.data)) setUpcomingPerformances(res.data);
      })
      .catch(() => {
        // Non-critical section — never break the detail page.
      });
  }, [artist?.recordId]);

  // "더 탐색할 예술가들" section data — same client-fetch pattern as above.
  useEffect(() => {
    const recordId = artist?.recordId;
    if (!recordId) return;
    fetch(`/api/artists/${encodeURIComponent(recordId)}/related`)
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res?.data)) setRelatedArtists(res.data);
      })
      .catch(() => {
        // Non-critical section — never break the detail page.
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

  const heroImages: string[] = getHeroImages(artist);
  const heroImageAt = ((heroImageIndex % heroImages.length) + heroImages.length) % heroImages.length;
  const goToHeroImage = (dir: "prev" | "next") => {
    pauseHeroAutoAdvance();
    setHeroImageIndex((prev) => {
      const next = dir === "next" ? prev + 1 : prev - 1;
      return ((next % heroImages.length) + heroImages.length) % heroImages.length;
    });
  };

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
    <div style={{ background: "#FFFFFF", minHeight: "100vh", paddingBottom: "100px" }}>
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
          row-gap: 36px;
        }
        .work-tile {
          cursor: pointer;
        }
        .work-tile-image-wrapper {
          position: relative;
          aspect-ratio: 1.3;
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
        .work-tile-hover-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-end;
          padding: 16px;
          background: linear-gradient(to top, rgba(23,20,17,0.55) 0%, rgba(23,20,17,0) 45%);
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .work-tile:hover .work-tile-hover-overlay {
          opacity: 1;
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
        .magazine-timeline-row {
          display: grid;
          grid-template-columns: 90px 1fr;
          gap: 20px;
          padding: 16px 0;
          border-bottom: 1px solid var(--border);
        }
        .magazine-timeline-row:last-child {
          border-bottom: none;
        }
        .magazine-timeline-year {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--ink-faint);
        }
        @media (max-width: 768px) {
          .artist-detail-container {
            padding: 24px 16px !important;
          }
          .education-row, .award-row {
            grid-template-columns: 1fr !important;
            gap: 4px !important;
          }
          .magazine-timeline-row {
            grid-template-columns: 1fr !important;
            gap: 4px !important;
          }
          .artist-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
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
        background: "rgba(255,255,255,0.92)",
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

        {/* ──────────────── HERO — brochure-style: image + identity left, small digital-portfolio preview right (matches CompanyBrochureHeader's grid) ──────────────── */}
        <section style={{ ...SECTION_STYLE, paddingTop: 0 }}>
          <div className="artist-hero-grid" style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "48px", alignItems: "start" }}>
            {/* Left: image + identity */}
            <div>
              <div
                style={{
                  position: "relative", width: "100%", aspectRatio: "16 / 10", borderRadius: "4px", overflow: "hidden",
                  border: "1px solid var(--border)", background: "#FAF9F5", marginBottom: "28px",
                }}
                onTouchStart={(e) => setHeroTouchStartX(e.touches[0].clientX)}
                onTouchEnd={(e) => {
                  if (heroTouchStartX === null || heroImages.length <= 1) return;
                  const diffX = heroTouchStartX - e.changedTouches[0].clientX;
                  if (Math.abs(diffX) > 35) goToHeroImage(diffX > 0 ? "next" : "prev");
                  setHeroTouchStartX(null);
                }}
              >
                {/* All slides stacked + opacity-crossfaded, instead of swapping
                    a single <img>'s src (which cuts instantly with no
                    transition) — smooth fade between photos. */}
                {heroImages.map((src, idx) => (
                  <img
                    key={src + idx}
                    src={src}
                    alt={artist.name}
                    style={{
                      position: "absolute", inset: 0,
                      width: "100%", height: "100%", objectFit: "cover",
                      opacity: idx === heroImageAt ? 1 : 0,
                      transition: "opacity 0.6s ease",
                    }}
                  />
                ))}

                {heroImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => goToHeroImage("prev")}
                      aria-label="이전 사진"
                      style={{
                        position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                        width: "36px", height: "36px", borderRadius: "50%",
                        backgroundColor: "rgba(23, 20, 17, 0.75)", color: "#FFFFFF",
                        border: "1px solid rgba(255, 255, 255, 0.25)", backdropFilter: "blur(4px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", fontSize: "1.3rem", lineHeight: 1, zIndex: 2,
                      }}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => goToHeroImage("next")}
                      aria-label="다음 사진"
                      style={{
                        position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                        width: "36px", height: "36px", borderRadius: "50%",
                        backgroundColor: "rgba(23, 20, 17, 0.75)", color: "#FFFFFF",
                        border: "1px solid rgba(255, 255, 255, 0.25)", backdropFilter: "blur(4px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", fontSize: "1.3rem", lineHeight: 1, zIndex: 2,
                      }}
                    >
                      ›
                    </button>
                    <div style={{ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px", zIndex: 2 }}>
                      {heroImages.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => { pauseHeroAutoAdvance(); setHeroImageIndex(idx); }}
                          aria-label={`${idx + 1}번째 사진으로 이동`}
                          style={{
                            width: "6px", height: "6px", borderRadius: "50%", padding: 0, border: "none", cursor: "pointer",
                            background: idx === heroImageAt ? "#FFFFFF" : "rgba(255,255,255,0.45)",
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "10px", marginBottom: "8px" }}>
                <h1 style={{ fontSize: "clamp(1.6rem, 3.2vw, 2.4rem)", fontWeight: 900, color: "var(--navy)", margin: 0, letterSpacing: "-0.03em" }}>
                  {artist.name}
                </h1>
                {artist.name_en && (
                  <span className="mono" style={{ fontSize: "0.85rem", color: "var(--ink-muted)" }}>{artist.name_en}</span>
                )}
                {artist.verified && (
                  <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "var(--navy)", background: "var(--accent)", padding: "2px 7px", borderRadius: "8px" }}>
                    POPOK VERIFIED
                  </span>
                )}
              </div>

              {[artist.role, artist.genre, artist.category, artist.city_or_region].filter(Boolean).length > 0 && (
                <span className="mono" style={{ fontSize: "0.75rem", color: "var(--accent-dark)", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", display: "block", marginBottom: "16px" }}>
                  {[artist.role, artist.genre, artist.category, artist.city_or_region].filter(Boolean).join(" · ")}
                </span>
              )}

              {artist.bio_short && (
                <p style={{ fontSize: "1rem", color: "var(--navy)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: "560px" }}>
                  {artist.bio_short}
                </p>
              )}

              {/* Connected organization */}
              <div style={{ marginBottom: "24px" }}>
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
                      background: "#FAF9F5", transition: "background 0.15s ease", minWidth: 0, maxWidth: "420px",
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
                      <div style={{ fontSize: "0.7rem", color: "var(--ink-muted)", marginTop: "2px" }}>
                        {[artist.connectedCompany.role, artist.connectedCompany.company.genre, artist.connectedCompany.company.city_or_region].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </Link>
                ) : artist.company ? (
                  <Link
                    href={`/organizations/apply?orgName=${encodeURIComponent(artist.company)}`}
                    className="connected-org-card"
                    style={{
                      display: "flex", gap: "10px", alignItems: "center", textDecoration: "none",
                      padding: "10px", borderRadius: "4px", border: "1px dashed var(--border-dark)",
                      background: "#FAF9F5", transition: "background 0.15s ease", minWidth: 0, maxWidth: "420px",
                    }}
                  >
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "4px", background: "#FAF9F5",
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
                    </div>
                  </Link>
                ) : (
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", margin: 0 }}>
                    현재 연결된 단체가 없습니다.
                  </p>
                )}
              </div>

              {/* SNS / Website / Portfolio / Share */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px" }}>
                {contactCandidates.map((c, idx) => (
                  <a
                    key={idx}
                    href={c.href}
                    target={c.href.startsWith("mailto:") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy)", textDecoration: "none" }}
                  >
                    {c.label} ↗
                  </a>
                ))}
                <button
                  onClick={handleShareUrl}
                  style={{
                    background: "none", border: "1px solid var(--navy)", borderRadius: "999px",
                    padding: "6px 16px", fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)", cursor: "pointer",
                  }}
                >
                  Share
                </button>
              </div>

              <div style={{ marginTop: "20px" }}>
                <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-faint)", fontWeight: 700 }}>
                  조회수 {(artist.view_count ?? 0).toLocaleString("ko-KR")}회
                </span>
              </div>
            </div>

            {/* Right: small Digital Portfolio Preview — the full flip card + QR/share actions live in the Digital Card section at the bottom of the page */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <span className="mono" style={{ fontSize: "0.62rem", color: "var(--ink-faint)", fontWeight: 700, letterSpacing: "0.1em" }}>
                DIGITAL PORTFOLIO PREVIEW
              </span>
              {/* PopokCard is designed at up to 310px wide with fixed (non-relative)
                  padding/font-sizes inside — squeezing it into a narrower maxWidth
                  directly clips its footer row (barcode + portfolio URL). Render it
                  at its natural width and scale the whole block down uniformly
                  instead, same technique as the homepage hero's .hero-card-scale. */}
              <div style={{ width: "220px", height: "370px", display: "flex", justifyContent: "center" }}>
                <div style={{ width: "310px", flexShrink: 0, transform: "scale(0.7097)", transformOrigin: "top center" }}>
                  <PopokCard
                    name={artist.name}
                    nameEn={artist.name_en || undefined}
                    genre={artist.genre}
                    instagram={artist.instagram}
                    id={String(artist.recordId || artist.id || "")}
                    slug={artist.slug || artist.id || id}
                    profileImage={artist.profile_image_url || undefined}
                    flipped={heroCardFlip.flipped}
                    onFlipChange={heroCardFlip.onFlipChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ──────────────── UPCOMING PERFORMANCE — reuses the company page's component, hidden entirely when empty ──────────────── */}
        <CompanyUpcomingPerformances performances={upcomingPerformances} showEmptyState={false} />

        {/* ──────────────── MOTION PROFILE (kept, widened/de-boxed so the video reads as the section's main content) ──────────────── */}
        <section style={SECTION_STYLE}>
          <SectionHeader eyebrow="Motion Profile Preview" description="15초 모션 프로필 미리보기" />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <MotionProfile
              name={artist.name}
              genre={artist.genre}
              image={artist.profile_image_url || (Array.isArray(artist.profile_image_urls) && artist.profile_image_urls[0]) || artist.profileImage || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(artist.name)}`}
              quote={artist.bio_short}
              videoUrl={representativeVideoUrl}
            />
          </div>
        </section>

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

        {/* ──────────────── SELECTED WORKS — large-image project gallery, 2-col desktop / 1-col mobile ──────────────── */}
        <section style={SECTION_STYLE}>
          <SectionHeader eyebrow="Selected Works" meta={`${displayWorks.length} WORKS ARCHIVED`} />

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
                  {/* Image — ~78% of the tile; hover reveals a zoom + arrow + "View Detail" overlay instead of a card lift */}
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

                    <div className="work-tile-hover-overlay">
                      <span className="mono" style={{ fontSize: "0.75rem", fontWeight: 800, color: "#FFFFFF", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        View Detail <span>→</span>
                      </span>
                    </div>
                  </div>

                  {/* Caption */}
                  <div style={{ paddingTop: "14px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <div className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-faint)", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase" }}>
                      {(work.role || work.genre) && (
                        <span style={{ fontWeight: 700, color: "var(--accent-dark)" }}>
                          {[work.role, work.genre].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      {work.venue && <span>· {work.venue}</span>}
                    </div>
                    <h4 style={{
                      fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)", margin: "6px 0 2px",
                      letterSpacing: "-0.01em", lineHeight: 1.35,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {work.title}
                    </h4>
                    {work.description && (
                      <p style={{
                        fontSize: "0.85rem", color: "var(--ink-muted)", lineHeight: 1.5, margin: "4px 0 0",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
                      }}>
                        {work.description}
                      </p>
                    )}

                    {work.externalLink && (
                      <div style={{ marginTop: "auto", paddingTop: "10px" }}>
                        <a
                          href={work.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--ink-muted)", textDecoration: "none" }}
                        >
                          외부 링크 ↗
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ──────────────── ABOUT — plain readable layout, no card ──────────────── */}
        <section style={SECTION_STYLE}>
          <SectionHeader eyebrow="About" />
          <p style={{ fontSize: "0.98rem", color: "var(--navy)", lineHeight: 1.75, whiteSpace: "pre-line", margin: 0, maxWidth: "720px" }}>
            {artist.bio || artist.bio_short || "POPOK 아티스트 레지스트리에 정식 등록된 창작자입니다. 흩어져 있는 활동과 기록을 수집하여 포트폴리오를 구성해 나가는 여정에 있습니다."}
          </p>
        </section>

        {/* ──────────────── ACTIVITY TIMELINE — current_activity only now (affiliations moved into Career below); Magazine layout, no cards ──────────────── */}
        {timelineCurrent.length > 0 && (
          <section style={SECTION_STYLE}>
            <SectionHeader eyebrow="Activity Timeline" />
            <div className="magazine-timeline">
              {timelineCurrent.map((entry, idx) => (
                <div key={idx} className="magazine-timeline-row">
                  <span className="mono magazine-timeline-year">CURRENT</span>
                  <p style={{ fontSize: "0.92rem", color: "var(--navy)", fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                    {entry.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ──────────────── CAREER — Education → Awards → Competitions → Affiliation, one flowing section instead of separate boxed-off sections ──────────────── */}
        {(educationList.length > 0 || combinedAwardsCount > 0 || timelineRest.length > 0) && (
          <section style={SECTION_STYLE}>
            <SectionHeader eyebrow="Career" description="학력 · 수상 · 활동 이력" />

            {educationList.length > 0 && (
              <div style={{ marginBottom: "32px" }}>
                <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-faint)", fontWeight: 800, letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>
                  EDUCATION
                </span>
                <div className="education-list" style={{ display: "flex", flexDirection: "column" }}>
                  {educationList.map((entry, idx) => (
                    <div
                      key={idx}
                      className="education-row"
                      style={{
                        display: "grid", gridTemplateColumns: "40px 1fr", gap: "16px",
                        padding: "12px 0", borderTop: idx > 0 ? "1px solid var(--border-light)" : "none",
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
              </div>
            )}

            {combinedAwardsCount > 0 && (
              <div style={{ marginBottom: "32px" }}>
                <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-faint)", fontWeight: 800, letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>
                  {splitAwardsAndCompetitions ? "AWARDS" : "AWARDS & COMPETITIONS"}
                </span>
                <AwardRows items={splitAwardsAndCompetitions ? awardsList : [...awardsList, ...competitionsList]} />

                {splitAwardsAndCompetitions && competitionsList.length > 0 && (
                  <>
                    <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-faint)", fontWeight: 800, letterSpacing: "0.08em", display: "block", margin: "24px 0 8px" }}>
                      COMPETITIONS
                    </span>
                    <AwardRows items={competitionsList} />
                  </>
                )}
              </div>
            )}

            {timelineRest.length > 0 && (
              <div>
                <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-faint)", fontWeight: 800, letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>
                  AFFILIATION
                </span>
                <AwardRows
                  items={[...timelineDated, ...timelineUndated].map((entry) => ({ year: entry.year ?? undefined, title: entry.text }))}
                />
              </div>
            )}
          </section>
        )}

        {/* ──────────────── REVIEWS & ARTICLES — magazine style: quote / publisher / date / link, no cards ──────────────── */}
        {reviewItems.length > 0 && (
          <section style={SECTION_STYLE}>
            <SectionHeader eyebrow="Reviews & Articles" meta={`${reviewItems.length} ITEMS`} />

            <div style={{ display: "flex", flexDirection: "column" }}>
              {reviewItems.map((rev, idx) => {
                const url = typeof rev.url === "string" ? rev.url.trim() : "";
                const quote = rev.title || rev.work || (url ? getReviewDomain(url) : "관련 자료");
                const byline = [rev.publication, rev.date || (rev.year ? safeYear(rev.year) : null)]
                  .filter(Boolean)
                  .join(" · ") || "관련 평론 및 언론 보도";

                const row = (
                  <div style={{ padding: "20px 0", borderTop: idx > 0 ? "1px solid var(--border-light)" : "none" }}>
                    <p style={{ fontSize: "1rem", fontStyle: "italic", color: "var(--navy)", fontWeight: 600, margin: 0, lineHeight: 1.5, overflowWrap: "break-word" }}>
                      &ldquo;{quote}&rdquo;
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "8px", gap: "12px" }}>
                      <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                        {byline}
                      </span>
                      {url && (
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--navy)", whiteSpace: "nowrap", flexShrink: 0 }}>
                          Read ↗
                        </span>
                      )}
                    </div>
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
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--navy)", margin: 0, marginBottom: "6px" }}>
            {artist.name} 작가의 명함을 공유해보세요
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", marginTop: 0, marginBottom: "28px" }}>
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
              flipped={digitalCardFlip.flipped}
              onFlipChange={digitalCardFlip.onFlipChange}
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

        {/* ──────────────── 더 탐색할 예술가들 — mirrors the company page's "You may also like" ──────────────── */}
        <RelatedArtists artists={relatedArtists} />

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

      {/* ──────────────── 8. WORK DETAIL MODAL — same fade-in open as the company page's WorkDrawer ──────────────── */}
      {activeWork && parsedActiveMedia && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="artist-work-modal-backdrop"
          onClick={() => setActiveWork(null)}
        >
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
        </motion.div>
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
