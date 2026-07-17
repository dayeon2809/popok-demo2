"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";
import PopokCard from "@/components/PopokCard";
import { analytics } from "@/lib/analytics";
import MotionProfile from "@/components/MotionProfile";
import YouTubeMotionPreview from "@/components/YouTubeMotionPreview";
import { getYouTubePreviewAspectRatio, isYouTubeUrl } from "@/lib/youtube";
import { isSameVideoUrl, getYouTubeEmbedUrl, isDirectVideoUrl } from "@/lib/video";
import { isVimeoUrl, getVimeoEmbedUrl } from "@/lib/videoLinks";
import { getCompanyDetailHref } from "@/lib/companyRoute";
import { toStringArray, toObjectArray, safeYear, getValidWorks } from "@/lib/normalize";

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
  const [timeStr, setTimeStr] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  };

  useEffect(() => {
    params.then(({ id: pid }) => setId(decodeURIComponent(pid)));
  }, [params]);

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

  // Compile works list — only real archived pieces (getValidWorks drops the
  // onboarding pipeline's "popok_registration_media" bookkeeping entry and
  // any item with no title), so the rendered list and the "N WORKS ARCHIVED"
  // count below always agree.
  const validWorkRecords = getValidWorks<any>(artist.works ?? artist.portfolio_works);
  const displayWorks: WorkItem[] = validWorkRecords.map((w: any, idx: number) => ({
    id: w.id || `work-${idx}`,
    title: typeof w.title === "string" ? w.title.trim() : String(w.title),
    year: safeYear(w.year) || "연도미상",
    description: typeof w.description === "string" ? w.description.trim() : "",
    role: typeof w.role === "string" ? w.role.trim() : "",
    genre: typeof w.genre === "string" ? w.genre.trim() : "",
    venue: typeof w.venue === "string" ? w.venue.trim() : "",
    externalLink: typeof (w.link || w.url || w.source_url) === "string" ? (w.link || w.url || w.source_url).trim() : "",
    image: w.image_url || "/images/placeholders/cake-placeholder.png",
    videoUrl: w.video_url || w.video || w.videoUrl || "",
    credits: typeof w.credits === "string" ? w.credits.trim() : (w.role || ""),
    previewStart: Number.isFinite(Number(w.previewStart ?? w.preview_start)) ? Number(w.previewStart ?? w.preview_start) : 0,
    previewEnd: Number.isFinite(Number(w.previewEnd ?? w.preview_end)) ? Number(w.previewEnd ?? w.preview_end) : 15,
    previewAspectRatio: w.previewAspectRatio || w.preview_aspect_ratio || w.aspectRatio || w.aspect_ratio,
    media: w.media || null,
  }));

  // ── Activity Timeline: current_activity + affiliations only (education,
  // awards, competitions each get their own section below). Entries with a
  // real numeric year sort newest-first; current_activity has no year field
  // in practice so it always leads at the top as "CURRENT".
  interface TimelineEntry { label: string; text: string; year: number | null; }
  const timelineEntries: TimelineEntry[] = (() => {
    const entries: TimelineEntry[] = [];
    toStringArray(artist.current_activity).forEach((text) => {
      entries.push({ label: "CURRENT", text, year: null });
    });
    toObjectArray<{ name?: string; position?: string; year?: string | number }>(artist.affiliations).forEach((aff) => {
      const name = typeof aff.name === "string" ? aff.name.trim() : "";
      if (!name) return;
      const text = aff.position ? `${name} · ${aff.position}` : name;
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
  const educationList = toStringArray(artist.education);

  // ── Awards & Competitions — normalize, dedupe by (year, title, org), sort
  // newest-first when a real year exists, otherwise keep original order.
  interface AwardLike { year?: string | number; title?: string; result?: string; organization?: string; }
  function normalizeAwardList(value: unknown): AwardLike[] {
    const raw = toObjectArray<AwardLike>(value);
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
  const awardsList = normalizeAwardList(artist.awards);
  const competitionsList = normalizeAwardList(artist.competitions);
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
        .works-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
          gap: 24px !important;
        }
        @media (max-width: 768px) {
          .works-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px 10px !important;
          }
          .work-card {
            border-radius: 12px !important;
          }
          .work-card-media-wrapper {
            aspect-ratio: 1.4 !important;
          }
          .work-card-info-wrapper {
            padding: 12px 10px !important;
            gap: 6px !important;
          }
          .work-card-title {
            font-size: 0.82rem !important;
          }
          .work-card-role-year {
            font-size: 0.6rem !important;
            margin-top: 2px !important;
          }
          .work-card-desc {
            font-size: 0.65rem !important;
            line-height: 1.35 !important;
            -webkit-line-clamp: 2 !important;
          }
          .education-row, .award-row {
            grid-template-columns: 1fr !important;
            gap: 4px !important;
          }
        }
        .connected-org-card:hover {
          box-shadow: 0 8px 20px rgba(23, 20, 17, 0.08);
          transform: translateY(-2px);
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
          maxWidth: "1120px", margin: "0 auto", padding: "0 32px", height: "56px",
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

      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "40px 32px" }}>
        
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
            color: "var(--ink-muted)", fontSize: "0.85rem", fontWeight: 700, marginBottom: "40px"
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
          marginBottom: "80px"
        }}>
          {/* Mock Browser Header */}
          <div style={{
            background: "#FAF8F5", borderBottom: "1px solid var(--border)",
            padding: "10px 20px", display: "flex", alignItems: "center", gap: "6px"
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
              marginBottom: "40px"
            }}>
              {/* Col 1: Connected Organization — a small network card, not a
                  new large section. Priority: official artist_companies
                  connection > artists.company text fallback > Independent Artist.
                  Never auto-connects by name matching a company string. */}
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
                      padding: "10px", borderRadius: "12px", border: "1px solid var(--border)",
                      background: "#FAF8F5", transition: "all 0.15s ease", minWidth: 0,
                    }}
                  >
                    <img
                      src={artist.connectedCompany.company.profile_image_url || "/images/placeholders/cake-placeholder.png"}
                      alt={artist.connectedCompany.company.name}
                      style={{ width: "40px", height: "40px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }}
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
                      padding: "10px", borderRadius: "12px", border: "1px dashed var(--border-dark)",
                      background: "#FAF8F5", transition: "all 0.15s ease", minWidth: 0,
                    }}
                  >
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "10px", background: "var(--bg-warm)",
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
                {toStringArray(artist.current_activity).length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <span className="mono" style={{ fontSize: "0.58rem", color: "var(--accent-dark)", fontWeight: 850, letterSpacing: "0.08em" }}>
                      CURRENT
                    </span>
                    <p style={{
                      fontSize: "0.8rem", color: "var(--navy)", lineHeight: 1.5, margin: "4px 0 0",
                      display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {toStringArray(artist.current_activity).join(" · ")}
                    </p>
                  </div>
                )}
              </div>

              {/* Col 3: Contact — up to 3 candidates, priority-ordered and deduped */}
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
                          color: idx === 0 ? "var(--navy)" : "var(--ink-muted)",
                          fontWeight: idx === 0 ? 700 : 500,
                          textDecoration: "none",
                          fontFamily: idx === 0 ? "inherit" : "monospace",
                          overflowWrap: "break-word",
                          wordBreak: "break-all",
                        }}
                      >
                        {c.label} ↗
                      </a>
                    ))
                  ) : (
                    <span style={{ color: "var(--ink-faint)" }}>등록된 연락처가 없습니다.</span>
                  )}
                  <span style={{ color: "var(--ink-muted)", fontFamily: "monospace" }}>{artist.name}@popok.kr</span>
                </div>
              </div>
            </div>

            {/* View count — small and unobtrusive, right below profile info */}
            <div style={{ textAlign: "right", marginBottom: "-8px" }}>
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
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
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

        {/* ── 2.5. VIDEO PROFILE (Additional Video Section) ── */}
        {artist.youtube_url && (
          <section style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "8px", marginTop: "-30px", paddingBottom: "60px" }}>
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
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(23, 20, 17, 0.15)",
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

        {/* ──────────────── 3. SELECTED WORKS (Visual Card Layouts - Split) ──────────────── */}
        <section style={{ marginBottom: "80px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1.5px solid var(--navy)", paddingBottom: "12px", marginBottom: "28px" }}>
            <h3 className="display" style={{ fontSize: "1.2rem", color: "var(--navy)", textTransform: "uppercase", margin: 0 }}>
              Selected Works
            </h3>
            <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>
              {displayWorks.length} WORKS ARCHIVED
            </span>
          </div>

          {displayWorks.length === 0 ? (
            <p style={{ color: "var(--ink-muted)", fontSize: "0.85rem", padding: "20px 0" }}>등록된 작품 포트폴리오가 없습니다.</p>
          ) : (
            /* Visual Responsive Grid */
            <div className="works-grid">
              {displayWorks.map((work) => (
                <div
                  key={work.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid var(--border)",
                    borderRadius: "16px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 4px 16px rgba(23, 20, 17, 0.02)",
                    transition: "all 0.2s ease"
                  }}
                  className="work-card hover-scale-img"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 24px rgba(23, 20, 17, 0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(23, 20, 17, 0.02)";
                  }}
                >
                  {/* Visual Preview Banner */}
                  <div className="work-card-media-wrapper" style={{ position: "relative", width: "100%", aspectRatio: "1.4", overflow: "hidden", background: "#F5F1E8" }}>
                    {work.image && !work.image.includes("cake-placeholder") ? (
                      <img
                        src={work.image}
                        alt={work.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      /* Lime/Cream Typographic POPOK Logo Placeholder instead of cake slice */
                      <div style={{
                        width: "100%", height: "100%", display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", background: "#FAF8F5", padding: "16px",
                        borderBottom: "1px solid var(--border)"
                      }}>
                        <div style={{
                          fontWeight: 950, fontSize: "1.1rem", color: "var(--navy)", letterSpacing: "-0.04em",
                          display: "inline-flex", alignItems: "center", gap: "2px", marginBottom: "8px"
                        }}>
                          POPOK
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
                        </div>
                        <div style={{
                          width: "52px", height: "52px", borderRadius: "50%", background: "var(--accent)",
                          border: "1.5px solid var(--navy)", display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 900, fontSize: "1rem", color: "var(--navy)"
                        }}>
                          {work.title.replace(/[<>\s]/g, "").substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                    )}
                    
                    <span style={{
                      position: "absolute", top: "12px", right: "12px", background: "var(--navy)",
                      color: "#FFFFFF", padding: "4px 10px", borderRadius: "20px", fontSize: "0.62rem",
                      fontWeight: 700, zIndex: 1
                    }}>
                      {work.year}
                    </span>
                  </div>

                  {/* Visual Content info */}
                  <div className="work-card-info-wrapper" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                      <h4 className="work-card-title" style={{ fontSize: "1.1rem", fontWeight: 850, color: "var(--navy)", margin: 0, letterSpacing: "-0.01em" }}>
                        {work.title}
                      </h4>
                      {(work.role || work.genre) && (
                        <span className="mono work-card-role-year" style={{ fontSize: "0.65rem", color: "var(--accent-dark)", fontWeight: 800, display: "block", marginTop: "4px" }}>
                          {[work.role, work.genre].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      {work.venue && (
                        <span style={{ fontSize: "0.68rem", color: "var(--ink-muted)", display: "block", marginTop: "2px" }}>
                          📍 {work.venue}
                        </span>
                      )}
                    </div>

                    {work.description && (
                      <p className="work-card-desc" style={{
                        fontSize: "0.8rem", color: "var(--ink-muted)", lineHeight: 1.5, margin: 0,
                        display: "-webkit-box", WebkitLineClamp: "3", WebkitBoxOrient: "vertical", overflow: "hidden"
                      }}>
                        {work.description}
                      </p>
                    )}

                    <button
                      onClick={() => setActiveWork(work)}
                      className="btn-outline"
                      style={{
                        width: "100%", padding: "10px", borderRadius: "10px", fontSize: "0.78rem",
                        fontWeight: 800, cursor: "pointer", marginTop: "12px", display: "flex",
                        alignItems: "center", justifyContent: "center", gap: "4px"
                      }}
                    >
                      View Detail ↗
                    </button>
                    {work.externalLink && (
                      <a
                        href={work.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent-dark)", textAlign: "center", textDecoration: "none" }}
                      >
                        외부 링크 ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ──────────────── 4. ACTIVITY TIMELINE — current_activity + affiliations only ──────────────── */}
        {activityTimeline.length > 0 && (
          <section style={{ marginBottom: "64px" }}>
            <h3 className="display" style={{
              fontSize: "1.1rem", color: "var(--navy)", textTransform: "uppercase",
              borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "24px"
            }}>
              Activity Timeline
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderLeft: "1.5px solid var(--border)", paddingLeft: "16px", marginLeft: "8px" }}>
              {activityTimeline.map((entry, idx) => (
                <div key={idx} style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute", left: "-21px", top: "5px", width: "8px", height: "8px",
                    borderRadius: "50%", background: "#C8C2B7", border: "2px solid var(--bg-warm)"
                  }} />
                  <span className="mono" style={{ fontSize: "0.62rem", color: "var(--accent-dark)", fontWeight: 800, display: "block", marginBottom: "2px" }}>
                    {entry.year ? `${entry.year} · ${entry.label}` : entry.label}
                  </span>
                  <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", fontWeight: 600, margin: 0, lineHeight: 1.45 }}>
                    {entry.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ──────────────── 5. EDUCATION — plain strings, no separate year/school/major fields ──────────────── */}
        {educationList.length > 0 && (
          <section style={{ marginBottom: "64px" }}>
            <h3 className="display" style={{
              fontSize: "1.1rem", color: "var(--navy)", textTransform: "uppercase",
              borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "24px"
            }}>
              Education
            </h3>
            <div className="education-list" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {educationList.map((entry, idx) => (
                <div
                  key={idx}
                  className="education-row"
                  style={{
                    display: "grid", gridTemplateColumns: "100px 1fr", gap: "16px",
                    paddingBottom: "14px", borderBottom: idx < educationList.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-faint)", fontWeight: 700 }}>
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
          <section style={{ marginBottom: "64px" }}>
            <h3 className="display" style={{
              fontSize: "1.1rem", color: "var(--navy)", textTransform: "uppercase",
              borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "24px"
            }}>
              {splitAwardsAndCompetitions ? "Awards" : "Awards & Competitions"}
            </h3>
            <AwardRows items={splitAwardsAndCompetitions ? awardsList : [...awardsList, ...competitionsList]} />

            {splitAwardsAndCompetitions && competitionsList.length > 0 && (
              <>
                <h3 className="display" style={{
                  fontSize: "1.1rem", color: "var(--navy)", textTransform: "uppercase",
                  borderBottom: "1px solid var(--border)", paddingBottom: "12px", margin: "40px 0 24px"
                }}>
                  Competitions
                </h3>
                <AwardRows items={competitionsList} />
              </>
            )}
          </section>
        )}

        {/* ──────────────── 7. REVIEWS & ARTICLES — review_links, flat list ──────────────── */}
        {reviewItems.length > 0 && (
          <section style={{ marginBottom: "80px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1.5px solid var(--navy)", paddingBottom: "12px", marginBottom: "8px" }}>
              <h3 className="display" style={{
                fontSize: "1.15rem", color: "var(--navy)", textTransform: "uppercase", margin: 0
              }}>
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
                    padding: "14px 4px", borderTop: idx > 0 ? "1px solid var(--border)" : "none",
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                      <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--navy)", overflowWrap: "break-word" }}>
                        {title}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                        {subtitle}
                      </span>
                    </div>
                    {url && (
                      <span style={{
                        fontSize: "0.72rem", border: "1px solid var(--navy)", borderRadius: "20px",
                        padding: "5px 12px", color: "var(--navy)", background: "#FFFFFF",
                        fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0, marginLeft: "12px",
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
                    style={{ textDecoration: "none", color: "inherit", borderRadius: "8px" }}
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

        {/* ──────────────── 6. DIGITAL ARTIST CARD HERO (맨 밑에 배치) ──────────────── */}
        <section style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          marginBottom: "80px", borderTop: "1.5px solid var(--border)", paddingTop: "48px"
        }}>
          <div style={{ maxWidth: "600px", width: "100%", textAlign: "center", marginBottom: "32px" }}>
            <span className="mono" style={{ fontSize: "0.72rem", color: "var(--accent-dark)", fontWeight: 850, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              POPOK DIGITAL PASS CARD
            </span>
            <h3 style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--navy)", marginTop: "6px", letterSpacing: "-0.02em" }}>
              Official Creative ID
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }}>
              아티스트의 신원을 인증하고 간편하게 정보를 전달하는 디지털 명함 카드입니다.
            </p>
          </div>

          {/* Popok Card aligned (Click to flip) */}
          <div style={{ width: "100%", display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <PopokCard
              name={artist.name}
              nameEn={artist.name_en}
              genre={artist.genre}
              instagram={artist.instagram}
              id={artist.id}
              slug={artist.slug || artist.id}
              profileImage={artist.profileImage}
            />
          </div>

          {/* Action layout buttons */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button 
              onClick={handleShareUrl}
              className="btn-outline"
              style={{ padding: "10px 24px", borderRadius: "30px", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer" }}
            >
              🔗 Copy URL
            </button>
            <button 
              onClick={handleDownloadQr}
              className="btn-outline"
              style={{ padding: "10px 24px", borderRadius: "30px", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer" }}
            >
              💾 Save QR
            </button>
          </div>
        </section>

        {/* ──────────────── 7. FOOTER METRICS ──────────────── */}
        <footer style={{
          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "20px",
          borderTop: "1px solid var(--border)", paddingTop: "24px",
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

      {/* ──────────────── 8. WORK DETAIL BOTTOM SHEET PANEL (Embedded video & fallbacks) ──────────────── */}
      {activeWork && parsedActiveMedia && (
        <>
          {/* Dimmed Blur Backdrop Overlay */}
          <div className="bottom-sheet-overlay" onClick={() => setActiveWork(null)} />
          
          {/* Sliding Bottom Panel Drawer */}
          <div className="bottom-sheet-panel">
            
            {/* Top Drag Handle Indicator Bar */}
            <div style={{ width: "40px", height: "4px", background: "#EAE6DD", borderRadius: "2px", margin: "12px auto 6px auto", flexShrink: 0 }} />

            {/* Main scrollable body */}
            <div style={{ overflowY: "auto", padding: "12px 32px 32px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Header Info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                <span className="mono" style={{ fontSize: "0.68rem", color: "var(--accent-dark)", fontWeight: 800 }}>
                  PROJECT SPEC SHEET
                </span>
                <button
                  onClick={() => setActiveWork(null)}
                  style={{
                    width: "28px", height: "28px", borderRadius: "50%", border: "1px solid var(--border)",
                    background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "0.75rem", color: "var(--navy)"
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Grid content split on desktop */}
              <div className="responsive-stack-320" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "32px" }}>
                
                {/* Left: Embedded Video Player / Project Image / Logo Placeholder */}
                <div style={{
                  width: "100%",
                  aspectRatio: parsedActiveMedia.type === "youtube"
                    ? ((parsedActiveMedia as any).aspectRatio || getYouTubePreviewAspectRatio(parsedActiveMedia.url || ""))
                    : (parsedActiveMedia.type === "vimeo" || parsedActiveMedia.type === "video") ? "16 / 9" : "4 / 3",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  background: "#171411",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative"
                }}>
                  {activeWork.image && !activeWork.image.includes("cake-placeholder") ? (
                    <img
                      src={activeWork.image}
                      alt={activeWork.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    /* Lime/Cream Typographic POPOK Logo Placeholder instead of cake slice */
                    <div style={{
                      width: "100%", height: "100%", display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", background: "#FAF8F5", padding: "24px"
                    }}>
                      <div style={{
                        fontWeight: 950, fontSize: "1.5rem", color: "var(--navy)", letterSpacing: "-0.04em",
                        display: "inline-flex", alignItems: "center", gap: "2px", marginBottom: "16px"
                      }}>
                        POPOK
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
                      </div>
                      <div style={{
                        width: "72px", height: "72px", borderRadius: "50%", background: "var(--accent)",
                        border: "2px solid var(--navy)", display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 950, fontSize: "1.35rem", color: "var(--navy)"
                      }}>
                        {activeWork.title.replace(/[<>\s]/g, "").substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Technical Spec Sheet details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "6px" }}>
                      <h4 style={{ fontSize: "1.35rem", fontWeight: 950, color: "var(--navy)", margin: 0 }}>
                        {activeWork.title}
                      </h4>
                      <span className="mono" style={{ color: "var(--ink-muted)", fontSize: "0.8rem" }}>({activeWork.year})</span>
                    </div>
                    {activeWork.role && (
                      <span className="tag" style={{ background: "var(--accent)", color: "var(--navy)", border: "none", fontSize: "0.65rem", fontWeight: 800 }}>
                        {activeWork.role}
                      </span>
                    )}
                  </div>

                  {activeWork.description && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span className="mono" style={{ fontSize: "0.6rem", color: "var(--ink-faint)", fontWeight: 700, letterSpacing: "0.05em" }}>
                        PROJECT DESCRIPTION
                      </span>
                      <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", lineHeight: 1.6, margin: 0 }}>
                        {activeWork.description}
                      </p>
                    </div>
                  )}

                  {activeWork.credits && (
                    <div style={{
                      display: "flex", flexDirection: "column", gap: "6px", background: "#FAF8F5",
                      border: "1px solid var(--border)", padding: "16px", borderRadius: "12px"
                    }}>
                      <span className="mono" style={{ fontSize: "0.6rem", color: "var(--ink-faint)", fontWeight: 700, letterSpacing: "0.05em" }}>
                        CREDITS / CONTRIBUTORS
                      </span>
                      <p style={{ fontSize: "0.78rem", color: "var(--navy)", fontWeight: 700, fontFamily: "monospace", margin: 0, lineHeight: 1.4 }}>
                        {activeWork.credits}
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Video button footer action */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px", marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--ink-muted)", fontFamily: "monospace" }}>
                  <span>ARCHIVE ID</span>
                  <span style={{ fontWeight: 800, color: "var(--navy)" }}>{activeWork.id}</span>
                </div>
                
                {activeWork.videoUrl ? (
                  <a
                    href={activeWork.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-lime"
                    style={{
                      textDecoration: "none", display: "block", textAlign: "center", padding: "14px",
                      borderRadius: "24px", fontSize: "0.85rem", fontWeight: 800, cursor: "pointer"
                    }}
                  >
                    Watch Video ↗
                  </a>
                ) : (
                  <button
                    disabled
                    style={{
                      display: "block", width: "100%", padding: "14px", borderRadius: "24px",
                      border: "none", background: "var(--border)", color: "var(--ink-faint)",
                      fontSize: "0.85rem", fontWeight: 700, cursor: "not-allowed"
                    }}
                  >
                    No External Video Available
                  </button>
                )}
              </div>

            </div>

          </div>
        </>
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
            padding: "14px 0", borderTop: idx > 0 ? "1px solid var(--border)" : "none",
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
