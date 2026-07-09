"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PopokCard from "@/components/PopokCard";

type SubmissionRecord = {
  id: number;
  name: string;
  email?: string | null;
  genre?: string | null;
  instagram?: string | null;
  status?: string | null;
  name_en?: string | null;
  city_or_region?: string | null;
  bio_short?: string | null;
  portfolio_works?: Array<{
    kind?: string;
    profile_image_url?: string | null;
    motion_video_url?: string | null;
  }> | null;
};

const TABS = [
  {
    key: "photo",
    label: "프로필 사진",
    title: "프로필 사진 요청",
    body: "프로필 사진을 더 추가하고 싶다면 여기에 업로드 요청을 남길 수 있어요.",
    placeholder: "예: 검정 배경의 정면 프로필 사진 2장을 추가하고 싶어요.",
  },
  {
    key: "motion",
    label: "모션/영상",
    title: "모션/영상 요청",
    body: "대표 영상, YouTube 링크, 15초 모션 프리뷰를 추가할 수 있는 영역입니다.",
    placeholder: "예: https://www.youtube.com/watch?v=... 를 대표 영상으로 넣고 싶어요.",
  },
  {
    key: "works",
    label: "작품 소개",
    title: "작품 소개 요청",
    body: "작품명, 연도, 소개글, 참여 역할 등을 추가할 수 있는 영역입니다.",
    placeholder: "예: 작품명 / 2025 / 안무 및 출연 / 3줄 소개",
  },
  {
    key: "links",
    label: "링크/자료",
    title: "링크/자료 요청",
    body: "인스타그램, 홈페이지, 포트폴리오, 기사 링크 등을 정리할 수 있는 영역입니다.",
    placeholder: "예: 홈페이지, 포트폴리오 PDF, 인터뷰 기사 링크를 정리해주세요.",
  },
] as const;

function getStatusLabel(status?: string | null) {
  const normalized = (status || "pending").toLowerCase();
  if (normalized === "approved" || normalized === "published") return "공개중";
  if (normalized === "draft") return "임시저장";
  if (normalized === "rejected") return "검토 필요";
  return "검토중";
}

function getRegistrationMedia(record: SubmissionRecord | null) {
  if (!record || !Array.isArray(record.portfolio_works)) return null;
  return record.portfolio_works.find((item) => item?.kind === "popok_registration_media") || null;
}

export default function MyPopokPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [record, setRecord] = useState<SubmissionRecord | null>(null);
  const [artistSlug, setArtistSlug] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("photo");
  const [requestText, setRequestText] = useState("");
  const [copied, setCopied] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const handleSubmitRequest = async () => {
    if (!requestText.trim()) {
      alert("요청 내용을 입력해 주세요.");
      return;
    }
    if (!record) return;

    setSubmittingRequest(true);
    try {
      const typeMap: Record<string, string> = {
        photo: "profile_image",
        motion: "motion_video",
        works: "work_description",
        links: "links_materials",
      };
      
      const res = await fetch("/api/my-popok/upload-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: record.id,
          requestType: typeMap[activeTab] || "other",
          message: requestText.trim(),
          contactEmail: record.email || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "요청 저장 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.");
      } else {
        alert("요청이 기록되었어요. POPOK 팀이 확인 후 반영할게요.");
        setRequestText("");
      }
    } catch {
      alert("요청 저장 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const media = getRegistrationMedia(record);
  const publicPath = record ? `/p/${record.id}` : "";
  const publicUrl = useMemo(() => {
    if (!record || typeof window === "undefined") return publicPath;
    return `${window.location.origin}${publicPath}`;
  }, [publicPath, record]);

  const activeTabData = TABS.find((tab) => tab.key === activeTab) || TABS[0];

  const handleLookup = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setRecord(null);
    setArtistSlug(null);
    setCopied(false);

    try {
      const res = await fetch("/api/my-popok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "포퐄 정보를 확인하지 못했습니다.");
        return;
      }
      if (!data.data) {
        setError("일치하는 포퐄을 찾지 못했어요. 이름, 이메일 또는 등록번호를 다시 확인해주세요.");
        return;
      }
      setRecord(data.data);
      setArtistSlug(data.artistSlug || null);
    } catch {
      setError("네트워크 오류로 포퐄 정보를 확인하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ background: "var(--bg-warm)", minHeight: "100vh", padding: "32px 18px 80px" }}>
      <style>{`
        @keyframes popCardIn {
          0% { opacity: 0; transform: translateY(18px) scale(0.96) rotate(-1deg); }
          70% { opacity: 1; transform: translateY(-3px) scale(1.015) rotate(0.4deg); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0); }
        }
        @media (max-width: 760px) {
          .my-popok-shell { padding: 0 !important; }
          .my-popok-hero { grid-template-columns: 1fr !important; gap: 22px !important; }
          .my-popok-actions { flex-direction: column !important; }
          .my-popok-actions a, .my-popok-actions button { width: 100% !important; justify-content: center !important; }
          .my-popok-tabs { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .my-popok-card-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="my-popok-shell" style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 14px" }}>
        <section className="my-popok-hero" style={{
          display: "grid",
          gridTemplateColumns: "0.9fr 1.1fr",
          gap: "34px",
          alignItems: "start",
        }}>
          <div style={{
            background: "#FFFFFF",
            border: "1px solid var(--border)",
            borderRadius: "18px",
            padding: "24px",
            boxShadow: "0 10px 28px rgba(23,20,17,0.04)",
          }}>
            <span className="mono" style={{ fontSize: "0.68rem", color: "var(--accent-dark)", fontWeight: 850, letterSpacing: "0.12em" }}>
              MY POPOK
            </span>
            <h1 className="display" style={{
              fontSize: "clamp(2rem, 7vw, 3.2rem)",
              lineHeight: 1.05,
              color: "var(--navy)",
              fontWeight: 950,
              letterSpacing: "-0.04em",
              margin: "10px 0 12px",
            }}>
              내 포퐄 확인하기
            </h1>
            <p style={{ color: "var(--ink-muted)", fontSize: "0.95rem", lineHeight: 1.65, marginBottom: "24px" }}>
              등록한 이름 또는 등록번호/등록코드로 내 포퐄을 확인할 수 있어요.
            </p>

            <form onSubmit={handleLookup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <label style={labelStyle}>
                이름
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="등록한 이름" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                이메일 주소
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" style={inputStyle} />
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "4px 0" }}>
                <span style={{ flexGrow: 1, height: "1px", background: "var(--border)" }} />
                <span style={{ fontSize: "0.68rem", color: "var(--ink-muted)", fontWeight: 700 }}>또는 등록번호 단독 입력</span>
                <span style={{ flexGrow: 1, height: "1px", background: "var(--border)" }} />
              </div>
              <label style={labelStyle}>
                등록번호 / 등록코드
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="예: 24" style={inputStyle} />
              </label>
              <button
                type="submit"
                className="btn-lime"
                disabled={loading}
                style={{
                  border: "none",
                  borderRadius: "12px",
                  padding: "15px 18px",
                  fontFamily: "inherit",
                  fontSize: "0.95rem",
                  fontWeight: 900,
                  cursor: "pointer",
                  opacity: loading ? 0.65 : 1,
                  marginTop: "8px"
                }}
              >
                {loading ? "확인 중..." : "확인하기"}
              </button>
            </form>

            {error && (
              <div style={{
                marginTop: "18px",
                padding: "14px",
                borderRadius: "12px",
                background: "#FFF7ED",
                border: "1px solid #FED7AA",
                color: "#9A3412",
                fontSize: "0.84rem",
                fontWeight: 700,
                lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}
          </div>

          <div style={{
            minHeight: "420px",
            borderRadius: "22px",
            border: "1px solid var(--border)",
            background: record ? "linear-gradient(135deg, #FFFFFF 0%, #FAF8F5 100%)" : "rgba(255,255,255,0.52)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "28px",
            position: "relative",
            overflow: "hidden",
          }}>
            {!record ? (
              <div style={{ textAlign: "center", maxWidth: "360px" }}>
                <div style={{
                  width: "88px",
                  height: "88px",
                  borderRadius: "50%",
                  background: "var(--accent)",
                  border: "1.5px solid var(--navy)",
                  margin: "0 auto 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 950,
                  color: "var(--navy)",
                  fontSize: "1.4rem",
                }}>
                  PO
                </div>
                <h2 style={{ fontSize: "1.15rem", color: "var(--navy)", fontWeight: 900, marginBottom: "8px" }}>
                  내 디지털 명함이 여기에 나타나요.
                </h2>
                <p style={{ color: "var(--ink-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                  등록 정보를 입력하면 카드와 공개 링크, 추가 요청 탭을 확인할 수 있습니다.
                </p>
              </div>
            ) : (
              <div style={{ width: "100%", animation: "popCardIn 0.52s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                
                {!artistSlug ? (
                  /* 1. Pending Status Layout */
                  <div style={{ maxWidth: "480px", margin: "0 auto", padding: "20px", background: "#FFFFFF", border: "1.5px solid var(--border)", borderRadius: "18px", textAlign: "center" }}>
                    <div style={{
                      width: "64px", height: "64px", borderRadius: "50%",
                      background: "#FFF7ED", border: "1px solid #FDBA74",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 16px", color: "#EA580C", fontSize: "1.6rem", fontWeight: 900
                    }}>
                      !
                    </div>
                    <span style={{
                      display: "inline-flex",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      background: "#FFF7ED",
                      color: "#C2410C",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      marginBottom: "12px",
                      border: "1px solid #FFEDD5"
                    }}>
                      검토대기
                    </span>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--navy)", marginBottom: "8px" }}>
                      아직 공개 전이에요.
                    </h3>
                    <p style={{ color: "var(--ink-muted)", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "20px" }}>
                      포퐄 팀이 제출해주신 내용을 정리한 뒤<br />
                      입력하신 이메일로 안내드릴게요.
                    </p>

                    <div style={{
                      background: "#FAF8F5", borderRadius: "12px", border: "1px solid var(--border)",
                      padding: "12px 18px", display: "grid", gap: "6px", fontSize: "0.82rem",
                      textAlign: "left", color: "var(--ink-muted)", marginBottom: "20px"
                    }}>
                      <div><strong style={{ color: "var(--navy)", marginRight: "10px" }}>등록번호:</strong> {record.id}</div>
                      <div><strong style={{ color: "var(--navy)", marginRight: "10px" }}>등록이름:</strong> {record.name}</div>
                      <div><strong style={{ color: "var(--navy)", marginRight: "10px" }}>분야/역할:</strong> {record.genre || "CREATIVE"}</div>
                    </div>

                    <Link href="/artists" className="btn-lime" style={{ ...actionButtonStyle, textDecoration: "none", width: "100%", justifyContent: "center", display: "inline-flex" }}>
                      아티스트 둘러보기
                    </Link>
                  </div>
                ) : (
                  /* 2. Published PopokCard Layout */
                  <div className="my-popok-card-grid" style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(240px, 330px) 1fr",
                    gap: "28px",
                    alignItems: "center",
                  }}>
                    <PopokCard
                      name={record.name}
                      nameEn={record.name_en || undefined}
                      genre={record.genre || "CREATIVE"}
                      instagram={record.instagram || ""}
                      id={String(record.id)}
                      profileImage={media?.profile_image_url || undefined}
                      cardUrl={publicUrl}
                    />
                    <div>
                      <span style={{
                        display: "inline-flex",
                        padding: "5px 10px",
                        borderRadius: "999px",
                        background: "var(--accent)",
                        color: "var(--navy)",
                        fontSize: "0.72rem",
                        fontWeight: 900,
                        marginBottom: "14px",
                      }}>
                        공개중
                      </span>
                      <h2 style={{ color: "var(--navy)", fontSize: "1.8rem", fontWeight: 950, letterSpacing: "-0.03em", marginBottom: "8px" }}>
                        {record.name}
                      </h2>
                      <div style={{ display: "grid", gap: "8px", color: "var(--ink-muted)", fontSize: "0.86rem", lineHeight: 1.45 }}>
                        <p><strong style={strongStyle}>영문 이름</strong>{record.name_en || "아직 등록되지 않음"}</p>
                        <p><strong style={strongStyle}>장르/카테고리</strong>{record.genre || "CREATIVE"}</p>
                        <p><strong style={strongStyle}>지역</strong>{record.city_or_region || "아직 등록되지 않음"}</p>
                        <p><strong style={strongStyle}>한 줄 소개</strong>{record.bio_short || "공개 아티스트 상세 페이지에 반영됩니다."}</p>
                      </div>
                      <div className="my-popok-actions" style={{ display: "flex", gap: "10px", marginTop: "22px", flexWrap: "wrap", flexDirection: "column" }}>
                        <div style={{ width: "100%" }}>
                          <Link href={`/artists/${artistSlug}`} className="btn-lime" style={{ ...actionButtonStyle, display: "inline-flex", textDecoration: "none", width: "100%", justifyContent: "center" }}>
                            아티스트 페이지 보기 👁️
                          </Link>
                          <p style={{ fontSize: "0.76rem", color: "var(--verified)", marginTop: "6px", fontWeight: 700 }}>
                            ✓ 아티스트 페이지에 공식 공개되었습니다!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {record && artistSlug && (
          <section style={{
            marginTop: "28px",
            background: "#FFFFFF",
            border: "1px solid var(--border)",
            borderRadius: "18px",
            padding: "20px",
            boxShadow: "0 8px 22px rgba(23,20,17,0.035)",
          }}>
            <div className="my-popok-tabs" style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "8px",
              marginBottom: "18px",
            }}>
              {TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.key);
                      setRequestText("");
                    }}
                    style={{
                      border: active ? "1.5px solid var(--navy)" : "1px solid var(--border)",
                      background: active ? "var(--navy)" : "#FAF8F5",
                      color: active ? "#FFFFFF" : "var(--navy)",
                      borderRadius: "12px",
                      padding: "11px 10px",
                      fontFamily: "inherit",
                      fontSize: "0.82rem",
                      fontWeight: 850,
                      cursor: "pointer",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "18px" }}>
              <h3 style={{ color: "var(--navy)", fontSize: "1.1rem", fontWeight: 900, marginBottom: "6px" }}>
                {activeTabData.title}
              </h3>
              <p style={{ color: "var(--ink-muted)", fontSize: "0.86rem", lineHeight: 1.6, marginBottom: "14px" }}>
                {activeTabData.body}
              </p>
              <textarea
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                placeholder={activeTabData.placeholder}
                rows={5}
                style={{
                  width: "100%",
                  resize: "vertical",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "14px",
                  fontFamily: "inherit",
                  color: "var(--navy)",
                  lineHeight: 1.5,
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={handleSubmitRequest}
                disabled={submittingRequest}
                className="btn-lime"
                style={{
                  marginTop: "12px",
                  border: "none",
                  borderRadius: "12px",
                  padding: "13px 18px",
                  fontFamily: "inherit",
                  fontSize: "0.88rem",
                  fontWeight: 900,
                  cursor: "pointer",
                  opacity: submittingRequest ? 0.6 : 1,
                }}
              >
                {submittingRequest ? "제출 중..." : "업로드 요청 남기기"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "7px",
  color: "var(--navy)",
  fontSize: "0.76rem",
  fontWeight: 850,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "13px 14px",
  fontFamily: "inherit",
  fontSize: "0.92rem",
  color: "var(--navy)",
  outline: "none",
  background: "#FFFFFF",
};

const strongStyle: React.CSSProperties = {
  display: "block",
  color: "var(--navy)",
  fontSize: "0.72rem",
  fontWeight: 900,
  marginBottom: "2px",
};

const actionButtonStyle: React.CSSProperties = {
  textDecoration: "none",
  borderRadius: "12px",
  padding: "12px 16px",
  fontSize: "0.86rem",
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid var(--border)",
};
