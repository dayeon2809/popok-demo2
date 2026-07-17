"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { analytics } from "@/lib/analytics";
import { useArtists } from "@/lib/api";
import { LoadingSpinner, ErrorMessage, EmptyState } from "@/components/ui/States";
import YouTubeMotionPreview from "@/components/YouTubeMotionPreview";
import { isYouTubeUrl } from "@/lib/youtube";
import type { ArtistFilter, ArtistField, ArtistType, Artist } from "@/types";

const CATEGORIES = [
  { key: "all", label: "ALL" },
  { key: "dance", label: "DANCE" },
  { key: "music", label: "MUSIC" },
  { key: "visual", label: "VISUAL" },
];

const DANCE_SUB_FIELDS = [
  { key: "all", label: "ALL DANCE" },
  { key: "contemporary", label: "CONTEMPORARY" },
  { key: "ballet", label: "BALLET" },
  { key: "korean", label: "KOREAN DANCE" },
];

const TYPES = [
  { key: "all", label: "ALL TYPES" },
  { key: "individual", label: "INDIVIDUAL" },
  { key: "group", label: "GROUP / TEAM" },
];

const CHOSUNGS = ["all", "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "A-Z"];

function getChosung(name: string): string {
  if (!name) return "";
  const char = name.trim().charAt(0);
  const code = char.charCodeAt(0);

  if (code >= 0xAC00 && code <= 0xD7A3) {
    const choIndex = Math.floor((code - 0xAC00) / 28 / 21);
    const chosungs = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    const cho = chosungs[choIndex];
    if (cho === 'ㄲ') return 'ㄱ';
    if (cho === 'ㄸ') return 'ㄷ';
    if (cho === 'ㅃ') return 'ㅂ';
    if (cho === 'ㅆ') return 'ㅅ';
    if (cho === 'ㅉ') return 'ㅈ';
    return cho;
  }

  if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
    return char.toUpperCase();
  }

  return "";
}

export default function ArtistsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState<string>(() => searchParams.get("q") || "");
  const [selectedField, setSelectedField] = useState<string>(() => searchParams.get("category") || "dance");
  const [selectedSubField, setSelectedSubField] = useState<string>(() => searchParams.get("sub") || "all");
  const [selectedType, setSelectedType] = useState<string>(() => searchParams.get("type") || "all");
  const [selectedConsonant, setSelectedConsonant] = useState<string>(() => searchParams.get("cho") || "all");

  // Keep the URL in sync with the current filters (via replace, so browser back
  // returns to the exact filtered view instead of piling up history entries).
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedField !== "all") params.set("category", selectedField);
    if (selectedSubField !== "all") params.set("sub", selectedSubField);
    if (selectedType !== "all") params.set("type", selectedType);
    if (selectedConsonant !== "all") params.set("cho", selectedConsonant);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedField, selectedSubField, selectedType, selectedConsonant]);

  // Debounce and track search query
  useEffect(() => {
    if (!query) return;
    const timer = setTimeout(() => {
      analytics.search(query);
    }, 1000);

    return () => clearTimeout(timer);
  }, [query]);

  const danceSliderRef = useRef<HTMLDivElement>(null);
  const musicSliderRef = useRef<HTMLDivElement>(null);
  const visualSliderRef = useRef<HTMLDivElement>(null);
  const pausedRowsRef = useRef<Record<string, boolean>>({ dance: false, music: false, visual: false });
  const resumeTimersRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({ dance: null, music: null, visual: null });

  const pauseRowTemporarily = (row: "dance" | "music" | "visual", delay = 8000) => {
    pausedRowsRef.current[row] = true;
    const t = resumeTimersRef.current[row];
    if (t) clearTimeout(t);
    resumeTimersRef.current[row] = setTimeout(() => { pausedRowsRef.current[row] = false; }, delay);
  };

  const setRowPaused = (row: "dance" | "music" | "visual", paused: boolean) => {
    pausedRowsRef.current[row] = paused;
    const t = resumeTimersRef.current[row];
    if (t) clearTimeout(t);
    resumeTimersRef.current[row] = null;
  };

  const scrollSlider = (row: "dance" | "music" | "visual", dir: "left" | "right") => {
    pauseRowTemporarily(row);
    const ref = row === "dance" ? danceSliderRef : row === "music" ? musicSliderRef : visualSliderRef;
    if (ref.current) ref.current.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
  };

  // RAF auto-scroll moved below artists declaration
  const getApiFieldFilter = () => {
    if (selectedField === "dance" && selectedSubField !== "all") {
      return selectedSubField;
    }
    return selectedField;
  };

  const filter: ArtistFilter = {
    query,
    type: selectedType as ArtistType | "all",
    field: getApiFieldFilter() as ArtistField | "all",
  };

  const { artists, loading, error } = useArtists(filter);

  // RAF auto-scroll — active for visible rows
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const activeRows = [
      { key: "dance" as const, ref: danceSliderRef, speed: 28 },
      { key: "music" as const, ref: musicSliderRef, speed: 22 },
      { key: "visual" as const, ref: visualSliderRef, speed: 25 },
    ].filter((row) => selectedField === "all" || selectedField === row.key);

    let lastTs: number | null = null;
    let rafId: number;
    const step = (ts: number) => {
      if (lastTs === null) lastTs = ts;
      const dt = Math.min(ts - lastTs, 50) / 1000;
      lastTs = ts;
      activeRows.forEach(({ key, ref, speed }) => {
        const node = ref.current;
        if (!node || pausedRowsRef.current[key] || node.scrollWidth <= node.clientWidth) return;
        const next = node.scrollLeft + speed * dt;
        node.scrollLeft = next + node.clientWidth >= node.scrollWidth - 1 ? 0 : next;
      });
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafId);
      Object.values(resumeTimersRef.current).forEach((t) => { if (t) clearTimeout(t); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedField, artists.length]);


  const cleanInstagramHandle = (url: string | null | undefined) => {
    if (!url) return "@username";
    const cleaned = url.trim();
    if (cleaned.startsWith("@")) return cleaned;
    try {
      const rawPath = cleaned
        .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, "")
        .replace(/\/$/, "");
      const username = rawPath.split("/")[0].split("?")[0];
      return username ? `@${username}` : "@username";
    } catch (e) {
      return `@${url}`;
    }
  };

  const getGenreLabel = (genre?: string) => {
    if (!genre) return "Creative Artist";
    const g = genre.toLowerCase();
    if (g === "contemporary" || g === "contemporary_dance") return "Contemporary";
    if (g === "ballet") return "Ballet";
    if (g === "traditional" || g === "korean" || g === "korean_dance") return "Traditional Korean";
    if (g === "media art" || g === "media_art") return "Media Art";
    if (g === "photography") return "Photography";
    if (g === "installation") return "Installation Art";
    if (g === "sound art" || g === "sound_art") return "Sound Art";
    if (g === "composition") return "Composition";
    if (g === "ensemble") return "Chamber Ensemble";

    return genre.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  // Partition fetched artists into respective horizontal showcase categories
  const allFetched = artists || [];
  let danceArtists = allFetched.filter((a) => {
    const f = a.field || "dance";
    return f === "dance" || f === "contemporary_dance" || f === "korean_dance" || f === "ballet" || f === "interdisciplinary";
  });

  if (selectedField === "dance" && selectedConsonant !== "all") {
    danceArtists = danceArtists.filter((a) => {
      const cho = getChosung(a.name);
      if (selectedConsonant === "A-Z") {
        return /^[A-Z]$/.test(cho);
      }
      return cho === selectedConsonant;
    });
  }
  const musicArtists = allFetched.filter((a) => a.field === "music");
  const visualArtists = allFetched.filter((a) => a.field === "visual");

  const totalResultsCount = selectedField === "all"
    ? (danceArtists.length + musicArtists.length + visualArtists.length)
    : selectedField === "dance"
      ? danceArtists.length
      : selectedField === "music"
        ? musicArtists.length
        : visualArtists.length;

  const renderSliderRow = (
    title: string,
    key: "dance" | "music" | "visual",
    artistsList: Artist[],
    sliderRef: React.RefObject<HTMLDivElement | null>
  ) => {
    if (artistsList.length === 0) return null;

    return (
      <div key={key} style={{ marginBottom: "56px" }}>
        {/* Row Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 900, color: "var(--navy)", textTransform: "uppercase" }}>
              {title}
            </h3>
            <span style={{ fontSize: "0.85rem", color: "var(--ink-muted)", fontWeight: 600 }}>
              ({artistsList.length})
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => scrollSlider(key, "left")}
              aria-label={`scroll left ${title}`}
              className="btn-outline"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              ←
            </button>
            <button
              onClick={() => scrollSlider(key, "right")}
              aria-label={`scroll right ${title}`}
              className="btn-outline"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              →
            </button>
          </div>
        </div>

        {/* Horizontal Slider */}
        <div
          ref={sliderRef}
          onMouseEnter={() => setRowPaused(key, true)}
          onMouseLeave={() => setRowPaused(key, false)}
          onPointerDown={() => pauseRowTemporarily(key)}
          onTouchStart={() => pauseRowTemporarily(key)}
          onWheel={() => pauseRowTemporarily(key)}
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: "24px",
            overflowX: "auto",
            paddingBottom: "24px",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {artistsList.map((artist) => (
            <ShowcaseCard
              key={artist.id}
              artist={artist}
              slider={true}
              cleanInstagramHandle={cleanInstagramHandle}
              getGenreLabel={getGenreLabel}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderGallery = (title: string, artistsList: Artist[]) => {
    if (artistsList.length === 0) return null;

    return (
      <div style={{ marginBottom: "56px" }}>
        {/* Gallery Header */}
        <div style={{
          display: "flex",
          alignItems: "baseline",
          gap: "8px",
          marginBottom: "28px",
          borderBottom: "1.5px solid var(--border)",
          paddingBottom: "12px"
        }}>
          <h3 style={{ fontSize: "1.35rem", fontWeight: 900, color: "var(--navy)", textTransform: "uppercase" }}>
            {title}
          </h3>
          <span style={{ fontSize: "0.85rem", color: "var(--ink-muted)", fontWeight: 600 }}>
            ({artistsList.length})
          </span>
        </div>

        {/* Gallery Grid */}
        <div className="gallery-grid">
          {artistsList.map((artist) => (
            <ShowcaseCard
              key={artist.id}
              artist={artist}
              slider={false}
              cleanInstagramHandle={cleanInstagramHandle}
              getGenreLabel={getGenreLabel}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 32px 80px" }}>

      {/* CSS Hover Transitions helper */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .showcase-card {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .showcase-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(23, 20, 17, 0.12) !important;
        }
        .showcase-card:hover img {
          filter: contrast(1.02) !important;
          transform: scale(1.03);
        }
        .showcase-card:hover .arrow-btn {
          background-color: var(--accent) !important;
          color: var(--navy) !important;
          border-color: transparent !important;
        }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 28px 24px;
        }
        .gallery-card-wrapper {
          aspect-ratio: 0.68;
          min-height: 320px;
        }
        @media (max-width: 768px) {
          .gallery-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px 12px !important;
          }
          .gallery-card-wrapper {
            min-height: 200px !important;
          }
          .gallery-card-wrapper .showcase-card-meta {
            padding: 12px 10px !important;
            gap: 6px !important;
          }
          .gallery-card-wrapper .showcase-card h4 {
            font-size: 0.95rem !important;
          }
          .gallery-card-wrapper .showcase-card p {
            font-size: 0.6rem !important;
          }
          .gallery-card-wrapper .showcase-card .arrow-btn {
            width: 22px !important;
            height: 22px !important;
            font-size: 0.65rem !important;
          }
          .gallery-card-wrapper .showcase-card span.mono {
            font-size: 0.58rem !important;
          }
        }
      `}} />

      {/* Page Headline */}
      <div style={{ marginBottom: "40px" }}>
        <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 700, letterSpacing: "0.15em", display: "block", marginBottom: "8px" }}>
          POPOK DIRECTORY
        </span>
        <h1 className="display" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", color: "var(--navy)", fontWeight: 900, letterSpacing: "-0.03em" }}>
          Creative Showcase.
        </h1>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div style={{ marginBottom: "32px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search Input */}
        <div style={{ position: "relative", flexGrow: 1, minWidth: "280px" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름, 장르, 대표작 등으로 검색..."
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "0.95rem",
              borderRadius: "12px",
              border: "1.5px solid var(--border)",
              background: "#FFFFFF",
            }}
          />
        </div>
        
        {/* Category Pill Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                setSelectedField(cat.key);
                setSelectedSubField("all");
                setSelectedConsonant("all");
              }}
              style={{
                padding: "10px 18px",
                borderRadius: "20px",
                fontSize: "0.85rem",
                fontWeight: 700,
                border: selectedField === cat.key ? "1.5px solid var(--navy)" : "1.5px solid var(--border)",
                backgroundColor: selectedField === cat.key ? "var(--navy)" : "#FFFFFF",
                color: selectedField === cat.key ? "#FFFFFF" : "var(--navy)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-genre Filters for DANCE */}
      {selectedField === "dance" && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px", padding: "0 4px" }}>
          {DANCE_SUB_FIELDS.map((sub) => (
            <button
              key={sub.key}
              onClick={() => setSelectedSubField(sub.key)}
              style={{
                padding: "8px 14px",
                borderRadius: "16px",
                fontSize: "0.78rem",
                fontWeight: 700,
                border: selectedSubField === sub.key ? "1.5px solid var(--navy)" : "1.5px solid var(--border)",
                backgroundColor: selectedSubField === sub.key ? "var(--navy)" : "transparent",
                color: selectedSubField === sub.key ? "#FFFFFF" : "var(--ink-muted)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* Korean Consonant/Alphabet Filters for DANCE */}
      {selectedField === "dance" && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "32px", padding: "0 4px", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
          {CHOSUNGS.map((cho) => (
            <button
              key={cho}
              onClick={() => setSelectedConsonant(cho)}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: selectedConsonant === cho ? 800 : 500,
                border: "none",
                backgroundColor: selectedConsonant === cho ? "var(--border-dark)" : "transparent",
                color: selectedConsonant === cho ? "var(--navy)" : "var(--ink-muted)",
                cursor: "pointer",
              }}
            >
              {cho}
            </button>
          ))}
        </div>
      )}

      {/* Type Filters (ALL TYPES, INDIVIDUAL, GROUP/TEAM) */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "40px" }}>
        {TYPES.map((type) => (
          <button
            key={type.key}
            onClick={() => setSelectedType(type.key)}
            style={{
              padding: "8px 14px",
              borderRadius: "20px",
              fontSize: "0.78rem",
              fontWeight: 700,
              border: selectedType === type.key ? "1.5px solid var(--navy)" : "1.5px solid var(--border)",
              backgroundColor: selectedType === type.key ? "var(--navy)" : "transparent",
              color: selectedType === type.key ? "#FFFFFF" : "var(--ink-muted)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* ── ARTISTS DIRECTORY RESULT LIST ── */}
      {loading ? (
        <LoadingSpinner message="아티스트 목록을 불러오는 중..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : totalResultsCount === 0 ? (
        <EmptyState message="검색 결과가 없습니다." />
      ) : (
        <div style={{ minHeight: "400px" }}>
          {selectedField === "all" ? (
            <>
              {renderSliderRow("DANCE", "dance", danceArtists, danceSliderRef)}
              {renderSliderRow("MUSIC", "music", musicArtists, musicSliderRef)}
              {renderSliderRow("VISUAL", "visual", visualArtists, visualSliderRef)}
            </>
          ) : selectedField === "dance" ? (
            renderGallery("DANCE", danceArtists)
          ) : selectedField === "music" ? (
            renderGallery("MUSIC", musicArtists)
          ) : (
            renderGallery("VISUAL", visualArtists)
          )}
        </div>
      )}
    </div>
  );
}

// Separate Mini Card Sub-component
function ShowcaseCard({ artist, slider = false, cleanInstagramHandle, getGenreLabel }: {
  artist: Artist;
  slider?: boolean;
  cleanInstagramHandle: (url: string | null | undefined) => string;
  getGenreLabel: (genre?: string) => string;
}) {
  const worksList = artist.works ?? artist.portfolio_works;
  const firstWork = Array.isArray(worksList) ? (worksList[0] as any) : null;
  const previewUrl = artist.motion_video_url || "";
  const hasYoutubePreview = isYouTubeUrl(previewUrl);

  return (
    <div
      className={slider ? "" : "gallery-card-wrapper"}
      style={{
        ...(slider ? { flexShrink: 0, width: "260px", scrollSnapAlign: "start" } : {}),
        aspectRatio: "0.68",
        minHeight: slider ? "320px" : undefined,
      }}
    >
      <Link
        href={`/artists/${artist.id}`}
        style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
      >
        <div
          className="showcase-card"
          style={{
            width: "100%", height: "100%", position: "relative",
            borderRadius: "20px", border: "1.5px solid var(--border)",
            background: "#FFFFFF", overflow: "hidden",
            boxShadow: "0 8px 24px rgba(23, 20, 17, 0.04)",
            display: "flex", flexDirection: "column", justifyContent: "space-between"
          }}
        >

          {/* Grayscale zoom image background */}
          <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "#171411" }}>
            {hasYoutubePreview ? (
              <YouTubeMotionPreview
                videoUrl={previewUrl}
                title={`${artist.name} motion preview`}
                aspectRatio="9 / 16"
                playMode="hover"
                fill
                previewStart={firstWork?.previewStart ?? firstWork?.preview_start ?? 0}
                previewEnd={firstWork?.previewEnd ?? firstWork?.preview_end ?? 15}
              />
            ) : (
              <img
                src={artist.profileImage || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(artist.name)}`}
                alt={artist.name}
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  filter: "contrast(1.02) brightness(0.9)",
                  transition: "transform 0.5s ease, filter 0.5s ease"
                }}
              />
            )}
          </div>

          {/* Dark gradient overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(23,20,17,0.95) 0%, rgba(23,20,17,0.3) 50%, rgba(23,20,17,0) 100%)",
            zIndex: 1
          }} />

          {/* Card Label Tag at top */}
          <div style={{
            position: "absolute", top: "16px", left: "16px", zIndex: 2
          }}>
            <span className="mono" style={{
              fontSize: "0.55rem", background: "var(--navy)", color: "#FFFFFF",
              padding: "4px 10px", borderRadius: "12px", fontWeight: 800,
              border: "1px solid rgba(255,255,255,0.2)"
            }}>
              {getGenreLabel(artist.genre)}
            </span>
          </div>

          {/* Metadata overlays at bottom */}
          <div className="showcase-card-meta" style={{
            position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px",
            zIndex: 2, display: "flex", flexDirection: "column", gap: "12px"
          }}>
            <div>
              {/* Name & English name */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <h4 style={{ color: "#FFFFFF", fontSize: "1.2rem", fontWeight: 900, margin: 0 }}>
                  {artist.name}
                </h4>
                {artist.name_en && (
                  <span className="mono" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.6rem" }}>
                    {artist.name_en}
                  </span>
                )}
              </div>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.72rem", margin: "2px 0 0 0" }}>
                {artist.company || "Independent Artist"}
              </p>
            </div>

            {/* Bottom panel action trigger link */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "10px"
            }}>
              <span className="mono" style={{ fontSize: "0.68rem", color: "var(--accent)", fontWeight: 800 }}>
                {cleanInstagramHandle(artist.instagram)}
              </span>
              <span
                className="arrow-btn"
                style={{
                  width: "28px", height: "28px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.3)",
                  color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", transition: "all 0.3s ease"
                }}
              >
                ↗
              </span>
            </div>
          </div>

        </div>
      </Link>
    </div>
  );
}
