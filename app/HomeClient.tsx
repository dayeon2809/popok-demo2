"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Artist } from "@/types";
import { useLanguage } from "@/lib/useLanguage";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";

const HOME_COPY = {
  ko: {
    eyebrow: "POPOK FOR CREATORS",
    heroTitleA: "당신의 포트폴리오를,",
    heroTitleB: "더 가볍게. 포퐄.",
    heroSubhead: "당신의 작업이 하나로 연결됩니다.",
    heroBody:
      "POPOK은 아티스트와 크리에이터를 위한 디지털 명함이자 포트폴리오입니다. 프로필, 프로젝트, 경력, 링크를 하나의 주소에 모아 당신의 작업을 더 쉽게 보여주세요.",
    getMyPopok: "내 포퐄 만들기",
    seeExamples: "예시 보기",
    backCardTitle: "당신의 작업이\n연결됩니다.",
    sampleBio: "몸의 언어와 공간을 통해 감정의 구조를 탐구합니다.",
    viewWorks: "작품 보기",
    howEyebrow: "HOW POPOK WORKS",
    howTitle: "만들고. 공유하고. 연결되고. 확장하세요.",
    steps: [
      {
        meta: "01 CREATE",
        title: "나만의 명함 시작",
        body: "프로필, 대표 작업, 경력과 링크를 선명하게 모아 당신만의 POPOK 카드를 완성합니다.",
      },
      {
        meta: "02 SHARE",
        title: "어디서나 간편하게",
        body: "개인 맞춤 QR 코드 또는 하나의 공유 URL로 당신의 포트폴리오를 빠르게 전달합니다.",
      },
      {
        meta: "03 CONNECT",
        title: "작업 기회와 연결",
        body: "작품과 아티스트를 찾는 기획자, 연출가, 브랜드와 만나 새로운 협업의 가능성을 만듭니다.",
      },
      {
        meta: "04 GROW",
        title: "발견을 이어가기",
        body: "당신의 프로필이 어떻게 발견되는지 확인하고, 작업의 흐름을 계속 업데이트하세요.",
      },
    ],
    stripTitle: "POPOK은 모든 아티스트를 위한 공간입니다.",
    discoverEyebrow: "DISCOVER",
    discoverTitle: "POPOK에서 아티스트를 만나보세요.",
    exploreAll: "전체 아티스트 보기",
    fallbackBio: "고유한 예술 세계와 포트폴리오를 확인해 보세요.",
    viewPopok: "POPOK 보기",
    finalTitle: "당신의 작업이\n머물 자리를 만드세요.",
    finalBody: "포퐄을 만들고,\n하나의 링크로 당신을 보여주세요.",
    createMyPopok: "내 포퐄 만들기",
  },
  en: {
    eyebrow: "POPOK FOR CREATORS",
    heroTitleA: "A new way for artists",
    heroTitleB: "to be seen and remembered.",
    heroSubhead: "Your work, connected.",
    heroBody:
      "POPOK is a digital business card and portfolio platform for artists and creators. Gather your profile, projects, experiences, and links into one single link. Showcase yourself instantly with a unique link and scan-to-save QR cards.",
    getMyPopok: "Get my POPOK",
    seeExamples: "See examples",
    backCardTitle: "Your work,\nconnected.",
    sampleBio: "Exploring human emotions through fluid body language and architecture space.",
    viewWorks: "View Works",
    howEyebrow: "HOW POPOK WORKS",
    howTitle: "Create. Share. Connect. Grow.",
    steps: [
      {
        meta: "01 CREATE",
        title: "Start your own card",
        body: "Gather your profile, projects, experiences, and links into a clean POPOK card.",
      },
      {
        meta: "02 SHARE",
        title: "Easy anywhere",
        body: "Share your portfolio through a personalized QR card or one simple URL.",
      },
      {
        meta: "03 CONNECT",
        title: "Connect with opportunities",
        body: "Meet producers, directors, brands, and collaborators looking for artists and works.",
      },
      {
        meta: "04 GROW",
        title: "Grow your presence",
        body: "Track how your profile is discovered and keep your work updated.",
      },
    ],
    stripTitle: "POPOK is for every artist.",
    discoverEyebrow: "DISCOVER",
    discoverTitle: "Meet artists on POPOK.",
    exploreAll: "Explore all artists",
    fallbackBio: "Explore a unique artistic world and portfolio.",
    viewPopok: "View POPOK",
    finalTitle: "Your work deserves\na place of its own.",
    finalBody: "Create your POPOK.\nShare one link. Be discovered.",
    createMyPopok: "Create my POPOK",
  },
};

interface HomeClientProps {
  initialArtists: Artist[];
}

export default function HomeClient({ initialArtists }: HomeClientProps) {
  const { language } = useLanguage();
  const t = HOME_COPY[language];
  const artists = initialArtists;

  // Get artists who have valid profile images for high-fidelity discovery section
  const showDraft = process.env.NEXT_PUBLIC_SHOW_DRAFT_ARTISTS === "true";
  const featuredArtists = artists
    .filter((a) => a.profileImage && a.profileImage !== "" && (showDraft || a.status === "published" || !a.status))
    .slice(0, 6);

  // Discover section sliding carousel (auto-slide + manual arrows)
  const discoverSliderRef = useRef<HTMLDivElement>(null);
  const discoverPausedRef = useRef(false);
  const discoverResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pauseDiscoverTemporarily = (delay = 8000) => {
    discoverPausedRef.current = true;
    if (discoverResumeTimerRef.current) clearTimeout(discoverResumeTimerRef.current);
    discoverResumeTimerRef.current = setTimeout(() => { discoverPausedRef.current = false; }, delay);
  };

  const setDiscoverPaused = (paused: boolean) => {
    discoverPausedRef.current = paused;
    if (discoverResumeTimerRef.current) clearTimeout(discoverResumeTimerRef.current);
    discoverResumeTimerRef.current = null;
  };

  const scrollDiscover = (dir: "left" | "right") => {
    pauseDiscoverTemporarily();
    discoverSliderRef.current?.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
  };

  useEffect(() => {
    if (featuredArtists.length === 0) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let lastTs: number | null = null;
    let rafId: number;
    const speed = 24; // px per second

    const step = (ts: number) => {
      if (lastTs === null) lastTs = ts;
      const dt = Math.min(ts - lastTs, 50) / 1000;
      lastTs = ts;
      const node = discoverSliderRef.current;
      if (node && !discoverPausedRef.current && node.scrollWidth > node.clientWidth) {
        const next = node.scrollLeft + speed * dt;
        node.scrollLeft = next + node.clientWidth >= node.scrollWidth - 1 ? 0 : next;
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      if (discoverResumeTimerRef.current) clearTimeout(discoverResumeTimerRef.current);
    };
  }, [featuredArtists.length]);

  // Helper to translate genre tags to professional English/Korean labels
  const getGenreLabel = (genre?: string) => {
    switch (genre?.toLowerCase()) {
      case "contemporary":
        return "Contemporary";
      case "ballet":
        return "Ballet";
      case "traditional":
        return "Traditional Korean";
      case "hiphop":
      case "street":
        return "Street Dance";
      default:
        return "Performing Artist";
    }
  };

  return (
    <div style={{ background: "var(--bg-warm)", minHeight: "100vh", overflowX: "hidden" }}>
      {/* ── 1. HERO SECTION ── */}
      <section id="about" className="home-section" style={{
        maxWidth: "1120px",
        margin: "0 auto",
        padding: "80px 32px 100px",
      }}>
        <div className="responsive-stack-320" style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: "48px",
          alignItems: "center"
        }}>
          {/* Hero Left Content */}
          <div className="fade-up">
            {/* Tagline */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#FFFFFF",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "6px 14px",
              marginBottom: "24px",
            }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-dark)", display: "inline-block" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)", letterSpacing: "0.02em" }}>
                {t.eyebrow}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="display" style={{
              fontSize: "clamp(2.4rem, 5.5vw, 3.8rem)",
              color: "var(--navy)",
              lineHeight: 1.1,
              marginBottom: "24px",
              fontWeight: 900,
              letterSpacing: "-0.04em"
            }}>
              {language === "ko" ? (
                <>
                  당신의 포트폴리오를,<br />
                  더 가볍게. <span className="seen-highlight">포퐄.</span>
                </>
              ) : (
                <>
                  {t.heroTitleA}<br />
                  to be <span className="seen-highlight">seen</span> and remembered.
                </>
              )}
            </h1>

            {/* Secondary Headline / Subtext */}
            <p style={{
              fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
              color: "var(--navy)",
              fontWeight: 700,
              lineHeight: 1.4,
              marginBottom: "12px",
              letterSpacing: "-0.02em"
            }}>
              {t.heroSubhead}
            </p>

            <p style={{
              fontSize: "0.95rem",
              color: "var(--ink-muted)",
              lineHeight: 1.7,
              maxWidth: "520px",
              marginBottom: "40px",
            }}>
              {t.heroBody}
            </p>

            {/* CTA Buttons */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/submit" className="btn-lime" style={{
                textDecoration: "none",
                padding: "16px 32px",
                borderRadius: "12px",
                fontSize: "0.95rem",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(200, 238, 82, 0.2)"
              }}>
                {t.getMyPopok} <span style={{ fontSize: "1.1rem" }}>→</span>
              </Link>
              <Link href="/artists/kim-boram" className="btn-outline" style={{
                textDecoration: "none",
                padding: "16px 32px",
                borderRadius: "12px",
                fontSize: "0.95rem",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center"
              }}>
                {t.seeExamples}
              </Link>
            </div>
          </div>

          {/* Hero Right Visuals (Product Cards Showcase) */}
          <div className="hero-visual-stage" style={{
            position: "relative",
            height: "480px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {/* Background thin lines graphics */}
            <svg style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              top: 0,
              left: 0,
              zIndex: 0,
              pointerEvents: "none"
            }}>
              <circle cx="50%" cy="50%" r="180" fill="none" stroke="rgba(200, 238, 82, 0.4)" strokeWidth="1" />
              <line x1="10%" y1="20%" x2="90%" y2="80%" stroke="rgba(200, 238, 82, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="90%" y1="20%" x2="10%" y2="80%" stroke="rgba(200, 238, 82, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
            </svg>

            {/* Back Card (Card 2) */}
            <div className="float-card-2 hero-float-card" style={{
              position: "absolute",
              width: "250px",
              height: "360px",
              background: "var(--accent)",
              border: "1.5px solid var(--navy)",
              borderRadius: "18px",
              padding: "24px",
              boxShadow: "0 8px 32px rgba(23, 20, 17, 0.08)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              zIndex: 1,
              transform: "rotate(6deg) translateX(40px)",
              transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              cursor: "pointer",
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "rotate(2deg) scale(1.03) translateX(30px)";
                e.currentTarget.style.zIndex = "3";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "rotate(6deg) translateX(40px)";
                e.currentTarget.style.zIndex = "1";
              }}>
              <div>
                <div style={{ fontWeight: 950, fontSize: "1.2rem", color: "var(--navy)", letterSpacing: "-0.04em", display: "flex", alignItems: "center", gap: "2px" }}>
                  POPOK
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "var(--navy)" }} />
                </div>
              </div>
              <div>
                <p style={{
                  fontSize: "1.6rem",
                  fontWeight: 900,
                  color: "var(--navy)",
                  lineHeight: 1.25,
                  letterSpacing: "-0.03em"
                }}>
                  {t.backCardTitle.split("\n").map((line, index) => (
                    <span key={line}>
                      {line}
                      {index === 0 && <br />}
                    </span>
                  ))}
                </p>
              </div>
              <div style={{
                fontFamily: "monospace",
                fontSize: "0.85rem",
                color: "var(--navy)",
                fontWeight: 700,
                letterSpacing: "-0.01em"
              }}>
                popok.kr/jianchoi
              </div>
            </div>

            {/* Front Card (Card 1) */}
            <div className="float-card-1 hero-float-card" style={{
              position: "absolute",
              width: "250px",
              height: "360px",
              background: "#FFFFFF",
              border: "1.5px solid var(--border)",
              borderRadius: "18px",
              padding: "16px",
              boxShadow: "0 16px 40px rgba(23, 20, 17, 0.08)",
              display: "flex",
              flexDirection: "column",
              zIndex: 2,
              transform: "rotate(-3deg) translateX(-40px)",
              transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              cursor: "pointer",
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "rotate(0deg) scale(1.03) translateX(-30px)";
                e.currentTarget.style.zIndex = "3";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "rotate(-3deg) translateX(-40px)";
                e.currentTarget.style.zIndex = "2";
              }}>
              {/* Photo Area */}
              <div style={{
                width: "100%",
                height: "200px",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "16px",
                background: "#EAE6DD",
                position: "relative"
              }}>
                <img
                  src="/media/artists/yoon-kyungkeun/profile.jpg"
                  alt="JIAN CHOI"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "contrast(1.1)"
                  }}
                />
              </div>

              {/* Profile Details */}
              <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.02em" }}>JIAN CHOI</h3>
                    <span className="mono" style={{ fontSize: "0.62rem", color: "var(--accent-dark)", fontWeight: 700 }}>Choreographer</span>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.4 }}>
                    {t.sampleBio}
                  </p>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "8px",
                  borderTop: "1px solid var(--border)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--navy)"
                }}>
                  <span>{t.viewWorks}</span>
                  <span>→</span>
                </div>
              </div>
            </div>

            {/* Circular QR Badge */}
            <div style={{
              position: "absolute",
              bottom: "40px",
              right: "20px",
              width: "74px",
              height: "74px",
              borderRadius: "50%",
              background: "#FFFFFF",
              border: "1.5px solid var(--navy)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 3,
              transform: "rotate(-12deg)"
            }}>
              <span style={{ fontSize: "0.45rem", fontWeight: 900, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>SCAN</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--navy)" }}>
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span style={{ fontSize: "0.45rem", fontWeight: 900, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "3px" }}>SAVE CARD</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. HOW POPOK WORKS ── */}
      <section id="how-it-works" className="home-section" style={{
        borderTop: "1px solid var(--border)",
        background: "#FFFFFF",
        padding: "100px 32px",
      }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: "64px" }}>
            <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
              {t.howEyebrow}
            </span>
            <h2 className="display" style={{
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              color: "var(--navy)",
              fontWeight: 900,
              letterSpacing: "-0.03em"
            }}>
              {t.howTitle}
            </h2>
          </div>

          {/* Cards Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px"
          }}>
            {/* Card 01 */}
            <div className="card" style={{ padding: "32px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "380px" }}>
              <div>
                <span className="mono" style={{ fontSize: "0.85rem", color: "var(--accent-dark)", fontWeight: 800, display: "block", marginBottom: "16px" }}>{t.steps[0].meta}</span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", marginBottom: "12px", letterSpacing: "-0.02em" }}>{t.steps[0].title}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
                  {t.steps[0].body}
                </p>
              </div>

              {/* Smartphone mockup visual */}
              <div style={{
                width: "100px", height: "130px", border: "3px solid #171411", borderRadius: "12px 12px 0 0",
                background: "#F5F1E8", padding: "6px", position: "relative", margin: "0 auto -32px",
                boxShadow: "0 -4px 12px rgba(0,0,0,0.03)", overflow: "hidden"
              }}>
                <div style={{ width: "20px", height: "2px", background: "#171411", borderRadius: "1px", margin: "0 auto 4px" }} />
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--accent)", margin: "0 auto 4px" }} />
                <div style={{ width: "36px", height: "4px", background: "#171411", borderRadius: "2px", margin: "0 auto 6px" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px" }}>
                  <div style={{ height: "22px", background: "#FFFFFF", borderRadius: "2px" }} />
                  <div style={{ height: "22px", background: "#FFFFFF", borderRadius: "2px" }} />
                  <div style={{ height: "22px", background: "#FFFFFF", borderRadius: "2px" }} />
                  <div style={{ height: "22px", background: "#FFFFFF", borderRadius: "2px" }} />
                </div>
              </div>
            </div>

            {/* Card 02 */}
            <div className="card" style={{ padding: "32px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "380px" }}>
              <div>
                <span className="mono" style={{ fontSize: "0.85rem", color: "var(--accent-dark)", fontWeight: 800, display: "block", marginBottom: "16px" }}>{t.steps[1].meta}</span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", marginBottom: "12px", letterSpacing: "-0.02em" }}>{t.steps[1].title}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
                  {t.steps[1].body}
                </p>
              </div>

              {/* QR Code Graphic visual */}
              <div style={{
                width: "110px", height: "80px", background: "var(--accent)", border: "1px solid var(--navy)",
                borderRadius: "8px", padding: "8px", display: "flex", justifyContent: "space-between",
                alignItems: "center", margin: "0 auto -10px", transform: "rotate(-3deg)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
              }}>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                  <span style={{ fontWeight: 900, fontSize: "0.55rem", color: "var(--navy)" }}>POPOK</span>
                  <span style={{ fontSize: "0.4rem", color: "var(--navy)", opacity: 0.8 }}>popok.kr/url</span>
                </div>
                <div style={{
                  width: "36px", height: "36px", background: "#FFFFFF", border: "1px solid var(--navy)",
                  padding: "2px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px"
                }}>
                  <div style={{ background: "var(--navy)" }} />
                  <div style={{ background: "var(--navy)" }} />
                  <div style={{ background: "transparent" }} />
                  <div style={{ background: "var(--navy)" }} />
                  <div style={{ background: "transparent" }} />
                  <div style={{ background: "var(--navy)" }} />
                  <div style={{ background: "transparent" }} />
                  <div style={{ background: "var(--navy)" }} />
                  <div style={{ background: "var(--navy)" }} />
                </div>
              </div>
            </div>

            {/* Card 03 */}
            <div className="card" style={{ padding: "32px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "380px" }}>
              <div>
                <span className="mono" style={{ fontSize: "0.85rem", color: "var(--accent-dark)", fontWeight: 800, display: "block", marginBottom: "16px" }}>{t.steps[2].meta}</span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", marginBottom: "12px", letterSpacing: "-0.02em" }}>{t.steps[2].title}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
                  {t.steps[2].body}
                </p>
              </div>

              {/* Connection Node visual */}
              <div style={{
                width: "140px", height: "80px", position: "relative", margin: "0 auto",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <div style={{
                  width: "34px", height: "34px", borderRadius: "50%", background: "#FFFFFF",
                  border: "1.5px solid var(--navy)", display: "flex", alignItems: "center", justifyContent: "center",
                  position: "absolute", left: "12px", zIndex: 2
                }}>
                  <span style={{ fontSize: "0.9rem" }}>👤</span>
                </div>
                <div style={{
                  width: "50px", height: "1px", borderTop: "2px dashed var(--navy)"
                }} />
                <div style={{
                  width: "34px", height: "34px", borderRadius: "50%", background: "var(--accent)",
                  border: "1.5px solid var(--navy)", display: "flex", alignItems: "center", justifyContent: "center",
                  position: "absolute", right: "12px", zIndex: 2
                }}>
                  <span style={{ fontSize: "0.9rem" }}>✨</span>
                </div>
              </div>
            </div>

            {/* Card 04 */}
            <div className="card" style={{ padding: "32px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "380px" }}>
              <div>
                <span className="mono" style={{ fontSize: "0.85rem", color: "var(--accent-dark)", fontWeight: 800, display: "block", marginBottom: "16px" }}>{t.steps[3].meta}</span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", marginBottom: "12px", letterSpacing: "-0.02em" }}>{t.steps[3].title}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
                  {t.steps[3].body}
                </p>
              </div>

              {/* Stats Graphic visual */}
              <div style={{
                width: "130px", height: "85px", border: "1px solid var(--border)", borderRadius: "8px",
                background: "#FFFFFF", padding: "10px", margin: "0 auto -12px",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--ink-muted)" }}>VISITORS</span>
                  <span style={{ fontSize: "0.55rem", color: "#2A6B3A", fontWeight: 700 }}>+42%</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--navy)" }}>1,840</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "24px" }}>
                  <div style={{ width: "100%", height: "30%", background: "var(--border)", borderRadius: "1px" }} />
                  <div style={{ width: "100%", height: "50%", background: "var(--border)", borderRadius: "1px" }} />
                  <div style={{ width: "100%", height: "40%", background: "var(--border)", borderRadius: "1px" }} />
                  <div style={{ width: "100%", height: "85%", background: "var(--accent)", borderRadius: "1px" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. ARTIST CATEGORY STRIP ── */}
      <section id="artist-categories" style={{
        background: "var(--accent)",
        borderTop: "1px solid var(--navy)",
        borderBottom: "1px solid var(--navy)",
        padding: "24px 0",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "32px",
          width: "max-content",
          padding: "0 32px",
        }}>
          <span style={{
            fontSize: "1.1rem",
            fontWeight: 900,
            color: "var(--navy)",
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
            marginRight: "16px",
            whiteSpace: "nowrap"
          }}>
            {t.stripTitle}
          </span>

          <div style={{
            display: "flex",
            gap: "12px",
            flexWrap: "nowrap"
          }}>
            {["dancer", "choreographer", "performing artist", "visual artist", "musician", "creator"].map((cat) => (
              <span key={cat} style={{
                display: "inline-block",
                padding: "6px 16px",
                border: "1px solid var(--navy)",
                borderRadius: "20px",
                fontSize: "0.78rem",
                fontWeight: 800,
                color: "var(--navy)",
                background: "rgba(245, 241, 232, 0.5)",
                letterSpacing: "0.05em",
                whiteSpace: "nowrap"
              }}>
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. ARTIST DISCOVERY SECTION ── */}
      <section className="home-section" style={{
        padding: "100px 32px",
        maxWidth: "1120px",
        margin: "0 auto",
      }}>
        {/* Title */}
        <div className="discover-header" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "48px",
          gap: "16px",
          flexWrap: "wrap"
        }}>
          <div>
            <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
              {t.discoverEyebrow}
            </span>
            <h2 className="display" style={{
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              color: "var(--navy)",
              fontWeight: 900,
              letterSpacing: "-0.03em"
            }}>
              {t.discoverTitle}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <Link href="/artists" style={{
              textDecoration: "none",
              color: "var(--navy)",
              fontWeight: 800,
              fontSize: "0.9rem",
              borderBottom: "1.5px solid var(--navy)",
              paddingBottom: "2px",
              whiteSpace: "nowrap"
            }}>
              {t.exploreAll}
            </Link>
            <div className="discover-arrow-btns" style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => scrollDiscover("left")}
                aria-label="scroll left"
                className="btn-outline"
                style={{ width: "36px", height: "36px", borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", cursor: "pointer" }}
              >←</button>
              <button
                onClick={() => scrollDiscover("right")}
                aria-label="scroll right"
                className="btn-outline"
                style={{ width: "36px", height: "36px", borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", cursor: "pointer" }}
              >→</button>
            </div>
          </div>
        </div>

        {/* Horizontal Card List (auto-slides; hover/touch pauses, drag/swipe or arrows to browse) */}
        <div
          ref={discoverSliderRef}
          onMouseEnter={() => setDiscoverPaused(true)}
          onMouseLeave={() => setDiscoverPaused(false)}
          onPointerDown={() => pauseDiscoverTemporarily()}
          onTouchStart={() => pauseDiscoverTemporarily()}
          onWheel={() => pauseDiscoverTemporarily()}
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: "24px",
            overflowX: "auto",
            paddingBottom: "24px",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch"
          }}
        >
          {featuredArtists.map((a) => (
            <div key={a.id} style={{
              minWidth: "260px",
              maxWidth: "260px",
              flex: "0 0 auto",
              scrollSnapAlign: "start",
            }}>
              <Link href={`/artists/${a.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                <div className="card hover-scale-img" style={{
                  background: "#FFFFFF",
                  padding: "12px",
                  height: "390px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}>
                  {/* Photo area */}
                  <div style={{
                    width: "100%",
                    height: "230px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    background: "#EAE6DD",
                  }}>
                    <img
                      src={a.profileImage}
                      alt={a.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: "contrast(1.05)"
                      }}
                    />
                  </div>

                  {/* Body details */}
                  <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "12px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)" }}>{a.name}</h3>
                        <span className="mono" style={{ fontSize: "0.62rem", color: "var(--accent-dark)", fontWeight: 700 }}>
                          {getGenreLabel(a.genre)}
                        </span>
                      </div>
                      <p style={{
                        fontSize: "0.78rem",
                        color: "var(--ink-muted)",
                        lineHeight: 1.45,
                        display: "-webkit-box",
                        WebkitLineClamp: "2",
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                        {a.bio || a.aiSummary || (language === "ko" ? `${a.name}의 ${t.fallbackBio}` : t.fallbackBio)}
                      </p>
                    </div>

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "8px",
                      borderTop: "1px solid var(--border)",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: "var(--navy)"
                    }}>
                      <span>{t.viewPopok}</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. FINAL CTA SECTION ── */}
      <section className="home-section" style={{
        background: "var(--accent)",
        borderTop: "1px solid var(--navy)",
        borderBottom: "1px solid var(--navy)",
        padding: "120px 32px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background scattered cards illustration in pure CSS */}
        <div style={{
          position: "absolute",
          top: "10%",
          right: "10%",
          width: "400px",
          height: "350px",
          opacity: 0.15,
          zIndex: 0,
          pointerEvents: "none",
          display: "flex",
          gap: "20px",
          transform: "rotate(-12deg) scale(1.1)",
        }} className="header-nav-links">
          <div style={{ width: "120px", height: "180px", border: "2px solid var(--navy)", borderRadius: "8px", background: "#FFFFFF" }} />
          <div style={{ width: "120px", height: "180px", border: "2px solid var(--navy)", borderRadius: "8px", background: "var(--accent)", transform: "translateY(40px)" }} />
          <div style={{ width: "120px", height: "180px", border: "2px solid var(--navy)", borderRadius: "8px", background: "#FFFFFF", transform: "translateY(-20px)" }} />
        </div>

        <div style={{
          maxWidth: "1120px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1
        }}>
          <h2 className="display" style={{
            fontSize: "clamp(2.5rem, 6vw, 4.2rem)",
            color: "var(--navy)",
            fontWeight: 950,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            marginBottom: "24px"
          }}>
            {t.finalTitle.split("\n").map((line, index) => (
              <span key={line}>
                {line}
                {index === 0 && <br />}
              </span>
            ))}
          </h2>

          <p style={{
            fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
            color: "var(--navy)",
            fontWeight: 700,
            lineHeight: 1.5,
            marginBottom: "40px",
            maxWidth: "600px",
            letterSpacing: "-0.02em"
          }}>
            {t.finalBody.split("\n").map((line, index) => (
              <span key={line}>
                {line}
                {index === 0 && <br />}
              </span>
            ))}
          </p>

          <Link href="/submit" style={{
            textDecoration: "none",
            background: "var(--navy)",
            color: "#FFFFFF",
            padding: "18px 40px",
            borderRadius: "12px",
            fontSize: "1rem",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s ease",
            boxShadow: "0 6px 20px rgba(23, 20, 17, 0.15)"
          }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(23, 20, 17, 0.25)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(23, 20, 17, 0.15)";
            }}>
            {t.createMyPopok} <span style={{ fontSize: "1.15rem" }}>→</span>
          </Link>
        </div>
      </section>

      {/* ── 6. TESTIMONIALS ── */}
      <TestimonialsSection />

      {/* ── 7. FAQ ── */}
      <FAQSection />
    </div>
  );
}
