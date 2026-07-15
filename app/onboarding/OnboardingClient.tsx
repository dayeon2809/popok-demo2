"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AiProfileImporter from "@/components/profile/AiProfileImporter";
import AiProfileReview from "@/components/profile/AiProfileReview";

export default function OnboardingClient({ defaultEmail, defaultDisplayName }: { defaultEmail: string; defaultDisplayName: string }) {
  const router = useRouter();

  // Wizard state
  // /onboarding is now individual-artist-only — organizations apply via
  // /organizations/apply instead (see app/auth/AuthClient.tsx).
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(defaultDisplayName || "");
  const [username, setUsername] = useState("");
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

  // Debounced username checking
  useEffect(() => {
    if (step !== 2) return;

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
    if (step === 2 && !usernameStatus.valid) {
      alert("올바르고 사용 가능한 주소를 입력해 주세요.");
      return;
    }
    if (step === 3 && !genre.trim()) {
      alert("주 활동 분야를 선택하거나 입력해 주세요.");
      return;
    }
    if (step === 4 && !role.trim()) {
      alert("주 역할을 선택하거나 입력해 주세요.");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    // Stepping back into the AI step should always land on the choose screen,
    // not the transitional "none" state left over from finishing/skipping it.
    if (step === 6 && aiState === "none") {
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
          links: aiProfileData?.links || []
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/my-popok");
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

  const GENRE_OPTIONS = ["현대무용", "발레", "한국무용", "음악", "미술"];
  const ROLE_OPTIONS = ["무용수", "안무가", "기획자", "단원", "예술감독"];

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "75vh",
      padding: "24px"
    }}>
      <div className="card fade-up" style={{
        maxWidth: step === 5 && aiState === "review" ? "720px" : "480px",
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
              width: `${((step - 1) / 5) * 100}%`,
              height: "2px",
              background: "var(--navy)",
              zIndex: 1,
              transform: "translateY(-50%)",
              transition: "width 0.3s ease"
            }} />
            {[1, 2, 3, 4, 5, 6].map((num) => (
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

        {/* STEP 1: display_name */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--navy)", marginBottom: "8px" }}>
              활동명을 입력해 주세요.
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", marginBottom: "24px" }}>
              프로필에 기본으로 표시될 활동명을 적어주세요.
            </p>
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
                fontSize: "1rem"
              }}
              autoFocus
            />
          </div>
        )}

        {/* STEP 2: username */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--navy)", marginBottom: "8px" }}>
              내 POPOK 주소를 만들어주세요.
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", marginBottom: "24px" }}>
              사람들이 당신의 카드를 찾을 고유 주소입니다. (popok.kr/주소)
            </p>
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="dayeon"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "12px",
                  fontSize: "1rem"
                }}
                autoFocus
              />
            </div>
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

        {/* STEP 3: genre */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--navy)", marginBottom: "8px" }}>
              주 활동 분야를 선택해주세요.
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", marginBottom: "24px" }}>
              가장 잘 나타내는 예술 장르를 정해주세요.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
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
                fontSize: "0.95rem"
              }}
            />
          </div>
        )}

        {/* STEP 4: role */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--navy)", marginBottom: "8px" }}>
              당신의 주 역할을 선택해주세요.
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", marginBottom: "24px" }}>
              주로 어떤 역할로 활동하시나요?
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
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

        {/* STEP 5: AI-assisted enrichment (optional, asked last) */}
        {step === 5 && aiState === "choose" && (
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
                  setStep(6);
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

        {step === 5 && aiState === "import" && (
          <AiProfileImporter
            onParsed={(data) => {
              setAiDraft(data);
              setAiState("review");
            }}
            onCancel={() => setAiState("choose")}
          />
        )}

        {step === 5 && aiState === "review" && aiDraft && (
          <AiProfileReview
            initialDraft={aiDraft}
            onConfirm={(finalDraft) => {
              setAiProfileData(finalDraft);
              setAiState("none");
              setStep(6);
            }}
            onCancel={() => {
              setAiState("import");
            }}
          />
        )}

        {/* STEP 6: complete */}
        {step === 6 && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: "3rem",
              marginBottom: "16px",
              animation: "float1 4s ease-in-out infinite"
            }}>
              🎉
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--navy)", marginBottom: "8px" }}>
              POPOK을 시작할 준비가 되었습니다!
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", marginBottom: "28px", lineHeight: 1.5 }}>
              활동명 <strong>{displayName}</strong> 님으로<br />
              나만의 디지털 명함 및 포트폴리오를 만들어 보세요.
            </p>
            <div style={{
              background: "var(--bg-warm)",
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
        {!(step === 5 && aiState !== "choose") && (
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
            {step === 5 ? null : step < 6 ? (
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
                {submitting ? "생성 중..." : "POPOK 시작하기"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
