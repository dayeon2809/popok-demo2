"use client";
import { useState, useRef } from "react";

const FIELD_OPTS = [
  { value: "contemporary_dance", label: "현대무용" },
  { value: "ballet",             label: "발레"     },
  { value: "korean_dance",       label: "한국무용" },
  { value: "interdisciplinary",  label: "다원예술" },
  { value: "unknown",            label: "기타"     },
];
const TYPE_OPTS = [
  { value: "individual",    label: "개인 안무가" },
  { value: "company",       label: "무용단·단체" },
  { value: "project_group", label: "프로젝트팀"  },
];

interface PortfolioWork {
  title: string;
  year: string;
  description: string;
  role: string;
  image_url: string;
  video_url: string;
}

const EMPTY_FORM = {
  name: "",
  name_en: "",
  type: "individual",
  field: "contemporary_dance",
  genre_detail: "",
  company: "",
  city_or_region: "",
  bio_short: "",
  bio: "",
  works: "",
  instagram: "",
  website: "",
  email: "",
  portfolio_url: "",
};

type FormState = typeof EMPTY_FORM;
type Status = "idle" | "submitting" | "success" | "error";

const iStyle: React.CSSProperties = { width: "100%", padding: "12px 16px", border: "1.5px solid var(--border)", borderRadius: "10px", outline: "none", fontSize: "0.92rem", transition: "all 0.15s" };

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: "block", marginBottom: "6px",
        fontSize: "0.75rem", fontWeight: 700, color: "var(--ink-muted)",
        letterSpacing: "0.05em", textTransform: "uppercase",
      }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function SubmitPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [works, setWorks] = useState<PortfolioWork[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [errMsg, setErrMsg] = useState("");
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyGenre, setSurveyGenre] = useState("");
  const [surveyField, setSurveyField] = useState("");
  const [surveyContact, setSurveyContact] = useState("");
  const [surveyFeedback, setSurveyFeedback] = useState("");
  const [surveySuccess, setSurveySuccess] = useState(false);
  const [surveySubmitting, setSurveySubmitting] = useState(false);
  const [uploadingMap, setUploadingMap] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  
  // Newly submitted artist details for Next Step screen
  const [submittedName, setSubmittedName] = useState("");
  const [submittedId, setSubmittedId] = useState("");

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const addWork = () => {
    setWorks((w) => [...w, { title: "", year: "", description: "", role: "", image_url: "", video_url: "" }]);
  };

  const removeWork = (index: number) => {
    setWorks((w) => w.filter((_, i) => i !== index));
  };

  const updateWork = (index: number, key: keyof PortfolioWork, value: string) => {
    setWorks((w) => w.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;
    setUploadingMap((prev) => ({ ...prev, [index]: true }));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", `works/${Date.now()}`);
    formData.append("bucket", "portfolio-images");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        updateWork(index, "image_url", data.url);
      } else {
        alert(`업로드 실패: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("네트워크 오류로 파일 업로드에 실패했습니다.");
    } finally {
      setUploadingMap((prev) => ({ ...prev, [index]: false }));
    }
  };

  const submitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyGenre.trim()) return;
    setSurveySubmitting(true);
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genre: surveyGenre,
          field: surveyField,
          contact: surveyContact,
          feedback: surveyFeedback,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSurveySuccess(true);
        setTimeout(() => {
          setShowSurvey(false);
          setSurveySuccess(false);
          setSurveyGenre("");
          setSurveyField("");
          setSurveyContact("");
          setSurveyFeedback("");
        }, 2500);
      } else {
        alert(`수요조사 제출에 실패했습니다: ${data.error}`);
      }
    } catch (err) {
      alert("네트워크 오류로 제출하지 못했습니다.");
    } finally {
      setSurveySubmitting(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrMsg("");

    // Simple works list string mapping for backward compatibility
    const worksListStr = works.length > 0 
      ? works.map(w => `${w.title} (${w.year || "연도미상"})`).join(", ")
      : form.works;

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:          form.name,
          name_en:       form.name_en,
          type:          form.type,
          field:         form.field,
          company:       form.company,
          city_or_region:form.city_or_region,
          bio_short:     form.bio_short,
          bio:           form.bio,
          works:         worksListStr,
          instagram:     form.instagram,
          website:       form.website,
          email:         form.email,
          portfolio_url: form.portfolio_url,
          portfolio_works: works,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrMsg(json.error ?? "알 수 없는 오류가 발생했습니다.");
        setStatus("error");
        return;
      }

      setSubmittedName(form.name);
      setSubmittedId(json.id || "");
      setStatus("success");
      setForm(EMPTY_FORM);
      setWorks([]);
    } catch (err) {
      setErrMsg(`네트워크 오류: ${String(err)}`);
      setStatus("error");
    }
  }

  // Pre-generate sharing links
  const slugifiedName = submittedName
    ? encodeURIComponent(submittedName.replace(/[^\w가-힣\s-]/g, '').trim().replace(/[\s\t]+/g, '-').toLowerCase())
    : "";
  const mockProfileLink = typeof window !== "undefined"
    ? `${window.location.origin}/artists/${slugifiedName || submittedId}`
    : `/artists/${slugifiedName || submittedId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mockProfileLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── 성공 화면 (Next Step 화면) ──
  if (status === "success") {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(mockProfileLink)}`;

    return (
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "20px" }}>🎂</div>
        <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--navy)", marginBottom: "12px" }}>
          케이크 한 조각이 완성됐어요
        </h1>
        <p style={{ color: "var(--ink-muted)", fontSize: "1.05rem", lineHeight: 1.8, marginBottom: "48px" }}>
          이제 나의 작업을 알리고, 다른 예술인과 연결되어 보세요.
        </p>

        {/* CTA 3 Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", textAlign: "left", marginBottom: "48px" }}>
          
          {/* Card 1: 다가올 공연 홍보 */}
          <div style={{
            background: "#fff", border: "1.5px solid var(--border)", borderRadius: "16px", padding: "28px",
            boxShadow: "0 4px 20px rgba(30,45,64,0.02)", display: "flex", flexDirection: "column", justifyContent: "space-between"
          }}>
            <div>
              <span style={{ fontSize: "1.5rem", display: "inline-block", marginBottom: "12px" }}>🎭</span>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", marginBottom: "8px" }}>
                다가올 공연 홍보하기
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", lineHeight: 1.6, marginBottom: "20px" }}>
                홍보하고 싶은 다가올 공연이 있으신가요? 당신의 공연을 다른 예술인과 관객에게 알려보세요.
              </p>
            </div>
            <a href="/performances/register" style={{
              display: "inline-block", textAlign: "center", textDecoration: "none",
              background: "var(--navy)", color: "#fff", padding: "12px 20px", borderRadius: "10px",
              fontSize: "0.88rem", fontWeight: 700, transition: "opacity 0.2s"
            }} onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"} onMouseOut={(e) => e.currentTarget.style.opacity = "1"}>
              공연 등록하기 →
            </a>
          </div>

          {/* Card 2: 다른 아티스트 탐색 */}
          <div style={{
            background: "#fff", border: "1.5px solid var(--border)", borderRadius: "16px", padding: "28px",
            boxShadow: "0 4px 20px rgba(30,45,64,0.02)", display: "flex", flexDirection: "column", justifyContent: "space-between"
          }}>
            <div>
              <span style={{ fontSize: "1.5rem", display: "inline-block", marginBottom: "12px" }}>🔍</span>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", marginBottom: "8px" }}>
                다른 아티스트 탐색하기
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", lineHeight: 1.6, marginBottom: "20px" }}>
                같은 장르, 다른 장르의 다양한 예술인을 발견하고 교류해보세요.
              </p>
            </div>
            <a href="/artists" style={{
              display: "inline-block", textAlign: "center", textDecoration: "none",
              background: "transparent", color: "var(--navy)", border: "1.5px solid var(--navy)", padding: "11px 20px", borderRadius: "10px",
              fontSize: "0.88rem", fontWeight: 700, transition: "all 0.2s"
            }} onMouseOver={(e) => { e.currentTarget.style.background = "var(--border)"; }} onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}>
              예술인 DB 탐색하기
            </a>
          </div>

          {/* Card 3: 내 프로필 공유 */}
          <div style={{
            background: "var(--accent-light)", border: "1.5px solid var(--accent)", borderRadius: "16px", padding: "28px",
            boxShadow: "0 4px 20px rgba(30,45,64,0.02)", display: "flex", flexDirection: "column", gap: "20px"
          }}>
            <div>
              <span style={{ fontSize: "1.5rem", display: "inline-block", marginBottom: "8px" }}>🔗</span>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px" }}>
                내 프로필 공유하기
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--accent-dark)", fontWeight: 700, marginBottom: "8px" }}>
                “아직도 인스타그램 링크만 보내시나요?”
              </p>
              <p style={{ fontSize: "0.88rem", color: "var(--navy)", lineHeight: 1.6 }}>
                나의 작품과 이력을 모은 한 페이지를 공유해보세요. (승인 대기 중이며, 승인 후 활성화됩니다.)
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", background: "#fff", padding: "18px", borderRadius: "12px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <input readOnly type="text" value={mockProfileLink} style={{ ...iStyle, flex: 1, padding: "8px 12px", background: "#f8fafc", fontSize: "0.8rem" }} />
                <button onClick={copyToClipboard} style={{
                  padding: "8px 16px", background: "var(--navy)", color: "#fff", border: "none", borderRadius: "8px",
                  fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap"
                }}>
                  {copied ? "복사됨!" : "링크 복사"}
                </button>
              </div>

              {/* QR Code Container */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", borderTop: "1.5px solid var(--border)", paddingTop: "14px" }}>
                <img src={qrCodeUrl} alt="QR Code" style={{ width: "90px", height: "90px", borderRadius: "8px", border: "1px solid var(--border)" }} />
                <div>
                  <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)" }}>QR 코드로 공유</p>
                  <p style={{ fontSize: "0.72rem", color: "var(--ink-muted)", marginTop: "4px", lineHeight: 1.4 }}>
                    카메라로 스캔하면 바로 내 포트폴리오 프로필로 연결됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <button
          onClick={() => setStatus("idle")}
          style={{
            padding: "14px 28px", background: "transparent", color: "var(--navy)",
            border: "1.5px solid var(--border-dark)", borderRadius: "10px",
            fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          추가 등록 신청하기
        </button>
      </div>
    );
  }

  const isSubmitting = status === "submitting";

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "52px 24px 80px" }}>
      
      {/* 브랜드 메시지 헤더 */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <p className="mono" style={{ color: "var(--accent-dark)", fontWeight: 800, fontSize: "0.8rem", letterSpacing: "0.15em", marginBottom: "12px" }}>
          당신의 케이크 한 조각을 올려주세요 🍰
        </p>
        <h1 className="display" style={{ fontSize: "clamp(2rem,6vw,2.6rem)", color: "var(--navy)", marginBottom: "16px" }}>
          아티스트 프로필 등록
        </h1>
        <p style={{ color: "var(--ink-muted)", fontSize: "0.98rem", lineHeight: 1.8, maxWidth: "560px", margin: "0 auto" }}>
          제공해주신 정보는 안전하게 저장되어 공연예술계의 케이크를 만듭니다.<br />
          <span style={{ fontWeight: 700, color: "var(--navy)" }}>Piece of Cake는 지금 무용 예술인부터 시작합니다.</span>
        </p>
        
        <div style={{ marginTop: "16px" }}>
          <button
            type="button"
            onClick={() => setShowSurvey(true)}
            style={{
              background: "var(--accent-light)", color: "var(--accent-dark)",
              border: "1px dashed var(--accent)", borderRadius: "20px",
              padding: "6px 16px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
              transition: "all 0.15s"
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "var(--navy)"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "var(--accent-light)"; e.currentTarget.style.color = "var(--accent-dark)"; }}
          >
            🩰 타 장르도 원해요!
          </button>
        </div>
      </div>

      {/* 에러 배너 */}
      {status === "error" && (
        <div style={{
          marginBottom: "24px", padding: "14px 18px", borderRadius: "10px",
          background: "#FEF2F2", border: "1.5px solid #FCA5A5",
          display: "flex", gap: "10px", alignItems: "flex-start",
        }}>
          <span style={{ fontSize: "1rem", flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#991B1B", marginBottom: "2px" }}>
              신청 중 오류가 발생했습니다.
            </p>
            <p style={{ fontSize: "0.8rem", color: "#B91C1C" }}>{errMsg}</p>
          </div>
        </div>
      )}

      {/* 메인 신청 폼 */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        
        <div style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "16px", padding: "28px", display: "flex", flexDirection: "column", gap: "22px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px", borderBottom: "1.5px solid var(--border)", paddingBottom: "12px" }}>
            👤 기본 정보
          </h2>
          
          <div className="form-row-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="이름 / 활동명" required>
              <input required type="text" value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="홍길동" style={iStyle} disabled={isSubmitting} />
            </Field>

            <Field label="영문 이름">
              <input type="text" value={form.name_en}
                onChange={(e) => set("name_en", e.target.value)}
                placeholder="Gildong Hong" style={iStyle} disabled={isSubmitting} />
            </Field>
          </div>

          <div className="form-row-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="유형" required>
              <select value={form.type} onChange={(e) => set("type", e.target.value)}
                style={{ ...iStyle, cursor: "pointer" }} disabled={isSubmitting}>
                {TYPE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="활동 분야" required>
              <select value={form.field} onChange={(e) => set("field", e.target.value)}
                style={{ ...iStyle, cursor: "pointer" }} disabled={isSubmitting}>
                {FIELD_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="form-row-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="세부 장르">
              <input type="text" value={form.genre_detail}
                onChange={(e) => set("genre_detail", e.target.value)}
                placeholder="컨템포러리, 클래식 발레 등" style={iStyle} disabled={isSubmitting} />
            </Field>

            <Field label="소속 / 단체">
              <input type="text" value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="00무용단, 프리랜서 등" style={iStyle} disabled={isSubmitting} />
            </Field>
          </div>

          <Field label="활동 지역">
            <input type="text" value={form.city_or_region}
              onChange={(e) => set("city_or_region", e.target.value)}
              placeholder="서울, 부산 등 주요 활동 도시" style={iStyle} disabled={isSubmitting} />
          </Field>

          <Field label="한 줄 소개">
            <input type="text" value={form.bio_short}
              onChange={(e) => set("bio_short", e.target.value)}
              placeholder="나를 소개하는 한 줄 요약 문장 (100자 내외)" style={iStyle} disabled={isSubmitting} />
          </Field>

          <Field label="상세 소개">
            <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)}
              placeholder="작업 철학, 신체 움직임에 대한 가치관 등을 자유롭게 적어주세요."
              rows={4} disabled={isSubmitting}
              style={{ ...iStyle, resize: "vertical", fontFamily: "inherit" }} />
          </Field>
        </div>

        {/* 대표작 섹션 */}
        <div style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "16px", padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1.5px solid var(--border)", paddingBottom: "12px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)" }}>
              ⭐ 대표작 포트폴리오
            </h2>
            <button
              type="button"
              onClick={addWork}
              style={{
                padding: "6px 14px", background: "var(--navy)", color: "#fff",
                border: "none", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit"
              }}
            >
              + 대표작 추가하기
            </button>
          </div>

          {works.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-muted)", border: "1px dashed var(--border)", borderRadius: "10px" }}>
              <p style={{ fontSize: "0.88rem", marginBottom: "8px" }}>등록된 대표작이 없습니다.</p>
              <p style={{ fontSize: "0.78rem", color: "var(--ink-faint)" }}>우측 상단의 '+ 대표작 추가하기' 버튼을 눌러 대표작을 입력해보세요.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {works.map((work, idx) => (
                <div key={idx} style={{
                  background: "#FAFAFA", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px",
                  position: "relative"
                }}>
                  <button
                    type="button"
                    onClick={() => removeWork(idx)}
                    style={{
                      position: "absolute", top: "16px", right: "16px",
                      background: "transparent", border: "none", color: "#EF4444",
                      fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", textDecoration: "underline"
                    }}
                  >
                    삭제
                  </button>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div className="form-row-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <Field label={`대표작 ${idx + 1} - 작품명`} required>
                        <input required type="text" value={work.title}
                          onChange={(e) => updateWork(idx, "title", e.target.value)}
                          placeholder="작품명" style={iStyle} disabled={isSubmitting} />
                      </Field>
                      <Field label="제작 연도">
                        <input type="text" value={work.year}
                          onChange={(e) => updateWork(idx, "year", e.target.value)}
                          placeholder="예: 2024" style={iStyle} disabled={isSubmitting} />
                      </Field>
                    </div>

                    <div className="form-row-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <Field label="본인의 역할">
                        <input type="text" value={work.role}
                          onChange={(e) => updateWork(idx, "role", e.target.value)}
                          placeholder="예: 안무, 무용수, 연출" style={iStyle} disabled={isSubmitting} />
                      </Field>
                      <Field label="영상 링크 (YouTube / Vimeo 등)">
                        <input type="url" value={work.video_url}
                          onChange={(e) => updateWork(idx, "video_url", e.target.value)}
                          placeholder="https://youtu.be/... 또는 https://vimeo.com/..." style={iStyle} disabled={isSubmitting} />
                      </Field>
                    </div>

                    <Field label="대표 이미지 업로드">
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(idx, e.target.files[0]);
                            }
                          }}
                          style={{ fontSize: "0.8rem" }}
                          disabled={isSubmitting || uploadingMap[idx]}
                        />
                        {uploadingMap[idx] && <span style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>업로드 중...</span>}
                        {work.image_url && (
                          <div style={{
                            width: "48px", height: "48px", borderRadius: "6px",
                            background: `url(${work.image_url}) center/cover no-repeat`,
                            border: "1px solid var(--border)", flexShrink: 0
                          }} />
                        )}
                      </div>
                    </Field>

                    <Field label="작품 소개">
                      <textarea value={work.description}
                        onChange={(e) => updateWork(idx, "description", e.target.value)}
                        placeholder="작품의 의도와 주요 스토리를 입력해주세요."
                        rows={2} disabled={isSubmitting}
                        style={{ ...iStyle, resize: "vertical", fontFamily: "inherit" }} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 연락처 및 소셜 링크 */}
        <div style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "16px", padding: "28px", display: "flex", flexDirection: "column", gap: "22px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)", marginBottom: "4px", borderBottom: "1.5px solid var(--border)", paddingBottom: "12px" }}>
            🔗 연락처 및 링크
          </h2>

          <Field label="Instagram URL">
            <input type="url" value={form.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              placeholder="https://instagram.com/username"
              style={iStyle} disabled={isSubmitting} />
          </Field>

          <Field label="웹사이트 / Linktree">
            <input type="url" value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://linktr.ee/username"
              style={iStyle} disabled={isSubmitting} />
          </Field>

          <Field label="포트폴리오 링크 (PDF 등)">
            <input type="url" value={form.portfolio_url}
              onChange={(e) => set("portfolio_url", e.target.value)}
              placeholder="https://..."
              style={iStyle} disabled={isSubmitting} />
          </Field>

          <Field label="이메일 (연락용, 비공개)" required>
            <input required type="email" value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="hello@example.com"
              style={iStyle} disabled={isSubmitting} />
          </Field>
        </div>

        {/* 제출 버튼 */}
        <div style={{ paddingTop: "10px" }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%", padding: "16px",
              background: isSubmitting ? "var(--border-dark)" : "var(--navy)",
              color: "#fff", border: "none", borderRadius: "10px",
              fontSize: "1rem", fontWeight: 700,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "background 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
          >
            {isSubmitting ? (
              <>
                <span style={{
                  width: "18px", height: "18px", border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "#fff", borderRadius: "50%",
                  animation: "spin 0.7s linear infinite", display: "inline-block",
                }} />
                신청 등록 중...
              </>
            ) : "아티스트 등록 신청하기"}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ textAlign: "center", marginTop: "12px", fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 500 }}>
            * 필수 항목 · 이메일은 승인 알림 안내 용도로만 사용됩니다.
          </p>
        </div>

      </form>

      {/* 수요 조사 모달 */}
      {showSurvey && (
        <div className="modal-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowSurvey(false)}>
          <div className="modal-box" style={{ padding: "32px", position: "relative", maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowSurvey(false)}
              style={{
                position: "absolute", top: "20px", right: "20px",
                background: "transparent", border: "none", fontSize: "1.2rem",
                cursor: "pointer", color: "var(--ink-muted)"
              }}
            >
              ✕
            </button>

            {surveySuccess ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <span style={{ fontSize: "3rem" }}>💌</span>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", marginTop: "16px", marginBottom: "8px" }}>
                  의견이 소중히 접수되었습니다!
                </h3>
                <p style={{ fontSize: "0.88rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
                  보내주신 의견을 적극 검토하여 더 다양한 장르의 예술인 서비스를 구축하도록 하겠습니다.
                </p>
              </div>
            ) : (
              <form onSubmit={submitSurvey} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
                    타 장르 지원 요청 폼
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", lineHeight: 1.5 }}>
                    어떤 장르의 예술인이신가요? 의견을 모아 다음 지원 장르를 선정합니다.
                  </p>
                </div>

                <Field label="원하는 장르 (예: 뮤지컬, 연극, 비보잉)" required>
                  <input required type="text" value={surveyGenre}
                    onChange={(e) => setSurveyGenre(e.target.value)}
                    placeholder="원하는 공연예술 장르명" style={iStyle} disabled={surveySubmitting} />
                </Field>

                <Field label="활동 분야 (예: 배우, 안무가, 기획자)">
                  <input type="text" value={surveyField}
                    onChange={(e) => setSurveyField(e.target.value)}
                    placeholder="본인의 파트 또는 역할" style={iStyle} disabled={surveySubmitting} />
                </Field>

                <Field label="이메일 또는 Instagram 연락처 (선택)">
                  <input type="text" value={surveyContact}
                    onChange={(e) => setSurveyContact(e.target.value)}
                    placeholder="이메일 주소 또는 SNS 계정" style={iStyle} disabled={surveySubmitting} />
                </Field>

                <Field label="자유 의견 (선택)">
                  <textarea value={surveyFeedback}
                    onChange={(e) => setSurveyFeedback(e.target.value)}
                    placeholder="서비스에 바라는 점이나 기타 의견을 공유해주세요."
                    rows={3} disabled={surveySubmitting}
                    style={{ ...iStyle, resize: "vertical", fontFamily: "inherit" }} />
                </Field>

                <button
                  type="submit"
                  disabled={surveySubmitting}
                  style={{
                    width: "100%", padding: "12px",
                    background: "var(--navy)", color: "#fff",
                    border: "none", borderRadius: "10px",
                    fontSize: "0.92rem", fontWeight: 800,
                    cursor: "pointer", transition: "opacity 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
                  onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
                >
                  {surveySubmitting ? "제출 중..." : "제출하기"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
