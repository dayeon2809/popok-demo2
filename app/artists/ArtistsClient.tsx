"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useArtists } from "@/lib/api";
import { LoadingSpinner, ErrorMessage, EmptyState } from "@/components/ui/States";
import YouTubeMotionPreview from "@/components/YouTubeMotionPreview";
import { isYouTubeUrl } from "@/lib/youtube";
import type { ArtistFilter, ArtistField, ArtistType, Artist } from "@/types";

const CATEGORIES = [
  { key: "all", label: "ALL" },
  { key: "dance", label: "DANCE" },
  { key: "music", label: "MUSIC (준비중)" },
  { key: "visual", label: "VISUAL (준비중)" },
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
  const [selectedField, setSelectedField] = useState<string>(() => searchParams.get("category") || "all");
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

  const danceSliderRef = useRef<HTMLDivElement>(null);
  const musicSliderRef = useRef<HTMLDivElement>(null);
  const visualSliderRef = useRef<HTMLDivElement>(null);
  const pausedRowsRef = useRef<Record<string, boolean>>({ dance: false, music: false, visual: false });
  const resumeTimersRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({ dance: null, music: null, visual: null });

  const pauseRowTemporarily = (row: "dance" | "music" | "visual", delay = 2600) => {
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

  // RAF auto-scroll — only active in ALL mode
  useEffect(() => {
    if (selectedField !== "all") return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    const rows = [
      { key: "dance" as const, ref: danceSliderRef, speed: 28 },
      { key: "music" as const, ref: musicSliderRef, speed: 22 },
      { key: "visual" as const, ref: visualSliderRef, speed: 25 },
    ];
    let lastTs: number | null = null;
    let rafId: number;
    const step = (ts: number) => {
      if (lastTs === null) lastTs = ts;
      const dt = Math.min(ts - lastTs, 50) / 1000;
      lastTs = ts;
      rows.forEach(({ key, ref, speed }) => {
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
    ? allFetched.length
    : selectedField === "dance"
      ? danceArtists.length
      : 1; // Force 1 so that the under construction placeholder renders instead of EmptyState

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
          filter: grayscale(0) contrast(1.02) !important;
          transform: scale(1.05);
        }
        .showcase-card:hover .arrow-btn {
          background-color: var(--accent) !important;
          color: var(--navy) !important;
          border-color: transparent !important;
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
        <p style={{ fontSize: "0.95rem", color: "var(--ink-muted)", marginTop: "8px" }}>
          다양한 장르의 크리에이터가 선보이는 디지털 명함을 탐색하고 네트워크를 연결해 보세요.
        </p>
      </div>

      {/* Filters Panel */}
      <div style={{
        background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "16px",
        padding: "24px", marginBottom: "56px", display: "flex", flexDirection: "column", gap: "20px",
        boxShadow: "0 4px 20px rgba(23, 20, 17, 0.02)"
      }}>
        {/* Search */}
        <div>
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
            Search Creator Name
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="아티스트명, 단체명, 장르 또는 키워드 검색..."
            style={{
              width: "100%", padding: "12px 16px", border: "1px solid var(--border)",
              borderRadius: "10px", outline: "none", fontSize: "0.95rem", color: "var(--navy)", background: "#FFFFFF"
            }}
            onFocus={(e) => e.target.style.borderColor = "var(--navy)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        {/* Category Selector Tabs */}
        <div>
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
            Category
          </label>
          <div style={{ overflowX: "auto" }} className="no-scrollbar">
            <div style={{ display: "flex", gap: "8px", whiteSpace: "nowrap" }}>
              {CATEGORIES.map((c) => {
                const active = selectedField === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => {
                      setSelectedField(c.key);
                      setSelectedSubField("all");
                      setSelectedConsonant("all");
                    }}
                    style={{
                      padding: "8px 18px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 800,
                      border: active ? "1.5px solid var(--navy)" : "1px solid var(--border)",
                      cursor: "pointer",
                      background: active ? "var(--navy)" : "transparent",
                      color: active ? "#FFFFFF" : "var(--navy)",
                      transition: "all 0.18s ease"
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Conditionally Rendered Dance Sub-Filters */}
        {selectedField === "dance" && (
          <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "12px" }}>
            <label style={{ display: "block", fontSize: "0.62rem", fontWeight: 800, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              Dance Genre
            </label>
            <div style={{ overflowX: "auto" }} className="no-scrollbar">
              <div style={{ display: "flex", gap: "8px", whiteSpace: "nowrap" }}>
                {DANCE_SUB_FIELDS.map((sub) => {
                  const active = selectedSubField === sub.key;
                  return (
                    <button
                      key={sub.key}
                      onClick={() => {
                        setSelectedSubField(sub.key);
                        setSelectedConsonant("all");
                      }}
                      style={{
                        padding: "6px 14px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700,
                        border: active ? "1.5px solid var(--ink-muted)" : "1px solid var(--border)",
                        cursor: "pointer",
                        background: active ? "var(--ink-muted)" : "transparent",
                        color: active ? "#FFFFFF" : "var(--ink-muted)",
                        transition: "all 0.18s ease"
                      }}
                    >
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Conditionally Rendered Name Consonant (초성) Filter */}
        {selectedField === "dance" && (
          <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "12px" }}>
            <label style={{ display: "block", fontSize: "0.62rem", fontWeight: 800, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              이름 초성 필터
            </label>
            <div style={{ overflowX: "auto" }} className="no-scrollbar">
              <div style={{ display: "flex", gap: "6px", whiteSpace: "nowrap" }}>
                {CHOSUNGS.map((cho) => {
                  const active = selectedConsonant === cho;
                  return (
                    <button
                      key={cho}
                      onClick={() => setSelectedConsonant(cho)}
                      style={{
                        padding: "5px 11px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: active ? 800 : 500,
                        border: active ? "1.5px solid var(--navy)" : "1px solid var(--border)",
                        cursor: "pointer",
                        background: active ? "var(--navy)" : "transparent",
                        color: active ? "#FFFFFF" : "var(--navy)",
                        transition: "all 0.18s ease",
                        minWidth: cho === "all" || cho === "A-Z" ? "42px" : "28px"
                      }}
                    >
                      {cho === "all" ? "전체" : cho}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Type Selector Tabs */}
        <div>
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
            Type
          </label>
          <div style={{ overflowX: "auto" }} className="no-scrollbar">
            <div style={{ display: "flex", gap: "8px", whiteSpace: "nowrap" }}>
              {TYPES.map((t) => {
                const active = selectedType === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setSelectedType(t.key)}
                    style={{
                      padding: "6px 14px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 800,
                      border: active ? "1.5px solid var(--navy)" : "1px solid var(--border)",
                      cursor: "pointer",
                      background: active ? "var(--navy)" : "transparent",
                      color: active ? "#FFFFFF" : "var(--navy)",
                      transition: "all 0.18s ease"
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Main List Container */}
      {loading ? (
        <LoadingSpinner message="아티스트 리스트를 불러오고 있습니다..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : totalResultsCount === 0 ? (
        <EmptyState message="필터링 조건에 부합하는 아티스트가 없습니다." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "64px" }}>

          {/* ─── 01. DANCE ─── */}
          {(selectedField === "all" || selectedField === "dance") && danceArtists.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1.5px solid var(--navy)", paddingBottom: "12px", marginBottom: "24px" }}>
                <div>
                  <h3 className="display" style={{ fontSize: "1.35rem", color: "var(--navy)", textTransform: "uppercase", margin: 0, fontWeight: 950 }}>01. DANCE</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", margin: "4px 0 0 0" }}>Bodies in motion.</p>
                </div>
                {selectedField === "all" && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => scrollSlider("dance", "left")} className="btn-outline" style={{ width: "32px", height: "32px", borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", cursor: "pointer" }}>←</button>
                    <button onClick={() => scrollSlider("dance", "right")} className="btn-outline" style={{ width: "32px", height: "32px", borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", cursor: "pointer" }}>→</button>
                  </div>
                )}
              </div>
              {selectedField === "all" ? (
                <div
                  ref={danceSliderRef}
                  onMouseEnter={() => setRowPaused("dance", true)}
                  onMouseLeave={() => setRowPaused("dance", false)}
                  onPointerDown={() => pauseRowTemporarily("dance")}
                  style={{ display: "flex", gap: "20px", overflowX: "auto", padding: "8px 0 24px", scrollSnapType: "x mandatory" }}
                  className="no-scrollbar"
                >
                  {danceArtists.map((a) => <ShowcaseCard key={a.id} artist={a} slider cleanInstagramHandle={cleanInstagramHandle} getGenreLabel={getGenreLabel} />)}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
                  {danceArtists.map((a) => <ShowcaseCard key={a.id} artist={a} cleanInstagramHandle={cleanInstagramHandle} getGenreLabel={getGenreLabel} />)}
                </div>
              )}
            </div>
          )}

          {/* ─── 02. MUSIC ─── */}
          {(selectedField === "all" || selectedField === "music") && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1.5px solid var(--navy)", paddingBottom: "12px", marginBottom: "24px" }}>
                <div>
                  <h3 className="display" style={{ fontSize: "1.35rem", color: "var(--navy)", textTransform: "uppercase", margin: 0, fontWeight: 950 }}>02. MUSIC (준비중)</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", margin: "4px 0 0 0" }}>Artists of sound.</p>
                </div>
              </div>
              <div style={{
                background: "#FAF8F5",
                border: "1.5px dashed var(--border)",
                borderRadius: "16px",
                padding: "36px 20px",
                textAlign: "center",
                marginTop: "8px",
                marginBottom: "24px"
              }}>
                <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "12px" }}>🎵</span>
                <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", margin: 0, fontWeight: 600, wordBreak: "keep-all" }}>
                  준비중입니다! 조금만 기다려주세요..
                </p>
              </div>
            </div>
          )}

          {/* ─── 03. VISUAL ─── */}
          {(selectedField === "all" || selectedField === "visual") && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1.5px solid var(--navy)", paddingBottom: "12px", marginBottom: "24px" }}>
                <div>
                  <h3 className="display" style={{ fontSize: "1.35rem", color: "var(--navy)", textTransform: "uppercase", margin: 0, fontWeight: 950 }}>03. VISUAL (준비중)</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", margin: "4px 0 0 0" }}>Ways of seeing.</p>
                </div>
              </div>
              <div style={{
                background: "#FAF8F5",
                border: "1.5px dashed var(--border)",
                borderRadius: "16px",
                padding: "36px 20px",
                textAlign: "center",
                marginTop: "8px",
                marginBottom: "24px"
              }}>
                <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "12px" }}>🎨</span>
                <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", margin: 0, fontWeight: 600, wordBreak: "keep-all" }}>
                  준비중입니다! 조금만 기다려주세요..
                </p>
              </div>
            </div>
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
  const firstWork = Array.isArray(artist.portfolio_works) ? (artist.portfolio_works[0] as any) : null;
  const previewUrl = artist.video_url || firstWork?.videoUrl || firstWork?.video_url || firstWork?.media?.url || "";
  const hasYoutubePreview = isYouTubeUrl(previewUrl);

  return (
    <div
      style={{
        ...(slider ? { flexShrink: 0, width: "260px", scrollSnapAlign: "start" } : {}),
        aspectRatio: "0.68",
        minHeight: "320px",
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
                  filter: "grayscale(1) contrast(1.05) brightness(0.8)",
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
          <div style={{
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
