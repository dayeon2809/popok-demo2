"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import YouTubeMotionPreview from "@/components/YouTubeMotionPreview";
import { getVimeoEmbedUrl, isSupportedMotionVideoUrl, isVimeoUrl } from "@/lib/videoLinks";
import { isYouTubeUrl } from "@/lib/youtube";

import QRCode from "qrcode";

const GENRE_OPTS = [
  { value: "Dancer", label: "DANCER" },
  { value: "Choreographer", label: "CHOREOGRAPHER" },
  { value: "Performing Artist", label: "PERFORMING ARTIST" },
  { value: "Visual Artist", label: "VISUAL ARTIST" },
  { value: "Musician", label: "MUSICIAN" },
  { value: "Creator", label: "CREATOR" },
];

export default function SubmitPage() {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [instagram, setInstagram] = useState("");
  const [email, setEmail] = useState("");
  
  // Multi-image upload states
  const [profileImageFiles, setProfileImageFiles] = useState<File[]>([]);
  const [profileImagePreviews, setProfileImagePreviews] = useState<string[]>([]);
  
  const [motionVideoUrl, setMotionVideoUrl] = useState("");
  const [additionalRequests, setAdditionalRequests] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  
  // Interaction steps: "form" | "animating" | "success"
  const [flowState, setFlowState] = useState<"form" | "animating" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [generatedId, setGeneratedId] = useState("");

  useEffect(() => {
    return () => {
      profileImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [profileImagePreviews]);

  // QR Code generation trigger when success
  useEffect(() => {
    if (flowState === "success" && generatedId) {
      const publicPath = `/p/${generatedId}`;
      const fullUrl = `${window.location.origin}${publicPath}`;
      QRCode.toDataURL(fullUrl, { width: 160, margin: 1 })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error("[QRCode] generation failed", err));
    }
  }, [flowState, generatedId]);

  const handleProfileImagesChange = (files: FileList | null) => {
    // Clear old previews
    profileImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    
    if (!files) {
      setProfileImageFiles([]);
      setProfileImagePreviews([]);
      return;
    }
    const arr = Array.from(files);
    setProfileImageFiles(arr);
    setProfileImagePreviews(arr.map(f => URL.createObjectURL(f)));
  };

  const uploadOptionalFile = async (file: File, bucket: string, path: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    formData.append("path", path);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "이미지 업로드에 실패했어요. 다시 시도해주세요.");
    }
    return data.url as string;
  };

  // Storage 경로에는 사용자가 입력한 이름 등 원본 문자열을 절대 사용하지 않는다.
  // 아직 submission row가 생성되기 전이라 실제 submissionId가 없으므로,
  // 타임스탬프 + 랜덤 ID 조합의 안전한 임시 폴더명을 만들어 사용한다.
  const generateSafeSubmissionId = () => {
    const random =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID().split("-")[0]
        : Math.random().toString(36).slice(2, 10);
    return `${Date.now()}-${random}`;
  };

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
    if (!name || !genre || !instagram || !email) {
      setErrorMsg("모든 필드를 입력해 주세요.");
      return;
    }
    const cleanMotionVideoUrl = motionVideoUrl.trim();
    if (cleanMotionVideoUrl && !isSupportedMotionVideoUrl(cleanMotionVideoUrl)) {
      setErrorMsg("Motion Profile Video는 YouTube 또는 Vimeo 링크만 입력할 수 있습니다.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);

    try {
      // 경로에 이름 등 사용자 입력 원본 문자열을 넣지 않는다 — 실제 이름은 submissions 테이블의 name 필드에만 저장한다.
      const uploadBasePath = `submissions/${generateSafeSubmissionId()}/profile`;

      // Upload multiple profile images (파일명은 서버에서 랜덤 UUID로 생성됨)
      const uploadPromises = profileImageFiles.map((file) =>
        uploadOptionalFile(file, "artist-media", uploadBasePath)
      );
      const profileImageUrls = await Promise.all(uploadPromises);

      const res = await fetch("/api/popok-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          genre,
          instagram,
          email,
          profileImageUrls,
          motionVideoUrl: cleanMotionVideoUrl,
          additionalRequests,
          youtubePreviewStart: 0,
          youtubePreviewEnd: 15
        }),
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

    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[Submit] Failed:", err);
      }
      setErrorMsg(err?.message || "네트워크 연결 실패. 다시 시도해 주세요.");
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

                {/* 1-2. Email */}
                <div>
                  <label htmlFor="email" style={{ display: "block", marginBottom: "8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)", letterSpacing: "0.05em" }}>
                    이메일 주소
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{
                      width: "100%", padding: "14px 18px", border: "1px solid var(--border)", borderRadius: "12px",
                      fontSize: "0.95rem", outline: "none", background: "#FFFFFF", color: "var(--navy)"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--navy)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                  />
                  <p style={{ fontSize: "0.72rem", color: "var(--ink-muted)", marginTop: "4px" }}>
                    포퐄 페이지가 준비되면 입력하신 이메일로 안내드릴게요.
                  </p>
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

                <div style={{
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  background: "#FFFFFF",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}>
                  <div>
                    <span className="mono" style={{ display: "block", fontSize: "0.68rem", fontWeight: 850, color: "var(--accent-dark)", letterSpacing: "0.08em", marginBottom: "4px" }}>
                      OPTIONAL MEDIA
                    </span>
                    <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.5, margin: 0 }}>
                      파일을 올리지 않아도 POPOK 생성은 가능합니다.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="profileImage" style={{ display: "block", marginBottom: "6px", fontSize: "0.72rem", fontWeight: 800, color: "var(--navy)" }}>
                      Profile Images (여러 장 선택 가능)
                    </label>
                    <input
                      id="profileImage"
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleProfileImagesChange(e.target.files)}
                      style={{ width: "100%", fontSize: "0.82rem", color: "var(--ink-muted)" }}
                    />
                    <p style={{ fontSize: "0.7rem", color: "var(--ink-faint)", marginTop: "5px" }}>
                      jpg, jpeg, png, webp (첫 번째 이미지가 대표 프로필로 지정됩니다)
                    </p>
                    
                    {profileImagePreviews.length > 0 && (
                      <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "8px 0" }} className="no-scrollbar">
                        {profileImagePreviews.map((url, idx) => (
                          <div key={idx} style={{ position: "relative", width: "60px", height: "60px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)", flexShrink: 0 }}>
                            <img src={url} alt={`preview_${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            {idx === 0 && (
                              <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--navy)", color: "#FFF", fontSize: "0.55rem", textAlign: "center", fontWeight: 700, padding: "2px 0" }}>대표</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="motionVideoUrl" style={{ display: "block", marginBottom: "6px", fontSize: "0.72rem", fontWeight: 800, color: "var(--navy)" }}>
                      Motion Profile Video Link
                    </label>
                    <input
                      id="motionVideoUrl"
                      type="url"
                      value={motionVideoUrl}
                      onChange={(e) => setMotionVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... 또는 https://vimeo.com/..."
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        fontSize: "0.86rem",
                        outline: "none",
                        background: "#FFFFFF",
                        color: "var(--navy)",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "var(--navy)"}
                      onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                    />
                    <p style={{ fontSize: "0.7rem", color: "var(--ink-muted)", marginTop: "5px" }}>
                      가장 잘 보여주는 영상 링크를 남겨주세요. 포퐄에 어울리는 하이라이트 구간은 페이지 제작 과정에서 정리해드려요. (YouTube / Vimeo 지원)
                    </p>
                  </div>
                </div>

                {/* 4. Additional Requests */}
                <div>
                  <label htmlFor="additionalRequests" style={{ display: "block", marginBottom: "8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--navy)", letterSpacing: "0.05em" }}>
                    추가 요청사항
                  </label>
                  <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.5, margin: "0 0 8px 0" }}>
                    사진, 영상, 링크 업로드가 어렵거나 추가로 반영하고 싶은 내용이 있다면 자유롭게 남겨주세요.
                  </p>
                  <textarea
                    id="additionalRequests"
                    value={additionalRequests}
                    onChange={(e) => setAdditionalRequests(e.target.value)}
                    placeholder="예: 유튜브 링크가 잘 안 올라가요. / 프로필 사진 2장을 추가하고 싶어요. / 작품 소개를 나중에 더 넣고 싶어요."
                    rows={4}
                    style={{
                      width: "100%", padding: "14px 18px", border: "1px solid var(--border)", borderRadius: "12px",
                      fontSize: "0.92rem", outline: "none", background: "#FFFFFF", color: "var(--navy)", resize: "vertical",
                      fontFamily: "inherit", lineHeight: 1.5
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
                      src={profileImagePreviews[0] || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name || "popok")}`}
                      alt="Art avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: profileImagePreviews[0] ? 1 : 0.8 }}
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
              {motionVideoUrl.trim() && isSupportedMotionVideoUrl(motionVideoUrl) && (
                <div style={{
                  marginTop: "18px",
                  width: "118px",
                  aspectRatio: "9 / 16",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1.5px solid var(--border)",
                  background: "#111",
                  boxShadow: "0 10px 24px rgba(23,20,17,0.08)",
                }}>
                  {isYouTubeUrl(motionVideoUrl) ? (
                    <YouTubeMotionPreview
                      videoUrl={motionVideoUrl}
                      title="Motion Profile preview"
                      aspectRatio="9 / 16"
                      playMode="always"
                      fill
                    />
                  ) : isVimeoUrl(motionVideoUrl) ? (
                    <iframe
                      src={getVimeoEmbedUrl(motionVideoUrl, true) || ""}
                      title="Motion Profile preview"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      style={{ width: "100%", height: "100%", border: 0, display: "block" }}
                    />
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FLOW 2: CARD ISSUANCE ASSEMBLY ANIMATION ── */}
        {(flowState === "animating" || flowState === "success") && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: "50vh", width: "100%", animation: "fadeIn 0.5s ease"
          }}>
            {/* Visual Assembly Stage */}
            {flowState === "animating" ? (
              <div style={{
                position: "relative", width: "320px", height: "150px",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <div style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  border: "4px solid var(--border)",
                  borderTopColor: "var(--navy)",
                  animation: "spin 1s linear infinite"
                }} />
              </div>
            ) : (
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "#ECFDF5",
                border: "1.5px solid #10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "10px",
                color: "#10B981",
                fontSize: "2.2rem",
                fontWeight: 900
              }}>
                ✓
              </div>
            )}

            {/* Success message indicators */}
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <h2 className="display" style={{
                fontSize: "1.8rem", color: "var(--navy)", fontWeight: 900,
                opacity: flowState === "success" ? 1 : 0.3,
                transform: flowState === "success" ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.6s ease 0.2s"
              }}>
                {flowState === "success" ? "포퐄 등록이 완료되었어요." : "Generating your card..."}
              </h2>
              
              {flowState === "success" && (
                <>
                  <p style={{
                    color: "var(--ink-muted)", fontSize: "0.88rem", marginTop: "12px", lineHeight: "1.6",
                    maxWidth: "460px", margin: "12px auto 0"
                  }}>
                    아직 공개 전이에요. 포퐄 팀이 제출해주신 내용을 정리한 뒤 입력하신 이메일로 안내드릴게요.
                  </p>
                  
                  <div style={{ marginTop: "20px" }}>
                    <div style={{
                      color: "var(--ink-muted)", fontSize: "0.82rem",
                      background: "#FAF8F5", border: "1px solid var(--border)", borderRadius: "12px",
                      padding: "14px 20px", display: "inline-block", textAlign: "left", lineHeight: "1.5"
                    }}>
                      <span style={{ display: "block", fontSize: "0.74rem", color: "var(--accent-dark)", fontWeight: 800, marginBottom: "4px" }}>STATUS INQUIRY INFO</span>
                      등록번호는 <strong style={{ color: "var(--navy)", fontSize: "0.95rem" }}>{generatedId}</strong> 입니다.<br />
                      이 등록번호는 <strong style={{ color: "var(--navy)" }}>내 포퐄 확인하기</strong>에서 상태를 조회할 때 사용할 수 있어요.
                    </div>
                  </div>
                  
                  <div style={{
                    display: "flex",
                    gap: "10px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    marginTop: "30px",
                  }}>
                    <Link
                      href="/my-popok"
                      className="btn-lime"
                      style={{
                        textDecoration: "none",
                        padding: "14px 28px",
                        borderRadius: "12px",
                        fontSize: "0.92rem",
                        fontWeight: 900,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      내 포퐄 확인하기
                    </Link>
                    <Link
                      href="/artists"
                      className="btn-outline"
                      style={{
                        textDecoration: "none",
                        padding: "14px 28px",
                        borderRadius: "12px",
                        fontSize: "0.92rem",
                        fontWeight: 900,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      아티스트 둘러보기
                    </Link>
                  </div>
                </>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
