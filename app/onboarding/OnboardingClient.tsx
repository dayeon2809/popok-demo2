"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AiProfileImporter from "@/components/profile/AiProfileImporter";
import { analytics } from "@/lib/analytics";
import AiProfileReview from "@/components/profile/AiProfileReview";

export default function OnboardingClient({ defaultEmail, defaultDisplayName }: { defaultEmail: string; defaultDisplayName: string }) {
  const router = useRouter();

  // Wizard state
  // /onboarding is now individual-artist-only — organizations apply via
  // /organizations/apply instead (see app/auth/AuthClient.tsx).
  // V2 (feature/home-feed-v2): merged into 4 screens instead of 6 — identity
  // (name+address), genre+role, optional AI import, done — so a new user
  // reaches the upload screen with as little form-filling as possible.
  // 1=identity 2=genre&role 3=AI(optional) 4=complete
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(defaultDisplayName || "");
  const [username, setUsername] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [genre, setGenre] = useState("");
  const [role, setRole] = useState("");

  // AI states
  const [aiState, setAiState] = useState<"choose" | "import" | "review" | "none">("choose");
  const [aiDraft, setAiDraft] = useState<any>(null);
  const [aiProfileData, setAiProfileData] = useState<any>(null);

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<{
    valid: boolean;
    checking: boolean;
    message: string;
  }>({ valid: false, checking: false, message: "" });

  const [submitting, setSubmitting] = useState(false);

  // Auto-suggest a POPOK address from the display name so step 1 rarely
  // requires the user to think about it — still fully editable, and the
  // debounced availability check below runs on whatever ends up in the
  // field either way. Only auto-fills until the user edits it themselves;
  // Korean names (no latin/digit characters) fall back to a short random
  // suggestion since there's no transliteration utility in this project to
  // reuse and a made-up one would be misleading.
  useEffect(() => {
    if (step !== 1 || usernameTouched) return;
    const slug = displayName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    if (slug.length >= 3) {
      setUsername(slug);
    } else if (displayName.trim()) {
      setUsername((prev) => prev || `artist-${Math.random().toString(36).slice(2, 8)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, step]);

  // Debounced username checking
  useEffect(() => {
    if (step !== 1) return;

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setUsernameStatus({ valid: false, checking: false, message: "주소를 입력해 주세요." });
      return;
    }

    if (cleanUsername.length < 3) {
      setUsernameStatus({ valid: false, checking: false, message: "최소 3자 이상 입력해 주세요." });
      return;
    }

    const usernameRegex = /^[a-z0-9-]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      setUsernameStatus({ valid: false, checking: false, message: "영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다." });
      return;
    }

    const reservedWords = [
      "admin", "api", "auth", "login", "signup", "artists", "submit", "recommend", "onboarding", "my-popok"
    ];
    if (reservedWords.includes(cleanUsername)) {
      setUsernameStatus({ valid: false, checking: false, message: "사용할 수 없는 예약어입니다." });
      return;
    }

    setUsernameStatus(prev => ({ ...prev, checking: true, message: "" }));

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${cleanUsername}`);
        const data = await res.json();
        if (data.available) {
          setUsernameStatus({ valid: true, checking: false, message: "✓ 사용 가능한 주소입니다." });
        } else {
          setUsernameStatus({ valid: false, checking: false, message: `× ${data.message}` });
        }
      } catch (err) {
        setUsernameStatus({ valid: false, checking: false, message: "× 주소 확인 중 오류가 발생했습니다." });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, step]);

  const handleNext = () => {
    if (step === 1 && !displayName.trim()) {
      alert("활동명을 입력해 주세요.");
      return;
    }
    if (step === 1 && !usernameStatus.valid) {
      alert("올바르고 사용 가능한 주소를 입력해 주세요.");
      return;
    }
    if (step === 2 && !genre.trim()) {
      alert("주 활동 분야를 선택하거나 입력해 주세요.");
      return;
    }
    if (step === 2 && !role.trim()) {
      alert("주 역할을 선택하거나 입력해 주세요.");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    // Stepping back into the AI step should always land on the choose screen,
    // not the transitional "none" state left over from finishing/skipping it.
    if (step === 4 && aiState === "none") {
      setAiState("choose");
    }
    setStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/artists/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          username,
          genre,
          role,
          bio: aiProfileData?.artist?.bio || null,
          bio_short: aiProfileData?.artist?.bio_short || null,
          works: aiProfileData?.works || [],
          affiliations: aiProfileData?.affiliations || [],
          current_activity: aiProfileData?.current_activity || [],
          awards: aiProfileData?.awards || [],
          competitions: aiProfileData?.competitions || [],
          education: aiProfileData?.education || [],
          links: aiProfileData?.links || [],
          review_links: aiProfileData?.review_links || []
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        analytics.signUp("google");
        if (data.artistId) {
          analytics.portfolioCreated(data.artistId);
        }
        // V2 (feature/home-feed-v2): land straight in upload mode, not the
        // plain dashboard — see MyPopokClient's `?upload=1` handling.
        router.push("/my-popok?upload=1");
        router.refresh();
      } else {
        alert(data.error || "온보딩 저장 중 오류가 발생했습니다.");
        setSubmitting(false);
      }
    } catch (err: any) {
      alert("서버 연결에 실패했습니다: " + err.message);
      setSubmitting(false);
    }
  };

  const GENRE_OPTIONS = ["현대무용", "발레", "한국무용", "음악", "미술", "배우"];
  const ROLE_OPTIONS = ["무용수", "안무가", "배우", "기획자", "단원", "예술감독", "작곡가", "지휘자", "연주자", "성악가"];

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "75vh",
      padding: "24px"
    }}>
      <div className="card fade-up" style={{
        maxWidth: step === 3 && aiState === "review" ? "720px" : "480px",
        width: "100%",
        padding: "40px 32px",
        background: "#FFFFFF",
        border: "1.5px solid var(--border)",
        borderRadius: "20px",
        boxShadow: "0 10px 40px rgba(23, 20, 17, 0.04)",
        transition: "max-width 0.2s ease"
      }}>
        {(
          /* Step indicators */
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px", position: "relative" }}>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "0",
              right: "0",
              height: "2px",
              background: "var(--border)",
              zIndex: 1,
              transform: "translateY(-50%)"
            }} />
            <div style={{
              position: "absolute",
              top: "50%",
              left: "0",
              width: `${((step - 1) / 3) * 100}%`,
              height: "2px",
              background: "var(--navy)",
              zIndex: 1,
              transform: "translateY(-50%)",
              transition: "width 0.3s ease"
            }} />
            {[1, 2, 3, 4].map((num) => (
              <div key={num} style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: num <= step ? "var(--navy)" : "var(--border)",
                color: num <= step ? "#FFFFFF" : "var(--ink-muted)",
                fontSize: "0.75rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
                transition: "all 0.3s ease"
              }}>
                {num}
              </div>
            ))}
          </div>
        )}

        {/* STEP 1: display_name + address, merged onto one screen (V2) */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--navy)", marginBottom: "8px" }}>
              내 작업 공간을 만들어볼까요?
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", marginBottom: "20px" }}>
              활동명과 공개 주소만 정하면 바로 사진을 올릴 수 있어요.
            </p>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "6px" }}>
              활동명
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="예: 홍길동"
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1.5px solid var(--border)",
                borderRadius: "12px",
                fontSize: "1rem",
                marginBottom: "20px"
              }}
              autoFocus
            />

            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "6px" }}>
              공개 주소 (popok.kr/주소) — 활동명으로 자동 채워드려요, 원하면 수정하세요.
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsernameTouched(true);
                setUsername(e.target.value);
              }}
              placeholder="dayeon"
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1.5px solid var(--border)",
                borderRadius: "12px",
                fontSize: "1rem"
              }}
            />
            {username.trim() && (
              <div style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: usernameStatus.checking
                  ? "var(--ink-muted)"
                  : usernameStatus.valid
                    ? "var(--verified)"
                    : "var(--needs-review)",
                marginTop: "4px",
                paddingLeft: "4px"
              }}>
                {usernameStatus.checking ? "확인 중..." : usernameStatus.message}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: genre + role, merged onto one screen (V2) */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--navy)", marginBottom: "8px" }}>
              어떤 활동을 하시나요?
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", marginBottom: "20px" }}>
              한 번씩만 골라주세요. 나중에 언제든 바꿀 수 있어요.
            </p>

            <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "8px" }}>
              주 활동 분야
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
              {GENRE_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setGenre(opt)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "20px",
                    border: "1.5px solid",
                    borderColor: genre === opt ? "var(--navy)" : "var(--border-dark)",
                    background: genre === opt ? "var(--accent)" : "transparent",
                    color: "var(--navy)",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="직접 입력 (예: 미디어아트)"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1.5px solid var(--border)",
                borderRadius: "12px",
                fontSize: "0.95rem",
                marginBottom: "20px"
              }}
            />

            <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "8px" }}>
              주 역할
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
              {ROLE_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setRole(opt)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "20px",
                    border: "1.5px solid",
                    borderColor: role === opt ? "var(--navy)" : "var(--border-dark)",
                    background: role === opt ? "var(--accent)" : "transparent",
                    color: "var(--navy)",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="직접 입력 (예: 사운드 디자이너)"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1.5px solid var(--border)",
                borderRadius: "12px",
                fontSize: "0.95rem"
              }}
            />
          </div>
        )}

        {/* STEP 3: AI-assisted enrichment (optional, asked last) */}
        {step === 3 && aiState === "choose" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h2 style={{ fontSize: "1.45rem", fontWeight: 950, color: "var(--navy)", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
                이미 정리해둔 이력이 있나요?
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", lineHeight: 1.5, fontWeight: 600, margin: 0 }}>
                이력서나 기존 소개글을 넣으면 POPOK AI가 한줄 소개, 상세 소개, 대표작 설명까지 초안으로 정리해드려요. 확인하고 수정한 뒤 사용할 수 있어요. (선택 사항)
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={() => setAiState("import")}
                className="btn-lime"
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: "none",
                  textAlign: "center",
                  cursor: "pointer",
                  fontWeight: 900,
                  fontSize: "0.95rem"
                }}
              >
                ✨ AI로 빠르게 시작하기
              </button>
              <button
                onClick={() => {
                  setAiState("none");
                  setStep(4);
                }}
                className="btn-outline"
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1.5px solid var(--border)",
                  background: "#FFFFFF",
                  textAlign: "center",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: "0.95rem"
                }}
              >
                건너뛰기
              </button>
            </div>
          </div>
        )}

        {step === 3 && aiState === "import" && (
          <AiProfileImporter
            onParsed={(data) => {
              setAiDraft(data);
              setAiState("review");
            }}
            onCancel={() => setAiState("choose")}
          />
        )}

        {step === 3 && aiState === "review" && aiDraft && (
          <AiProfileReview
            initialDraft={aiDraft}
            onConfirm={(finalDraft) => {
              setAiProfileData(finalDraft);
              setAiState("none");
              setStep(4);
            }}
            onCancel={() => {
              setAiState("import");
            }}
          />
        )}

        {/* STEP 4: complete */}
        {step === 4 && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: "3rem",
              marginBottom: "16px",
              animation: "float1 4s ease-in-out infinite"
            }}>
              🎉
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--navy)", marginBottom: "8px" }}>
              내 작업 공간이 준비됐어요!
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", marginBottom: "28px", lineHeight: 1.5 }}>
              <strong>{displayName}</strong> 님, 이제 사진만 올리면<br />
              포퐄이 작업과 이력을 정리해드려요.
            </p>
            <div style={{
              background: "#FFFFFF",
              padding: "16px",
              borderRadius: "12px",
              border: "1px dashed var(--border-dark)",
              textAlign: "left",
              fontSize: "0.88rem",
              marginBottom: "32px"
            }}>
              <div style={{ marginBottom: "6px" }}><span style={{ color: "var(--ink-muted)" }}>유형:</span> <strong>개인 예술가</strong></div>
              <div style={{ marginBottom: "6px" }}><span style={{ color: "var(--ink-muted)" }}>주소:</span> <strong>popok.kr/{username}</strong></div>
              <div style={{ marginBottom: "6px" }}><span style={{ color: "var(--ink-muted)" }}>장르:</span> <strong>{genre}</strong></div>
              <div><span style={{ color: "var(--ink-muted)" }}>역할:</span> <strong>{role}</strong></div>
            </div>
          </div>
        )}

        {/* The AI import/review sub-screens (step 5) provide their own back/cancel navigation */}
        {!(step === 3 && aiState !== "choose") && (
          /* Navigation Buttons */
          <div style={{ display: "flex", gap: "12px", marginTop: "36px" }}>
            {step > 1 && (
              <button
                onClick={handlePrev}
                disabled={submitting}
                className="btn-outline"
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  borderRadius: "12px",
                  fontSize: "0.95rem",
                  fontWeight: 750,
                  cursor: "pointer"
                }}
              >
                이전
              </button>
            )}
            {step === 3 ? null : step < 4 ? (
              <button
                onClick={handleNext}
                className="btn-lime"
                style={{
                  flex: 2,
                  padding: "14px 20px",
                  borderRadius: "12px",
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                다음
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={submitting}
                className="btn-lime"
                style={{
                  flex: 2,
                  padding: "14px 20px",
                  borderRadius: "12px",
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  cursor: submitting ? "not-allowed" : "pointer"
                }}
              >
                {submitting ? "생성 중..." : "사진 올리러 가기"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
