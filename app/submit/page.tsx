"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const GENRE_OPTS = [
  { value: "Dancer", label: "DANCER" },
  { value: "Choreographer", label: "CHOREOGRAPHER" },
  { value: "Performing Artist", label: "PERFORMING ARTIST" },
  { value: "Visual Artist", label: "VISUAL ARTIST" },
  { value: "Musician", label: "MUSICIAN" },
  { value: "Creator", label: "CREATOR" },
];

export default function SubmitPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [instagram, setInstagram] = useState("");
  
  // Interaction steps: "form" | "animating" | "success"
  const [flowState, setFlowState] = useState<"form" | "animating" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [generatedId, setGeneratedId] = useState("");

  const cleanInstagramHandle = (url: string) => {
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

  const getSlugifiedName = (str: string) => {
    if (!str) return "username";
    return str
      .replace(/[^\w가-힣\s-]/g, "")
      .trim()
      .replace(/[\s\t]+/g, "-")
      .toLowerCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !genre || !instagram) {
      setErrorMsg("모든 필드를 입력해 주세요.");
      return;
    }
    setErrorMsg("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/popok-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, genre, instagram }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "카드 발급 중 오류가 발생했습니다.");
        setSubmitting(false);
        return;
      }

      setGeneratedId(data.id);
      
      // Start card issuance animation
      setFlowState("animating");
      
      // Step 2: Show cards overlap and merge (1.5s)
      setTimeout(() => {
        setFlowState("success");
      }, 2200);

      // Step 3: Redirect to result page (3.8s total)
      setTimeout(() => {
        router.push(`/p/${data.id}`);
      }, 3800);

    } catch (err) {
      setErrorMsg("네트워크 연결 실패. 다시 시도해 주세요.");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: "var(--bg-warm)", minHeight: "90vh", display: "flex", alignItems: "center", padding: "40px 24px" }}>
      <div style={{ maxWidth: "1120px", margin: "0 auto", width: "100%" }}>
        
        {/* ── FLOW 1: REGISTRATION FORM & LIVE PREVIEW ── */}
        {flowState === "form" && (
          <div className="responsive-stack-320" style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: "60px",
            alignItems: "center",
            transition: "all 0.5s ease"
          }}>
            {/* Left Column: Input Form */}
            <div className="fade-up">
              <h1 className="display" style={{ fontSize: "clamp(2rem, 4vw, 2.6rem)", color: "var(--navy)", marginBottom: "16px", letterSpacing: "-0.03em" }}>
                Create your POPOK.
              </h1>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "36px" }}>
                30초 만에 자신을 빠르게 표현하는 디지털 명함을 발급해보세요.<br />
                필요한 핵심 정보 3개만 기입하면 완료됩니다.
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* 1. Name */}
                <div>
                  <label htmlFor="name" style={{ display: "block", marginBottom: "8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)", letterSpacing: "0.05em" }}>
                    이름 / 활동명
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 최지안 (JIAN CHOI)"
                    style={{
                      width: "100%", padding: "14px 18px", border: "1px solid var(--border)", borderRadius: "12px",
                      fontSize: "0.95rem", outline: "none", background: "#FFFFFF", color: "var(--navy)"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--navy)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                  />
                </div>

                {/* 2. Genre / Role */}
                <div>
                  <label htmlFor="genre" style={{ display: "block", marginBottom: "8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)", letterSpacing: "0.05em" }}>
                    장르 / 역할
                  </label>
                  <select
                    id="genre"
                    required
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    style={{
                      width: "100%", padding: "14px 18px", border: "1px solid var(--border)", borderRadius: "12px",
                      fontSize: "0.95rem", outline: "none", background: "#FFFFFF", color: genre ? "var(--navy)" : "var(--ink-muted)",
                      appearance: "none", backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23171411%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')",
                      backgroundRepeat: "no-repeat", backgroundPosition: "right 18px top 50%", backgroundSize: "12px auto"
                    }}
                  >
                    <option value="" disabled>분야를 선택해 주세요</option>
                    {GENRE_OPTS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Instagram Link */}
                <div>
                  <label htmlFor="instagram" style={{ display: "block", marginBottom: "8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)", letterSpacing: "0.05em" }}>
                    인스타그램 프로필 링크
                  </label>
                  <input
                    id="instagram"
                    type="url"
                    required
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/유저아이디"
                    style={{
                      width: "100%", padding: "14px 18px", border: "1px solid var(--border)", borderRadius: "12px",
                      fontSize: "0.95rem", outline: "none", background: "#FFFFFF", color: "var(--navy)"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--navy)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                  />
                </div>

                {errorMsg && (
                  <p style={{ fontSize: "0.85rem", color: "#EF4444", fontWeight: 600 }}>{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-lime"
                  style={{
                    width: "100%", padding: "16px", borderRadius: "12px", border: "none",
                    fontSize: "0.95rem", fontWeight: 800, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    marginTop: "12px", opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? "Creating your card..." : "Create my POPOK →"}
                </button>
              </form>
            </div>

            {/* Right Column: Live Card Preview */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink-muted)", fontWeight: 700, marginBottom: "16px", letterSpacing: "0.05em" }}>
                LIVE CARD PREVIEW
              </span>
              
              {/* Overlapping Card Container */}
              <div style={{ position: "relative", width: "100%", height: "420px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* Back card (Lime) */}
                <div style={{
                  position: "absolute", width: "240px", height: "340px", background: "var(--accent)",
                  border: "1.5px solid var(--navy)", borderRadius: "18px", padding: "20px",
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  transform: "rotate(6deg) translateX(30px)", transition: "all 0.3s ease", zIndex: 1
                }}>
                  <div style={{ fontWeight: 950, fontSize: "1.1rem", color: "var(--navy)", letterSpacing: "-0.04em" }}>
                    POPOK<span style={{ color: "var(--navy)" }}>.</span>
                  </div>
                  <div>
                    <p style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--navy)", lineHeight: 1.25, letterSpacing: "-0.03em" }}>
                      Your work,<br />connected.
                    </p>
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--navy)", fontWeight: 700 }}>
                    popok.kr/p/{getSlugifiedName(name)}
                  </div>
                </div>

                {/* Front card (White) */}
                <div style={{
                  position: "absolute", width: "240px", height: "340px", background: "#FFFFFF",
                  border: "1.5px solid var(--border)", borderRadius: "18px", padding: "16px",
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  transform: "rotate(-3deg) translateX(-30px)", transition: "all 0.3s ease", zIndex: 2
                }}>
                  {/* Portrait Placeholder */}
                  <div style={{
                    width: "100%", height: "180px", borderRadius: "10px", overflow: "hidden",
                    background: "#F5F1E8", display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid var(--border)"
                  }}>
                    <img
                      src={`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name || "popok")}`}
                      alt="Art avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }}
                    />
                  </div>
                  
                  {/* Profile Metadata */}
                  <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between", paddingTop: "12px" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--navy)" }}>
                          {name || "YOUR NAME"}
                        </h3>
                        <span className="mono" style={{ fontSize: "0.58rem", color: "var(--accent-dark)", fontWeight: 700 }}>
                          {genre || "CREATIVE"}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.72rem", color: "var(--ink-muted)", marginTop: "4px" }}>
                        {cleanInstagramHandle(instagram)}
                      </p>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      borderTop: "1px solid var(--border)", paddingTop: "8px", fontSize: "0.7rem", fontWeight: 700
                    }}>
                      <span>View Works</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FLOW 2: CARD ISSUANCE ASSEMBLY ANIMATION ── */}
        {(flowState === "animating" || flowState === "success") && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: "60vh", width: "100%", animation: "fadeIn 0.5s ease"
          }}>
            {/* Visual Assembly Stage */}
            <div style={{
              position: "relative", width: "320px", height: "400px",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              
              {/* Back Card (Lime) */}
              <div style={{
                position: "absolute", width: "240px", height: "340px", background: "var(--accent)",
                border: "1.5px solid var(--navy)", borderRadius: "18px", padding: "20px",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                boxShadow: "0 8px 32px rgba(23, 20, 17, 0.08)",
                
                // Animation states
                transform: flowState === "success" 
                  ? "rotate(5deg) translate(30px, 0)" 
                  : "rotate(0deg) translate(0, 0) scale(0.9)",
                opacity: flowState === "animating" ? 0.5 : 1,
                zIndex: flowState === "success" ? 1 : 2,
                transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)"
              }}>
                <div style={{ fontWeight: 950, fontSize: "1.1rem", color: "var(--navy)", letterSpacing: "-0.04em" }}>
                  POPOK<span style={{ color: "var(--navy)" }}>.</span>
                </div>
                <div>
                  <p style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--navy)", lineHeight: 1.25, letterSpacing: "-0.03em" }}>
                    Your work,<br />connected.
                  </p>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--navy)", fontWeight: 700 }}>
                  popok.kr/p/{getSlugifiedName(name)}
                </div>
              </div>

              {/* Front Card (White) */}
              <div style={{
                position: "absolute", width: "240px", height: "340px", background: "#FFFFFF",
                border: "1.5px solid var(--border)", borderRadius: "18px", padding: "16px",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                boxShadow: "0 16px 40px rgba(23, 20, 17, 0.08)",
                
                // Animation states
                transform: flowState === "success" 
                  ? "rotate(-3deg) translate(-30px, 0)" 
                  : "rotate(0deg) translate(0, 0) scale(1)",
                zIndex: flowState === "success" ? 2 : 3,
                transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)"
              }}>
                <div style={{
                  width: "100%", height: "180px", borderRadius: "10px", overflow: "hidden",
                  background: "#F5F1E8", display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid var(--border)"
                }}>
                  <img
                    src={`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name || "popok")}`}
                    alt="Art avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }}
                  />
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between", paddingTop: "12px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--navy)" }}>{name}</h3>
                      <span className="mono" style={{ fontSize: "0.58rem", color: "var(--accent-dark)", fontWeight: 700 }}>
                        {genre}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.72rem", color: "var(--ink-muted)", marginTop: "4px" }}>
                      {cleanInstagramHandle(instagram)}
                    </p>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    borderTop: "1px solid var(--border)", paddingTop: "8px", fontSize: "0.7rem", fontWeight: 700
                  }}>
                    <span>View Works</span>
                    <span>→</span>
                  </div>
                </div>
              </div>

              {/* QR Badge popup */}
              <div style={{
                position: "absolute", bottom: "40px", right: "10px",
                width: "70px", height: "70px", borderRadius: "50%",
                background: "#FFFFFF", border: "1.5px solid var(--navy)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                
                // Animation states
                transform: flowState === "success" 
                  ? "scale(1) rotate(-12deg)" 
                  : "scale(0) rotate(0deg)",
                opacity: flowState === "success" ? 1 : 0,
                transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s",
                zIndex: 3
              }}>
                <span style={{ fontSize: "0.42rem", fontWeight: 900, color: "var(--navy)", textTransform: "uppercase" }}>SCAN</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--navy)" }}>
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span style={{ fontSize: "0.42rem", fontWeight: 900, color: "var(--navy)", textTransform: "uppercase" }}>POPOK</span>
              </div>
            </div>

            {/* Success message indicators */}
            <div style={{ textAlign: "center", marginTop: "32px" }}>
              <h2 className="display" style={{
                fontSize: "1.8rem", color: "var(--navy)", fontWeight: 900,
                opacity: flowState === "success" ? 1 : 0.3,
                transform: flowState === "success" ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.6s ease 0.2s"
              }}>
                {flowState === "success" ? "Your POPOK is ready." : "Generating your card..."}
              </h2>
              <p style={{
                color: "var(--ink-muted)", fontSize: "0.85rem", marginTop: "8px",
                opacity: flowState === "success" ? 1 : 0,
                transition: "all 0.6s ease 0.4s"
              }}>
                디지털 명함 화면으로 이동하고 있습니다. 잠시만 기다려주세요.
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
