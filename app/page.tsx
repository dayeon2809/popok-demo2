"use client";

import Link from "next/link";
import artistsData from "@/data/artists.json";
import type { Artist } from "@/types";

export default function HomePage() {
  const artists = artistsData as Artist[];

  // Get artists who have valid profile images for high-fidelity discovery section
  const featuredArtists = artists
    .filter((a) => a.profileImage && a.profileImage !== "" && (a.status === "published" || !a.status))
    .slice(0, 6);

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
      <section id="about" style={{
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
                POPOK FOR CREATORS
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
              A new way for artists<br />
              to be <span className="seen-highlight">seen</span> and remembered.
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
              Your work, connected.
            </p>

            <p style={{
              fontSize: "0.95rem",
              color: "var(--ink-muted)",
              lineHeight: 1.7,
              maxWidth: "520px",
              marginBottom: "40px",
            }}>
              POPOK is a digital business card and portfolio platform for artists and creators.
              Gather your profile, projects, experiences, and links into one single link.
              Showcase yourself instantly with a unique link and scan-to-save QR cards.
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
                Get my POPOK <span style={{ fontSize: "1.1rem" }}>→</span>
              </Link>
              <Link href="/artists" className="btn-outline" style={{
                textDecoration: "none",
                padding: "16px 32px",
                borderRadius: "12px",
                fontSize: "0.95rem",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center"
              }}>
                See examples
              </Link>
            </div>
          </div>

          {/* Hero Right Visuals (Product Cards Showcase) */}
          <div style={{
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
            <div className="float-card-2" style={{
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
                  Your work,<br />connected.
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
            <div className="float-card-1" style={{
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
                  src="/images/artists/윤경근-ziohmboq.jpg"
                  alt="JIAN CHOI"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "grayscale(1) contrast(1.1)"
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
                    Exploring human emotions through fluid body language and architecture space.
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
                  <span>View Works</span>
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
      <section id="features" style={{
        borderTop: "1px solid var(--border)",
        background: "#FFFFFF",
        padding: "100px 32px",
      }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: "64px" }}>
            <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
              HOW POPOK WORKS
            </span>
            <h2 className="display" style={{
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              color: "var(--navy)",
              fontWeight: 900,
              letterSpacing: "-0.03em"
            }}>
              Create. Share. Connect. Grow.
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
                <span className="mono" style={{ fontSize: "0.85rem", color: "var(--accent-dark)", fontWeight: 800, display: "block", marginBottom: "16px" }}>01 CREATE</span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", marginBottom: "12px", letterSpacing: "-0.02em" }}>나만의 명함 제작</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
                  프로필, 대표 작품, 경력과 외부 링크를 한곳에 정갈하게 모아 나만의 POPOK 카드를 완성합니다.
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
                <span className="mono" style={{ fontSize: "0.85rem", color: "var(--accent-dark)", fontWeight: 800, display: "block", marginBottom: "16px" }}>02 SHARE</span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", marginBottom: "12px", letterSpacing: "-0.02em" }}>어디서나 간편하게</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
                  개인 맞춤형 QR코드 스캔 또는 하나의 고유한 URL 링크로 나의 포트폴리오를 빠르게 보여주고 전달합니다.
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
                <span className="mono" style={{ fontSize: "0.85rem", color: "var(--accent-dark)", fontWeight: 800, display: "block", marginBottom: "16px" }}>03 CONNECT</span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", marginBottom: "12px", letterSpacing: "-0.02em" }}>협업 기회와 연결</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
                  작품과 아티스트를 탐색하는 기획자, 연출가, 브랜드 및 관람객들과 만나고 새로운 협업의 기회를 발견합니다.
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
                <span className="mono" style={{ fontSize: "0.85rem", color: "var(--accent-dark)", fontWeight: 800, display: "block", marginBottom: "16px" }}>04 GROW</span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", marginBottom: "12px", letterSpacing: "-0.02em" }}>더 넓은 도달과 도약</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
                  내 프로필이 어떻게 발견되는지 간결한 통계 지표로 확인하고, 마케팅 데이터를 축적해 활동 영역을 넓힙니다.
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
      <section id="how-it-works" style={{
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
            POPOK is for every artist.
          </span>

          <div style={{
            display: "flex",
            gap: "12px",
            flexWrap: "nowrap"
          }}>
            {["DANCER", "CHOREOGRAPHER", "PERFORMING ARTIST", "VISUAL ARTIST", "MUSICIAN", "CREATOR"].map((cat) => (
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
      <section style={{
        padding: "100px 32px",
        maxWidth: "1120px",
        margin: "0 auto",
      }}>
        {/* Title */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "48px"
        }}>
          <div>
            <span className="mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)", fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
              DISCOVER
            </span>
            <h2 className="display" style={{
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              color: "var(--navy)",
              fontWeight: 900,
              letterSpacing: "-0.03em"
            }}>
              Meet artists on POPOK.
            </h2>
          </div>
          <Link href="/artists" style={{
            textDecoration: "none",
            color: "var(--navy)",
            fontWeight: 800,
            fontSize: "0.9rem",
            borderBottom: "1.5px solid var(--navy)",
            paddingBottom: "2px",
          }}>
            Explore all artists
          </Link>
        </div>

        {/* Horizontal Card List */}
        <div className="no-scrollbar" style={{
          display: "flex",
          gap: "24px",
          overflowX: "auto",
          paddingBottom: "24px",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch"
        }}>
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
                        filter: "grayscale(1) contrast(1.05)"
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
                        {a.bio || a.aiSummary || `${a.name}의 고유한 예술 세계와 포트폴리오를 확인해 보세요.`}
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
                      <span>View POPOK</span>
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
      <section style={{
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
            Your work deserves<br />
            a place of its own.
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
            Create your POPOK.<br />
            Share one link. Be discovered.
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
            Create my POPOK <span style={{ fontSize: "1.15rem" }}>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
