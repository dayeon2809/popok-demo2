"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import AiProfileImporter from "@/components/profile/AiProfileImporter";
import { analytics } from "@/lib/analytics";
import AiProfileReview from "@/components/profile/AiProfileReview";
import { ARTIST_ROLES, getArtistRoleLabel } from "@/lib/artistRoles";
import { useLanguage } from "@/lib/useLanguage";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import PopokCard from "@/components/PopokCard";
import { localizePath } from "@/lib/i18n/locale";

const ONBOARDING_DRAFT_KEY = "popok_onboarding_draft_v1";

export default function OnboardingClient({ defaultEmail, defaultDisplayName, isLoggedIn, shouldResume, startAsIndividual = false }: { defaultEmail: string; defaultDisplayName: string; isLoggedIn: boolean; shouldResume: boolean; startAsIndividual?: boolean }) {
  const router = useRouter();
  const { language } = useLanguage();
  const en = language === "en";
  const [profileType, setProfileType] = useState<"individual" | "organization" | null>(shouldResume || startAsIndividual ? "individual" : null);

  // Wizard state
  // /onboarding is now individual-artist-only — organizations apply via
  // /organizations/apply instead (see app/auth/AuthClient.tsx).
  // V2 (feature/home-feed-v2): merged into 4 screens instead of 6 — identity
  // (name+address), genre+role, optional AI import, done — so a new user
  // reaches the upload screen with as little form-filling as possible.
  // 1=identity 2=genre&role 3=AI(optional) 4=complete
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(defaultDisplayName || "");
  const [displayNameEn, setDisplayNameEn] = useState("");
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
  const resumeStartedRef = useRef(false);

  const buildPayload = useCallback(() => ({
    displayName, name_en: displayNameEn, username, genre, role,
    bio: aiProfileData?.artist?.bio || null,
    bio_short: aiProfileData?.artist?.bio_short || null,
    works: aiProfileData?.works || [], affiliations: aiProfileData?.affiliations || [],
    current_activity: aiProfileData?.current_activity || [], awards: aiProfileData?.awards || [],
    competitions: aiProfileData?.competitions || [], education: aiProfileData?.education || [],
    links: aiProfileData?.links || [], review_links: aiProfileData?.review_links || [],
  }), [displayName, displayNameEn, username, genre, role, aiProfileData]);

  const saveAndPublish = useCallback(async (payload: ReturnType<typeof buildPayload>) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/artists/onboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "프로필을 저장하지 못했습니다.");
      sessionStorage.removeItem(ONBOARDING_DRAFT_KEY);
      analytics.signUp("google");
      if (data.artistId) analytics.portfolioCreated(data.artistId);
      router.push("/my-popok?upload=1");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "프로필 저장 중 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isLoggedIn || !shouldResume || resumeStartedRef.current) return;
    const stored = sessionStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (!stored) return;
    resumeStartedRef.current = true;
    try { void saveAndPublish(JSON.parse(stored)); }
    catch { sessionStorage.removeItem(ONBOARDING_DRAFT_KEY); setSubmitting(false); }
  }, [isLoggedIn, shouldResume, saveAndPublish]);

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

  const handleSkipAi = () => {
    setAiState("none");
    setStep(4);
  };

  const handleComplete = async () => {
    const payload = buildPayload();
    if (isLoggedIn) {
      await saveAndPublish(payload);
      return;
    }
    sessionStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(payload));
    setSubmitting(true);
    const supabase = createBrowserSupabaseClient();
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
    callbackUrl.searchParams.set("redirect", "/onboarding?resume=1");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl.toString() } });
    if (error) {
      alert(`Google 로그인 중 오류가 발생했습니다: ${error.message}`);
      setSubmitting(false);
    }
  };

  const GENRE_OPTIONS = ["무용", "현대무용", "발레", "한국무용", "음악", "미술", "배우"];

  if (profileType === null) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: "24px" }}>
        <section className="card fade-up" style={{
          maxWidth: "420px", width: "100%", padding: "48px 32px", textAlign: "center",
          border: "1.5px solid var(--border)", background: "#FFFFFF", borderRadius: "20px",
          boxShadow: "0 8px 30px rgba(23, 20, 17, 0.04)",
        }}>
          <div style={{ marginBottom: "32px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "12px",
              color: "var(--navy)", fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.04em",
            }}>
              POPOK
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
            </div>
            <p style={{ margin: 0, color: "var(--ink-muted)", fontSize: "0.95rem", lineHeight: 1.5, fontWeight: 500 }}>
              {en ? <>A lighter way to build your portfolio.<br />Share your artistic practice with one link.</> : <>당신의 포트폴리오를, 더 가볍게.<br />하나의 링크로 예술가의 작업을 연결하세요.</>}
            </p>
          </div>

          <div style={{ textAlign: "left" }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--ink-muted)", marginBottom: "12px" }}>
              {en ? "Which POPOK profile would you like to create?" : "어떤 POPOK을 시작하시겠어요?"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button
              type="button"
              onClick={() => router.push("/auth?mode=artist")}
              style={{ padding: "16px", borderRadius: "12px", border: "1.5px solid var(--border)", background: "#FFFFFF", textAlign: "left", cursor: "pointer", transition: "all 0.15s ease" }}
            >
              <div style={{ marginBottom: "4px", color: "var(--navy)", fontSize: "0.95rem", fontWeight: 800 }}>{en ? "Individual artist" : "개인 예술가 (Artist)"}</div>
              <div style={{ color: "var(--ink-muted)", fontSize: "0.8rem", lineHeight: 1.5 }}>
                {en ? "Create your artist profile, preview it, and then connect with Google." : "무용수, 안무가, 기획자 등 개인 창작자의 포퐄을 만들어요."}
              </div>
            </button>
            <button
              type="button"
              onClick={() => router.push(localizePath("/organizations/apply", language))}
              style={{ padding: "16px", borderRadius: "12px", border: "1.5px solid var(--border)", background: "#FFFFFF", textAlign: "left", cursor: "pointer", transition: "all 0.15s ease" }}
            >
              <div style={{ marginBottom: "4px", color: "var(--navy)", fontSize: "0.95rem", fontWeight: 800 }}>{en ? "Organization" : "단체 (Organization)"}</div>
              <div style={{ color: "var(--ink-muted)", fontSize: "0.8rem", lineHeight: 1.5 }}>
                {en ? "Apply for a portfolio for your company, collective, or arts project." : "무용단, 기획사, 예술 프로젝트 등 단체 포트폴리오를 신청해요."}
              </div>
            </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

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
        {step === 1 && !shouldResume && (
          <button
            type="button"
            onClick={() => setProfileType(null)}
            style={{
              display: "block",
              margin: "0 0 20px",
              padding: 0,
              border: 0,
              background: "transparent",
              color: "var(--ink-muted)",
              fontSize: "0.8rem",
              fontWeight: 750,
              cursor: "pointer",
            }}
          >
            ← {en ? "Choose a different profile type" : "개인·단체 다시 선택"}
          </button>
        )}
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
              English name (optional)
            </label>
            <input lang="en" type="text" value={displayNameEn} onChange={(e) => setDisplayNameEn(e.target.value)} placeholder="e.g. Gildong Hong" style={{ width: "100%", padding: "14px 16px", border: "1.5px solid var(--border)", borderRadius: "12px", fontSize: "1rem", marginBottom: "20px" }} />

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
              {ARTIST_ROLES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "20px",
                    border: "1.5px solid",
                    borderColor: role === option.value ? "var(--navy)" : "var(--border-dark)",
                    background: role === option.value ? "var(--accent)" : "transparent",
                    color: "var(--navy)",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {getArtistRoleLabel(option.value, language)}
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
                onClick={handlePrev}
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
                이전
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
            onCancel={handleSkipAi}
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

        {/* STEP 4: card preview, then authenticate and publish */}
        {step === 4 && (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--navy)", marginBottom: "8px" }}>
              카드가 이렇게 만들어져요
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", marginBottom: "28px", lineHeight: 1.5 }}>
              내용을 확인한 뒤 Google로 연결하면 바로 저장·공개됩니다.
            </p>
            <div style={{ maxWidth: "310px", margin: "0 auto 18px" }}>
              <PopokCard
                name={displayName}
                nameEn={displayNameEn || undefined}
                genre={genre}
                instagram={null}
                id={username || "preview"}
                slug={username || "preview"}
              />
            </div>
            <p style={{ margin: 0, color: "var(--ink-muted)", fontSize: ".72rem" }}>카드를 눌러 뒷면도 확인해보세요. 공개 후 사진과 활동 이력을 추가할 수 있어요.</p>
          </div>
        )}

        {/* The AI import/review sub-screens (step 5) provide their own back/cancel navigation */}
        {!(step === 3 && aiState !== "choose") && (
          /* Navigation Buttons */
          <div style={{ display: "flex", gap: "12px", marginTop: "36px" }}>
            {step > 1 && (
              <button
                onClick={step === 3 ? handleSkipAi : handlePrev}
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
                {step === 3 ? "직접 입력하기" : "이전"}
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
                {submitting ? (isLoggedIn ? "저장·공개 중..." : "Google 연결 중...") : (isLoggedIn ? "저장하고 공개하기" : "Google로 로그인하고 공개하기")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
