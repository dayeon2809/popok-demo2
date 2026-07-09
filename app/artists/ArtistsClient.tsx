"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useArtists } from "@/lib/api";
import { LoadingSpinner, ErrorMessage, EmptyState } from "@/components/ui/States";
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

export default function ArtistsClient() {
  const [query, setQuery] = useState("");
  const [selectedField, setSelectedField] = useState<string>("all");
  const [selectedSubField, setSelectedSubField] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const danceSliderRef = useRef<HTMLDivElement>(null);
  const musicSliderRef = useRef<HTMLDivElement>(null);
  const visualSliderRef = useRef<HTMLDivElement>(null);

  // Compile active API request filters
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

  // Horizontal scroll navigator
  const scrollSlider = (row: "dance" | "music" | "visual", direction: "left" | "right") => {
    const sliderRef = row === "dance" ? danceSliderRef : row === "music" ? musicSliderRef : visualSliderRef;
    if (sliderRef.current) {
      const scrollOffset = direction === "left" ? -400 : 400;
      sliderRef.current.scrollBy({ left: scrollOffset, behavior: "smooth" });
    }
  };

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
  const danceArtists = allFetched.filter((a) => {
    const f = a.field || "dance";
    return f === "dance" || f === "contemporary_dance" || f === "korean_dance" || f === "ballet" || f === "interdisciplinary";
  });
  const musicArtists = allFetched.filter((a) => a.field === "music");
  const visualArtists = allFetched.filter((a) => a.field === "visual");

  const totalResultsCount = allFetched.length;

  return (
    <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 32px 80px" }}>
      
      {/* CSS Hover Transitions helper */}
      <style dangerouslySetInnerHTML={{__html: `
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
                      setSelectedSubField("all"); // reset dance sub-filters
                    }}
                    className={active ? "btn-lime" : "btn-outline"}
                    style={{
                      padding: "8px 18px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 800,
                      border: active ? "1px solid transparent" : "1px solid var(--border)",
                      cursor: "pointer"
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
            <label style={{ display: "block", fontSize: "0.62rem", fontWeight: 800, color: "var(--accent-dark)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
              Dance Genre
            </label>
            <div style={{ overflowX: "auto" }} className="no-scrollbar">
              <div style={{ display: "flex", gap: "8px", whiteSpace: "nowrap" }}>
                {DANCE_SUB_FIELDS.map((sub) => {
                  const active = selectedSubField === sub.key;
                  return (
                    <button
                      key={sub.key}
                      onClick={() => setSelectedSubField(sub.key)}
                      className={active ? "btn-lime" : "btn-outline"}
                      style={{
                        padding: "6px 14px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700,
                        border: active ? "1px solid transparent" : "1px solid var(--border)",
                        cursor: "pointer",
                        background: active ? "var(--accent)" : "#FAF8F5"
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
                    className={active ? "btn-lime" : "btn-outline"}
                    style={{
                      padding: "6px 14px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 800,
                      border: active ? "1px solid transparent" : "1px solid var(--border)",
                      cursor: "pointer"
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
          
          {/* ──────────────── 01. DANCE SHOWCASE ROW ──────────────── */}
          {(selectedField === "all" || selectedField === "dance") && danceArtists.length > 0 && (
            <div>
              {/* Row Header */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                borderBottom: "1.5px solid var(--navy)", paddingBottom: "12px", marginBottom: "24px"
              }}>
                <div>
                  <h3 className="display" style={{ fontSize: "1.35rem", color: "var(--navy)", textTransform: "uppercase", margin: 0, fontWeight: 950 }}>
                    01. DANCE
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", margin: "4px 0 0 0" }}>
                    Bodies in motion.
                  </p>
                </div>
                
                {/* Independent Navigator Arrows */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => scrollSlider("dance", "left")}
                    className="btn-outline"
                    style={{
                      width: "36px", height: "36px", borderRadius: "50%", padding: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: "bold", fontSize: "1rem", cursor: "pointer"
                    }}
                  >
                    ←
                  </button>
                  <button
                    onClick={() => scrollSlider("dance", "right")}
                    className="btn-outline"
                    style={{
                      width: "36px", height: "36px", borderRadius: "50%", padding: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: "bold", fontSize: "1rem", cursor: "pointer"
                    }}
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Slider Track Container */}
              <div
                ref={danceSliderRef}
                style={{
                  display: "flex",
                  gap: "24px",
                  overflowX: "auto",
                  padding: "10px 4px 32px 4px",
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                }}
                className="no-scrollbar"
              >
                {danceArtists.map((a) => (
                  <ShowcaseCard key={a.id} artist={a} cleanInstagramHandle={cleanInstagramHandle} getGenreLabel={getGenreLabel} />
                ))}
              </div>
            </div>
          )}

          {/* ──────────────── 02. MUSIC SHOWCASE ROW ──────────────── */}
          {(selectedField === "all" || selectedField === "music") && musicArtists.length > 0 && (
            <div>
              {/* Row Header */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                borderBottom: "1.5px solid var(--navy)", paddingBottom: "12px", marginBottom: "24px"
              }}>
                <div>
                  <h3 className="display" style={{ fontSize: "1.35rem", color: "var(--navy)", textTransform: "uppercase", margin: 0, fontWeight: 950 }}>
                    02. MUSIC
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", margin: "4px 0 0 0" }}>
                    Artists of sound.
                  </p>
                </div>
                
                {/* Independent Navigator Arrows */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => scrollSlider("music", "left")}
                    className="btn-outline"
                    style={{
                      width: "36px", height: "36px", borderRadius: "50%", padding: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: "bold", fontSize: "1rem", cursor: "pointer"
                    }}
                  >
                    ←
                  </button>
                  <button
                    onClick={() => scrollSlider("music", "right")}
                    className="btn-outline"
                    style={{
                      width: "36px", height: "36px", borderRadius: "50%", padding: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: "bold", fontSize: "1rem", cursor: "pointer"
                    }}
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Slider Track Container */}
              <div
                ref={musicSliderRef}
                style={{
                  display: "flex",
                  gap: "24px",
                  overflowX: "auto",
                  padding: "10px 4px 32px 4px",
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                }}
                className="no-scrollbar"
              >
                {musicArtists.map((a) => (
                  <ShowcaseCard key={a.id} artist={a} cleanInstagramHandle={cleanInstagramHandle} getGenreLabel={getGenreLabel} />
                ))}
              </div>
            </div>
          )}

          {/* ──────────────── 03. VISUAL SHOWCASE ROW ──────────────── */}
          {(selectedField === "all" || selectedField === "visual") && visualArtists.length > 0 && (
            <div>
              {/* Row Header */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                borderBottom: "1.5px solid var(--navy)", paddingBottom: "12px", marginBottom: "24px"
              }}>
                <div>
                  <h3 className="display" style={{ fontSize: "1.35rem", color: "var(--navy)", textTransform: "uppercase", margin: 0, fontWeight: 950 }}>
                    03. VISUAL
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", margin: "4px 0 0 0" }}>
                    Ways of seeing.
                  </p>
                </div>
                
                {/* Independent Navigator Arrows */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => scrollSlider("visual", "left")}
                    className="btn-outline"
                    style={{
                      width: "36px", height: "36px", borderRadius: "50%", padding: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: "bold", fontSize: "1rem", cursor: "pointer"
                    }}
                  >
                    ←
                  </button>
                  <button
                    onClick={() => scrollSlider("visual", "right")}
                    className="btn-outline"
                    style={{
                      width: "36px", height: "36px", borderRadius: "50%", padding: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: "bold", fontSize: "1rem", cursor: "pointer"
                    }}
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Slider Track Container */}
              <div
                ref={visualSliderRef}
                style={{
                  display: "flex",
                  gap: "24px",
                  overflowX: "auto",
                  padding: "10px 4px 32px 4px",
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                }}
                className="no-scrollbar"
              >
                {visualArtists.map((a) => (
                  <ShowcaseCard key={a.id} artist={a} cleanInstagramHandle={cleanInstagramHandle} getGenreLabel={getGenreLabel} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

// Separate Mini Card Sub-component
function ShowcaseCard({ artist, cleanInstagramHandle, getGenreLabel }: { artist: Artist, cleanInstagramHandle: any, getGenreLabel: any }) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: "270px", // peeking sizes on mobile & desktop
        aspectRatio: "0.68",
        scrollSnapAlign: "start",
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
            <img
              src={artist.profileImage || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(artist.name)}`}
              alt={artist.name}
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                filter: "grayscale(1) contrast(1.05) brightness(0.8)",
                transition: "transform 0.5s ease, filter 0.5s ease"
              }}
            />
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
