"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";
import PopokCard from "@/components/PopokCard";
import MotionProfile from "@/components/MotionProfile";

interface WorkItem {
  id: string;
  title: string;
  year: string;
  description: string;
  role: string;
  image: string;
  videoUrl: string;
  credits: string;
  media?: {
    type: "youtube" | "vimeo" | "video" | "image";
    url?: string;
    src?: string;
    poster?: string;
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
    fetch(`/api/artists/${encodeURIComponent(id)}`)
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

  // Compile works list
  const displayWorks: WorkItem[] = (() => {
    const parseWorksIntoTitles = (w: string): string[] => {
      const bracketMatches = Array.from(w.matchAll(/<([^>]+)>/g)).map(m => m[1].trim());
      if (bracketMatches.length > 0) {
        return bracketMatches;
      }
      return w.split(/[,\n]/).map(item => item.trim()).filter(Boolean);
    };

    const list: WorkItem[] = [];

    if (artist.portfolio_works && artist.portfolio_works.length > 0) {
      artist.portfolio_works.forEach((w: any, idx: number) => {
        const titles = parseWorksIntoTitles(w.title);
        titles.forEach((title, tIdx) => {
          list.push({
            id: `work-p-${idx}-${tIdx}`,
            title: title,
            year: w.year || "연도미상",
            description: w.description || "이 작품은 아티스트의 핵심적인 포트폴리오 프로젝트 아카이브입니다. 창의적인 연출과 기획 요소들이 담겨 있습니다.",
            role: w.role || "창작",
            image: w.image_url || "/images/placeholders/cake-placeholder.png",
            videoUrl: w.video_url || "",
            credits: w.role || "창작",
            media: w.media || null
          });
        });
      });
      return list;
    }

    if (artist.works && artist.works.length > 0) {
      artist.works.forEach((w: string, idx: number) => {
        const titles = parseWorksIntoTitles(w);
        titles.forEach((title, tIdx) => {
          let cleanTitle = title.trim();
          let year = "연도미상";
          const yearMatch = cleanTitle.match(/\((\d{4})\)/);
          if (yearMatch) {
            year = yearMatch[1];
            cleanTitle = cleanTitle.replace(/\((\d{4})\)/, "").trim();
          } else if (cleanTitle.includes("(연도미상)")) {
            cleanTitle = cleanTitle.replace("(연도미상)", "").trim();
          }
          list.push({
            id: `work-w-${idx}-${tIdx}`,
            title: cleanTitle,
            year,
            description: "대표 아카이브 작품입니다.",
            role: "창작자",
            image: "/images/placeholders/cake-placeholder.png",
            videoUrl: "",
            credits: "참여: " + artist.name
          });
        });
      });
      return list;
    }
    return [];
  })();

  // Compile career timeline
  const careerList: string[] = (() => {
    const list: string[] = [];
    if (artist.residency && artist.residency.length > 0) {
      artist.residency.forEach((r: string) => list.push(`Residency: ${r}`));
    }
    if (artist.festival && artist.festival.length > 0) {
      artist.festival.forEach((f: string) => list.push(`Festival: ${f}`));
    }
    if (artist.works && artist.works.length > 0) {
      artist.works.slice(0, 3).forEach((w: string) => list.push(`Presented piece: ${w}`));
    }
    list.push("POPOK Registry Verification Completed");
    return list;
  })();

  const englishName = artist.name_en || artist.name.toUpperCase();
  const tags = artist.tags || [artist.field, artist.genre].filter(Boolean);

  const getCoordinates = () => {
    let hash = 0;
    for (let i = 0; i < artist.id.length; i++) {
      hash = artist.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lat = (37.5665 + (hash % 100) / 1000).toFixed(4);
    const lng = (126.978 + (Math.abs(hash) % 100) / 1000).toFixed(4);
    return `${lat}° N, ${lng}° E`;
  };

  // Video ID extractors for Youtube & Vimeo
  const getYoutubeEmbedUrl = (url: string): string | null => {
    try {
      let videoId = "";
      if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split(/[?#]/)[0];
      } else if (url.includes("youtube.com/watch")) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get("v") || "";
      } else if (url.includes("youtube.com/embed/")) {
        videoId = url.split("youtube.com/embed/")[1].split(/[?#]/)[0];
      } else if (url.includes("youtube.com/shorts/")) {
        videoId = url.split("youtube.com/shorts/")[1].split(/[?#]/)[0];
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
      }
    } catch (e) {
      console.error("Failed to parse YouTube URL", e);
    }
    return null;
  };

  const getVimeoEmbedUrl = (url: string): string | null => {
    try {
      let videoId = "";
      if (url.includes("vimeo.com/")) {
        const parts = url.split("vimeo.com/")[1].split(/[?#]/)[0].split("/");
        videoId = parts[parts.length - 1];
      }
      if (videoId && /^\d+$/.test(videoId)) {
        return `https://player.vimeo.com/video/${videoId}?autoplay=0&byline=0&portrait=0`;
      }
    } catch (e) {
      console.error("Failed to parse Vimeo URL", e);
    }
    return null;
  };

  const parsedActiveMedia = activeWork ? (() => {
    if (activeWork.media && typeof activeWork.media === "object") {
      return activeWork.media;
    }
    const videoUrl = activeWork.videoUrl || "";
    if (videoUrl.trim()) {
      const url = videoUrl.trim();
      if (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("youtube-nocookie.com")) {
        return { type: "youtube" as const, url };
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
            <Link href="/submit" style={{ textDecoration: "none", fontSize: "0.85rem", fontWeight: 700, color: "var(--ink-muted)" }}>
              Register
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "40px 32px" }}>
        
        {/* Back Link */}
        <Link href="/artists" style={{
          textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px",
          color: "var(--ink-muted)", fontSize: "0.85rem", fontWeight: 700, marginBottom: "40px"
        }}>
          ← Explore Showcase
        </Link>

        {/* ──────────────── 1. MOTION PROFILE (Reels-like vertical preview - TOP) ──────────────── */}
        <section style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "80px" }}>
          <div style={{ maxWidth: "600px", width: "100%", textAlign: "center", marginBottom: "32px" }}>
            <span className="mono" style={{ fontSize: "0.72rem", color: "var(--accent-dark)", fontWeight: 850, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              MOTION PROFILE SHOWCASE
            </span>
            <h3 style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--navy)", marginTop: "6px", letterSpacing: "-0.02em" }}>
              15 Sec Quick Mood Reel
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }}>
              카메라 움직임과 기하학적 텍스트를 결합하여 아티스트의 고유한 분위기를 전달합니다.
            </p>
          </div>

          <MotionProfile
            name={artist.name}
            genre={artist.genre}
            image={artist.profileImage || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(artist.name)}`}
            quote={artist.bio_short}
            motionProfile={artist.motionProfile}
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
              popok.kr/p/{artist.id}
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
              {/* Col 1: Affiliations */}
              <div>
                <span className="mono" style={{ fontSize: "0.62rem", color: "var(--ink-faint)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
                  AFFILIATION
                </span>
                <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--navy)", margin: 0 }}>
                  {artist.company || "Independent Artist"}
                </p>
                <span className="mono" style={{ fontSize: "0.6rem", color: "var(--accent-dark)", fontWeight: 850, marginTop: "6px", display: "block" }}>
                  {artist.genre ? artist.genre.toUpperCase() : "CREATIVE"}
                </span>
              </div>

              {/* Col 2: About Me */}
              <div>
                <span className="mono" style={{ fontSize: "0.62rem", color: "var(--ink-faint)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
                  ABOUT ME
                </span>
                <p style={{ fontSize: "0.85rem", color: "var(--navy)", lineHeight: 1.6, whiteSpace: "pre-line", margin: 0 }}>
                  {artist.bio || "POPOK 아티스트 레지스트리에 정식 등록된 창작자입니다. 흩어져 있는 활동과 기록을 수집하여 포트폴리오를 구성해 나가는 여정에 있습니다."}
                </p>
              </div>

              {/* Col 3: Contact */}
              <div>
                <span className="mono" style={{ fontSize: "0.62rem", color: "var(--ink-faint)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
                  CONTACT INFO
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem" }}>
                  {artist.instagram && (
                    <a href={artist.instagram} target="_blank" rel="noopener noreferrer" style={{ color: "var(--navy)", fontWeight: 700, textDecoration: "none" }}>
                      {cleanInstagramHandle(artist.instagram)} ↗
                    </a>
                  )}
                  {artist.website && (
                    <a href={artist.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ink-muted)", textDecoration: "none", fontFamily: "monospace" }}>
                      {artist.website.replace("https://", "")} ↗
                    </a>
                  )}
                  <span style={{ color: "var(--ink-muted)", fontFamily: "monospace" }}>{artist.name}@popok.kr</span>
                </div>
              </div>
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

          </div>
        </section>

        {/* ──────────────── 3. SELECTED WORKS (Visual Card Layouts - Split) ──────────────── */}
        <section style={{ marginBottom: "80px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1.5px solid var(--navy)", paddingBottom: "12px", marginBottom: "28px" }}>
            <h3 className="display" style={{ fontSize: "1.2rem", color: "var(--navy)", textTransform: "uppercase", margin: 0 }}>
              Selected Works
            </h3>
            <span className="mono" style={{ fontSize: "0.72rem", color: "var(--ink-faint)" }}>
              {displayWorks.length} PIECES REGISTERED
            </span>
          </div>

          {displayWorks.length === 0 ? (
            <p style={{ color: "var(--ink-muted)", fontSize: "0.85rem", padding: "20px 0" }}>등록된 작품 포트폴리오가 없습니다.</p>
          ) : (
            /* Visual Responsive Grid */
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px"
            }}>
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
                  className="hover-scale-img"
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
                  <div style={{ position: "relative", width: "100%", aspectRatio: "1.4", overflow: "hidden", background: "#F5F1E8" }}>
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
                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                      <h4 style={{ fontSize: "1.1rem", fontWeight: 850, color: "var(--navy)", margin: 0, letterSpacing: "-0.01em" }}>
                        {work.title}
                      </h4>
                      <span className="mono" style={{ fontSize: "0.65rem", color: "var(--accent-dark)", fontWeight: 800, display: "block", marginTop: "4px" }}>
                        {work.role}
                      </span>
                    </div>

                    <p style={{
                      fontSize: "0.8rem", color: "var(--ink-muted)", lineHeight: 1.5, margin: 0,
                      display: "-webkit-box", WebkitLineClamp: "3", WebkitBoxOrient: "vertical", overflow: "hidden"
                    }}>
                      {work.description}
                    </p>

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
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ──────────────── 4. CAREER / ACTIVITY TIMELINE (Visually Quieter) ──────────────── */}
        <section style={{ marginBottom: "64px" }}>
          <h3 className="display" style={{
            fontSize: "1.1rem", color: "var(--navy)", textTransform: "uppercase",
            borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "24px"
          }}>
            Activity Timeline
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderLeft: "1.5px solid var(--border)", paddingLeft: "16px", marginLeft: "8px" }}>
            {careerList.map((item, idx) => (
              <div key={idx} style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: "-21px", top: "5px", width: "8px", height: "8px",
                  borderRadius: "50%", background: "#C8C2B7", border: "2px solid var(--bg-warm)"
                }} />
                <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", fontWeight: 600, margin: 0, lineHeight: 1.45 }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ──────────────── 5. REVIEWS & ARTICLES (With Live Links) ──────────────── */}
        {artist.reviews && artist.reviews.length > 0 && (
          <section style={{ marginBottom: "80px" }}>
            <h3 className="display" style={{
              fontSize: "1.15rem", color: "var(--navy)", textTransform: "uppercase",
              borderBottom: "1.5px solid var(--navy)", paddingBottom: "12px", marginBottom: "24px"
            }}>
              Reviews & Articles
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {artist.reviews.map((rev: any, idx: number) => (
                <a
                  key={idx}
                  href={rev.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "18px 16px", borderBottom: "1px solid var(--border)", textDecoration: "none",
                    color: "inherit", transition: "background 0.2s ease"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--tag-bg)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--navy)" }}>
                      &lt;{rev.workTitle}&gt; 관련 평론 및 언론 보도
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "var(--ink-muted)", display: "flex", gap: "8px" }}>
                      <span>게재지: {rev.source}</span>
                    </span>
                  </div>
                  <span style={{
                    fontSize: "0.75rem", border: "1px solid var(--navy)", borderRadius: "20px",
                    padding: "6px 14px", color: "var(--navy)", background: "#FFFFFF", fontWeight: 800
                  }}>
                    Read Article ↗
                  </span>
                </a>
              ))}
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
                  aspectRatio: (parsedActiveMedia.type === "youtube" || parsedActiveMedia.type === "vimeo" || parsedActiveMedia.type === "video") ? "1.777" : "1.33",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  background: "#171411",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative"
                }}>
                  {parsedActiveMedia.type === "youtube" && getYoutubeEmbedUrl(parsedActiveMedia.url || "") ? (
                    <iframe
                      src={getYoutubeEmbedUrl(parsedActiveMedia.url || "") || ""}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={activeWork.title}
                    />
                  ) : parsedActiveMedia.type === "vimeo" && getVimeoEmbedUrl(parsedActiveMedia.url || "") ? (
                    <iframe
                      src={getVimeoEmbedUrl(parsedActiveMedia.url || "") || ""}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
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
                  ) : activeWork.image && !activeWork.image.includes("cake-placeholder") ? (
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
                    <span className="tag" style={{ background: "var(--accent)", color: "var(--navy)", border: "none", fontSize: "0.65rem", fontWeight: 800 }}>
                      {activeWork.role}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span className="mono" style={{ fontSize: "0.6rem", color: "var(--ink-faint)", fontWeight: 700, letterSpacing: "0.05em" }}>
                      PROJECT DESCRIPTION
                    </span>
                    <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", lineHeight: 1.6, margin: 0 }}>
                      {activeWork.description}
                    </p>
                  </div>

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
                    Watch External Video Showcase ↗
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
