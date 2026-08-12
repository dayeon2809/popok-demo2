"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";
import PopokCard from "@/components/PopokCard";
import ArtistStoryShareModal from "@/components/artist/ArtistStoryShareModal";
import { analytics } from "@/lib/analytics";
import { getArtistPublicUrl } from "@/lib/publicProfileUrls";
import { getCompanyDetailHref } from "@/lib/companyRoute";
import { toObjectArray, safeYear, getValidWorks } from "@/lib/normalize";
import {
  normalizeArtistEducation,
  normalizeArtistCurrentActivity,
  normalizeArtistAffiliations,
  normalizeArtistAwards,
  normalizeArtistCompetitions,
} from "@/lib/artist-profile";
import ConnectCta from "@/components/portfolio-requests/ConnectCta";
import type { PortfolioRequestViewerState } from "@/lib/portfolioRequestsServer";
import { normalizeWorkImages } from "@/lib/works";
import CompanyUpcomingPerformances from "@/components/company/CompanyUpcomingPerformances";
import SectionHeader from "@/components/ui/SectionHeader";
import { useAutoFlip } from "@/lib/useAutoFlip";
import type { Performance } from "@/types";
import WorkDetailModal from "@/components/works/WorkDetailModal";
import ArtistMinimalHeader from "@/components/artists/ArtistMinimalHeader";
import ArtistWorkGallery from "@/components/artists/ArtistWorkGallery";
import AiDiscoveryPrototype from "@/components/ai/AiDiscoveryPrototype";
import RelatedArtists from "@/components/RelatedArtists";
import VideoEmbed from "@/components/VideoEmbed";
import { useFireOnceInView } from "@/hooks/useFireOnceInView";
import { useLanguage } from "@/lib/useLanguage";
import { localizePath, localizedCareer, localizedParallelStrings, localizedRecord, localizedWork } from "@/lib/i18n/locale";
import { getArtistRoleLabel } from "@/lib/artistRoles";
import { getListImageUrl } from "@/lib/imageUrls";

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
  images: string[];
  videoUrl: string;
  credits: unknown;
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
  const [timeStr, setTimeStr] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [portfolioViewerState, setPortfolioViewerState] = useState<PortfolioRequestViewerState>(DEFAULT_PORTFOLIO_VIEWER_STATE);
  const [upcomingPerformances, setUpcomingPerformances] = useState<Performance[]>([]);
  const [relatedArtists, setRelatedArtists] = useState<any[]>([]);
  const digitalCardFlip = useAutoFlip();
  const pathname = usePathname();
  const { language } = useLanguage();
  const worksSectionRef = useFireOnceInView<HTMLElement>(() => {
    const key = artist?.recordId || artist?.id;
    if (key) analytics.workGalleryScroll(key);
  });

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
  // Fetch related artists
  useEffect(() => {
    const recordId = artist?.recordId;
    if (!recordId) return;
    fetch(`/api/artists/${encodeURIComponent(recordId)}/related`)
      .then((r) => r.json())
      .then((res) => {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[artist related] response", { recordId, res });
        }
        if (Array.isArray(res?.data)) setRelatedArtists(res.data);
      })
      .catch((err) => {
        console.error("[artist related] fetch failed", err);
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
          setArtist({
            ...localizedRecord(data, language),
            works: Array.isArray(data?.works) ? data.works.map((work: any) => localizedWork(work, language)) : [],
            affiliations: Array.isArray(data?.affiliations) ? data.affiliations.map((item: any) => localizedCareer(item, language)) : [],
            awards: Array.isArray(data?.awards) ? data.awards.map((item: any) => localizedCareer(item, language)) : [],
            competitions: Array.isArray(data?.competitions) ? data.competitions.map((item: any) => localizedCareer(item, language)) : [],
            current_activity: localizedParallelStrings(data?.current_activity, data?.current_activity_en, language),
            education: localizedParallelStrings(data?.education, data?.education_en, language),
          });
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(`네트워크 오류: ${String(e)}`);
        setLoading(false);
      });
  }, [id, language]);

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

  const handleShareUrl = () => setShareModalOpen(true);


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

  const artistKey: string = artist.recordId || artist.id;
  // youtube_url is the artist's own "유튜브 소개/하이라이트 영상 URL" (my-popok's
  // dedicated intro/highlight field) — distinct from motion_video_url, which
  // is the separate 15-second motion-profile loop used elsewhere.
  const mainVideoUrl: string | null = artist.youtube_url || null;

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
      // V2 (feature/home-feed-v2) quick-upload lets a work be published with
      // only an image, no title — this is the display-only fallback for
      // that case (never written back to the DB, just shown here).
      title: (typeof w.title === "string" && w.title.trim()) || "제목 없는 작업",
      year: safeYear(w.year) || "연도미상",
      description: typeof w.description === "string" ? w.description.trim() : "",
      role: typeof w.role === "string" ? w.role.trim() : "",
      genre: typeof w.genre === "string" ? w.genre.trim() : "",
      venue: typeof w.venue === "string" ? w.venue.trim() : "",
      externalLink: typeof (w.link || w.url || w.source_url) === "string" ? (w.link || w.url || w.source_url).trim() : "",
      image: images[0] || w.image_url || "/images/placeholders/cake-placeholder.png",
      images,
      videoUrl: w.video_url || w.video || w.videoUrl || "",
      credits: w.credits ?? w.credits_list ?? (w.role || ""),
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
  interface ContactCandidate { label: string; href: string; channel: string; }
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
    if (artist.instagram) list.push({ label: cleanInstagramHandle(artist.instagram), href: normalizeHref(artist.instagram), channel: "instagram" });
    if (artist.website) list.push({ label: artist.website.replace(/^https?:\/\//, ""), href: normalizeHref(artist.website), channel: "website" });
    if (artist.portfolio_url) list.push({ label: "Portfolio", href: normalizeHref(artist.portfolio_url), channel: "link" });
    if (artist.email) list.push({ label: artist.email, href: `mailto:${artist.email}`, channel: "email" });
    if (artist.youtube_url) list.push({ label: "YouTube", href: normalizeHref(artist.youtube_url), channel: "link" });
    toObjectArray<{ url?: string; label?: string }>(artist.links).forEach((link) => {
      if (typeof link.url === "string" && link.url.trim()) {
        list.push({ label: link.label || getReviewDomain(link.url), href: normalizeHref(link.url), channel: "link" });
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
  const externalLinkItems = toObjectArray<{ url?: string; label?: string }>(artist.links)
    .filter((link) => typeof link.url === "string" && link.url.trim())
    .map((link) => ({
      label: link.label?.trim() || getReviewDomain(link.url || ""),
      href: normalizeHref(link.url || ""),
    }));


  const englishName = artist.name_en || (artist.name ? artist.name.toUpperCase() : "CREATIVE");
  const tags = Array.isArray(artist.tags) ? artist.tags : [artist.field, artist.genre].filter(Boolean);

  const roleLine = [getArtistRoleLabel(artist.role, language), artist.genre, artist.city_or_region].filter(Boolean).join(" · ");
  const currentActivityLine = normalizeArtistCurrentActivity(artist.current_activity)[0] || null;

  const openWorkDetail = (workId: string) => {
    const work = displayWorks.find((w) => w.id === workId);
    if (work) {
      setActiveWork(work);
      analytics.artistWorkOpened(artistKey, workId);
    }
  };

  const portfolioTarget = { type: "artist" as const, id: artist.recordId || artist.id, name: artist.name, imageUrl: artist.profile_image_url || artist.profileImage || null };

  const getCoordinates = () => {
    let hash = 0;
    for (let i = 0; i < artist.id.length; i++) {
      hash = artist.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lat = (37.5665 + (hash % 100) / 1000).toFixed(4);
    const lng = (126.978 + (Math.abs(hash) % 100) / 1000).toFixed(4);
    return `${lat}° N, ${lng}° E`;
  };

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh", paddingBottom: "100px" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .artist-detail-container {
          max-width: 1040px;
          margin: 0 auto;
          padding: 40px 24px;
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
          .connect-cta-btn {
            width: 100%;
            text-align: center;
          }
          .works-list-row {
            grid-template-columns: 44px 1fr auto !important;
            gap: 10px !important;
          }
        }
        .connected-org-card:hover {
          background: #F0EDE4 !important;
        }
        .press-link:hover {
          text-decoration: underline !important;
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
            analytics.artistsBackClicked(artistKey);
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

        {/* ──────────────── DIGITAL CARD — shown first, mirroring the company
            detail page's card-stack-up-top layout (see
            app/companies/[slug]/CompanyClientView.tsx), before Works. Just
            the card itself — no heading/QR/share here, see the Send POPOK
            CTA near the bottom for those. ──────────────── */}
        <section style={{ ...SECTION_STYLE, paddingTop: 0, borderBottom: "none", display: "flex", justifyContent: "center" }}>
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
        </section>

        {/* ──────────────── V2 PUBLIC PAGE (feature/home-feed-v2) — a visual
            work archive, not a profile-first brochure: minimal header, then
            straight into the full work gallery (no large hero poster —
            removed per feedback). Bio/history/career move further down. ──────────────── */}
        <section style={{ ...SECTION_STYLE, paddingTop: 0, borderBottom: "none" }}>
          <ArtistMinimalHeader
            name={artist.name}
            nameEn={artist.name_en}
            verified={artist.verified}
            roleLine={roleLine}
            currentActivityLine={currentActivityLine}
            profileImage={artist.profile_image_url || artist.profileImage || null}
            contactCandidates={contactCandidates}
            onContactClick={(channel) => analytics.artistContactClicked(artistKey, channel)}
            actions={
              <>
                <ConnectCta
                  target={portfolioTarget}
                  viewerState={portfolioViewerState}
                  currentPath={pathname}
                  onToast={triggerToast}
                  compact
                />
                <button
                  type="button"
                  onClick={handleShareUrl}
                  style={{
                    background: "none", border: "1px solid var(--navy)", borderRadius: "999px",
                    padding: "8px 16px", fontSize: "0.78rem", fontWeight: 800, color: "var(--navy)", cursor: "pointer",
                  }}
                >
                  Share
                </button>
              </>
            }
          />
        </section>

        <section ref={worksSectionRef} style={SECTION_STYLE}>
          <SectionHeader eyebrow="Works" meta={`${displayWorks.length} WORKS ARCHIVED`} />
          {displayWorks.length === 0 ? (
            <div style={{ padding: "50px 24px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "4px", color: "var(--ink-muted)", fontSize: "0.82rem" }}>
              등록된 작품 포트폴리오가 없습니다.
            </div>
          ) : (
            <ArtistWorkGallery works={displayWorks} onSelectWork={openWorkDetail} />
          )}

          {/* Intro video — the artist's own introduction video, played in
              full with normal controls (not a silent motion-profile-style
              loop), shown right below the work gallery. */}
          {mainVideoUrl && (
            <div style={{ marginTop: "28px", maxWidth: "560px" }}>
              <span className="mono" style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", marginBottom: "10px", letterSpacing: "0.08em" }}>
                소개 영상
              </span>
              <div style={{ aspectRatio: "16 / 9", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", background: "#171411" }}>
                <VideoEmbed videoUrl={mainVideoUrl} title={`${artist.name} 소개 영상`} />
              </div>
            </div>
          )}
        </section>

        {/* Removed redundant Connect and moved AI Discovery section below */}

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

        {/* ──────────────── WORKS LIST — a plain text listing of every work
            (title/year/role), below Career, so a visitor can scan and jump
            straight to a specific piece instead of hunting through the photo
            gallery above. Reuses the same click-to-open modal as the gallery. ──────────────── */}
        {displayWorks.length > 0 && (
          <section style={SECTION_STYLE}>
            <SectionHeader eyebrow="Works List" description="작품별로 정리된 목록입니다. 클릭하면 상세 정보를 볼 수 있습니다." meta={`${displayWorks.length} WORKS`} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              {displayWorks.map((work, idx) => (
                <button
                  key={work.id}
                  type="button"
                  onClick={() => openWorkDetail(work.id)}
                  className="works-list-row"
                  style={{
                    display: "grid", gridTemplateColumns: "56px 1fr auto", gap: "14px", alignItems: "center",
                    padding: "14px 0", border: "none", borderTop: idx > 0 ? "1px solid var(--border-light)" : "none",
                    background: "none", width: "100%", textAlign: "left", cursor: "pointer",
                    font: "inherit", color: "inherit",
                  }}
                >
                  <img
                    src={getListImageUrl(work.image, 128)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{ width: "56px", height: "56px", borderRadius: "6px", objectFit: "cover", flexShrink: 0, background: "#EAE6DD" }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy)", margin: 0, overflowWrap: "break-word", wordBreak: "keep-all" }}>
                      {work.title}
                    </p>
                    <p className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-muted)", margin: "4px 0 0" }}>
                      {[work.year, work.genre, work.role, work.venue].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "var(--navy)", fontWeight: 800, whiteSpace: "nowrap" }}>
                    보기 →
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ──────────────── CONNECTED ORGANIZATION — eyebrow is "Affiliation"
            rather than "Connect" so it doesn't collide with the portfolio-send
            CONNECT section further up the page. ──────────────── */}
        <section style={SECTION_STYLE}>
          <SectionHeader eyebrow="Affiliation" description="소속 및 연결 단체" />
          {artist.connectedCompany ? (
            <Link
              href={getCompanyDetailHref(artist.connectedCompany.company.slug || artist.connectedCompany.company.id)}
              onClick={() => analytics.artistCompanyClicked(artistKey, artist.connectedCompany.company.id)}
              className="connected-org-card"
              style={{
                display: "flex", gap: "10px", alignItems: "center", textDecoration: "none",
                padding: "10px", borderRadius: "4px", border: "1px solid var(--border)",
                background: "#FAF9F5", transition: "background 0.15s ease", minWidth: 0, maxWidth: "420px",
              }}
            >
              <img
                src={getListImageUrl(
                  artist.connectedCompany.company.profile_image_url || "/images/placeholders/cake-placeholder.png",
                  96
                )}
                alt={artist.connectedCompany.company.name}
                loading="lazy"
                decoding="async"
                style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.88rem", color: "var(--navy)", overflowWrap: "break-word", wordBreak: "keep-all" }}>
                    {artist.connectedCompany.company.name}
                  </span>
                  <span style={{ fontSize: "0.56rem", fontWeight: 800, color: "var(--navy)", background: "var(--accent)", padding: "2px 6px", borderRadius: "7px", whiteSpace: "nowrap" }}>
                      POPOK VERIFIED
                    </span>
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
        </section>

        {/* ──────────────── AI ARTIST DISCOVERY — real search against
            /api/ai/discover-artists, scoped to this artist as context.
            See components/ai/AiDiscoveryPanel.tsx. ──────────────── */}
        <section style={SECTION_STYLE}>
          <SectionHeader eyebrow="AI Discovery" description="이 아티스트를 기준으로 비슷한 작업이나 협업 대상을 찾아보세요." />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <AiDiscoveryPrototype
              variant="button"
              label="이 아티스트와 비슷한 작업 찾기"
              mode="similar"
              contextArtistId={artist.recordId || artist.id}
              contextArtistName={artist.name}
              defaultQuery="이 아티스트와 비슷한 작업"
              autoSearch
              onButtonClick={() => analytics.artistAiDiscoveryClicked(artistKey)}
            />
            <AiDiscoveryPrototype
              variant="button"
              label="이런 스타일의 아티스트 찾기"
              mode="discover"
              onButtonClick={() => analytics.artistAiDiscoveryClicked(artistKey)}
            />
            <AiDiscoveryPrototype
              variant="button"
              label="협업할 만한 사람 찾기"
              mode="collaborator"
              contextArtistId={artist.recordId || artist.id}
              contextArtistName={artist.name}
              defaultQuery={`${artist.name}와(과) 협업할 아티스트`}
              onButtonClick={() => analytics.artistAiDiscoveryClicked(artistKey)}
            />
          </div>
        </section>

        {/* ──────────────── UPCOMING PERFORMANCE — reuses the company page's component, hidden entirely when empty ──────────────── */}
        <CompanyUpcomingPerformances performances={upcomingPerformances} showEmptyState={false} />

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
                    onClick={() => analytics.artistMediaClicked(artistKey)}
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


        {externalLinkItems.length > 0 && (
          <section style={SECTION_STYLE}>
            <SectionHeader eyebrow="Links" description="아티스트의 작업과 활동을 더 자세히 살펴보세요." meta={`${externalLinkItems.length} LINKS`} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
              {externalLinkItems.map((link, idx) => (
                <a key={`${link.href}-${idx}`} href={link.href} target="_blank" rel="noopener noreferrer" onClick={() => analytics.artistMediaClicked(artistKey)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "16px 0", borderTop: "1px solid var(--border-light)", color: "var(--navy)", textDecoration: "none", fontSize: "0.88rem", fontWeight: 800 }}>
                  <span>{link.label}</span><span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ──────────────── SEND POPOK CTA — mirrors the company page's
            bottom-of-page send section (SendPortfolioSection); the digital
            card itself now lives up top, this just has the share/QR actions
            and the send action. ──────────────── */}
        <section style={{ ...SECTION_STYLE, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--navy)", margin: 0, marginBottom: "16px" }}>
            작업이 마음에 들었다면, {artist.name}와(과) POPOK으로 연결해보세요
          </h3>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "20px" }}>
            <button
              onClick={handleShareUrl}
              style={{
                padding: "11px 22px", borderRadius: "4px", border: "1px solid var(--navy)",
                background: "transparent", color: "var(--navy)", fontSize: "0.78rem", fontWeight: 800,
                textTransform: "uppercase", letterSpacing: "0.03em", cursor: "pointer",
              }}
            >
              Share Card
            </button>
            <button
              onClick={() => setShareModalOpen(true)}
              style={{
                padding: "11px 22px", borderRadius: "4px", border: "1px solid var(--navy)",
                background: "transparent", color: "var(--navy)", fontSize: "0.78rem", fontWeight: 800,
                textTransform: "uppercase", letterSpacing: "0.03em", cursor: "pointer",
              }}
            >
              Story Image
            </button>
          </div>
          <Link href={localizePath(pathname, language === "en" ? "ko" : "en")} hrefLang={language === "en" ? "ko" : "en"} style={{ marginBottom: 20, color: "var(--navy)", fontSize: "0.82rem", fontWeight: 800 }}>
            {language === "en" ? "한국어로 보기" : "View in English"}
          </Link>
          <ConnectCta
            target={portfolioTarget}
            viewerState={portfolioViewerState}
            currentPath={pathname}
            onToast={triggerToast}
            label="내 포퐄 보내기"
            compact
          />
        </section>

        {/* ──────────────── 더 탐색할 예술가들 — mirrors the company page's "You may also like" ──────────────── */}
        <RelatedArtists artists={relatedArtists} />

        {/* ──────────────── FOOTER METRICS ──────────────── */}
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

      <ArtistStoryShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onToast={triggerToast}
        artist={{
          id: String(artist.recordId || artist.id || id),
          slug: artist.slug || artist.id || id,
          name: artist.name,
          nameEn: artist.name_en,
          genre: artist.genre,
          role: artist.role,
          instagram: artist.instagram,
          profileImage: artist.profile_image_url || artist.profileImage || null,
          profileUrl: getArtistPublicUrl(artist.slug || artist.id || id),
        }}
      />

      {/* ──────────────── 8. WORK DETAIL MODAL — shared with the company
          page's work modal (components/works/WorkDetailModal.tsx) so both
          stay visually identical instead of drifting apart again. ──────────────── */}
      {activeWork && (
        <WorkDetailModal
          work={activeWork}
          accentColor="var(--accent-dark)"
          onClose={() => {
            analytics.artistWorkClosed(artistKey, activeWork.id);
            setActiveWork(null);
          }}
          onExternalLinkClick={() => analytics.artistWorkExternalClicked(artistKey, activeWork.id)}
          onVideoPlay={() => analytics.workVideoPlayed(artistKey, activeWork.id)}
          onImageChanged={() => analytics.workImageChanged(artistKey, activeWork.id)}
        />
      )}

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
