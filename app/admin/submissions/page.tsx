"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";
import Link from "next/link";
import QRCode from "qrcode";
import { emptyParsedProfile, type ParsedArtistProfile, type ParserStatus } from "@/lib/parsedProfile";
import { ArrayField, StringArrayField } from "@/components/admin/ArrayField";

interface Submission {
  id: number;
  name: string;
  genre: string | null;
  instagram: string | null;
  email?: string | null;
  status?: string | null;
  motion_video_url?: string | null;
  profile_image_url?: string | null;
  profile_image_urls?: string[] | null;
  additional_requests?: string | null;
  bio_short?: string | null;
  created_at: string | null;
  parsed_profile?: ParsedArtistProfile | null;
  parser_status?: ParserStatus;
  parser_error?: string | null;
}

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active / Selected details for edit & QR
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Edit Form Fields
  const [editForm, setEditForm] = useState({
    name: "",
    genre: "",
    instagram: "",
    email: "",
    motion_video_url: "",
    profile_image_url: "",
    profile_image_urls_raw: "",
    additional_requests: "",
    bio_short: "",
  });

  // AI 정리(Parser) 상태
  const [parsedProfile, setParsedProfile] = useState<ParsedArtistProfile | null>(null);
  const [parserStatus, setParserStatus] = useState<ParserStatus>("not_parsed");
  const [parserError, setParserError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [savingParsed, setSavingParsed] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem("admin_passcode");
    if (!cached) {
      router.push("/admin");
    } else {
      setPasscode(cached);
      fetchSubmissions(cached);
    }
  }, [router]);

  useEffect(() => {
    if (selectedSub) {
      const fullUrl = `${window.location.origin}/p/${selectedSub.id}`;
      QRCode.toDataURL(fullUrl, { width: 150, margin: 1 })
        .then(url => setQrUrl(url))
        .catch(err => console.error("[QRCode] error", err));
    } else {
      setQrUrl("");
    }
  }, [selectedSub]);

  const fetchSubmissions = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/submissions", {
        headers: { "x-admin-passcode": code },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmissions(data.data);
      } else {
        setError(data.error || "등록 데이터를 불러오는 데 실패했습니다.");
        if (res.status === 401) {
          sessionStorage.removeItem("admin_passcode");
          router.push("/admin");
        }
      }
    } catch (err) {
      setError("네트워크 오류로 데이터를 가져올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (sub: Submission) => {
    setSelectedSub(sub);
    setEditForm({
      name: sub.name || "",
      genre: sub.genre || "",
      instagram: sub.instagram || "",
      email: sub.email || "",
      motion_video_url: sub.motion_video_url || "",
      profile_image_url: sub.profile_image_url || "",
      profile_image_urls_raw: Array.isArray(sub.profile_image_urls) ? sub.profile_image_urls.join("\n") : "",
      additional_requests: sub.additional_requests || "",
      bio_short: sub.bio_short || "",
    });
    setParsedProfile(sub.parsed_profile || null);
    setParserStatus(sub.parser_status || "not_parsed");
    setParserError(sub.parser_error || null);
  };

  const handleAIParse = async () => {
    if (!selectedSub) return;
    setParsing(true);
    setParserStatus("parsing");
    setParserError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${selectedSub.id}/parse`, {
        method: "POST",
        headers: { "x-admin-passcode": passcode },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setParsedProfile(data.parsed_profile);
        setParserStatus("parsed");
      } else {
        setParserStatus("error");
        setParserError(data.error || "AI 정리에 실패했습니다.");
        alert(data.error || "AI 정리에 실패했습니다.");
      }
    } catch {
      setParserStatus("error");
      setParserError("네트워크 오류로 AI 정리에 실패했습니다.");
      alert("네트워크 오류로 AI 정리에 실패했습니다.");
    } finally {
      setParsing(false);
    }
  };

  const handleSaveParsedProfile = async () => {
    if (!selectedSub || !parsedProfile) return;
    setSavingParsed(true);
    try {
      const res = await fetch(`/api/admin/submissions/${selectedSub.id}/parsed-profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-passcode": passcode },
        body: JSON.stringify({ parsed_profile: parsedProfile }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setParserStatus("reviewed");
        alert("정리 결과가 저장되었습니다. 이제 공개 승인을 진행할 수 있습니다.");
        fetchSubmissions(passcode);
      } else {
        alert(data.error || "정리 결과 저장에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류로 저장에 실패했습니다.");
    } finally {
      setSavingParsed(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    // Convert urls raw multiline to string array
    const profile_image_urls = editForm.profile_image_urls_raw
      .split("\n")
      .map(url => url.trim())
      .filter(Boolean);

    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/submissions/${selectedSub.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({
          action: "update",
          fields: {
            name: editForm.name,
            genre: editForm.genre,
            instagram: editForm.instagram,
            email: editForm.email,
            motion_video_url: editForm.motion_video_url,
            profile_image_url: editForm.profile_image_url || profile_image_urls[0] || null,
            profile_image_urls,
            additional_requests: editForm.additional_requests,
            bio_short: editForm.bio_short,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("정보 수정이 완료되었습니다.");
        setSelectedSub(null);
        fetchSubmissions(passcode);
      } else {
        alert(data.error || "수정 중 오류가 발생했습니다.");
      }
    } catch {
      alert("네트워크 통신 중 오류가 발생했습니다.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handlePublishShowroom = async (id: number) => {
    const confirmMsg = parsedProfile
      ? "검수한 내용을 artists 테이블에 저장하고 공개하시겠습니까?\n공개 후 사이트에 즉시 반영됩니다."
      : "이 포퐄 데이터를 공식 아티스트(/artists) 페이지에 공개하시겠습니까?";
    if (!confirm(confirmMsg)) {
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({ action: "publish" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("아티스트 페이지 공개 완료! 주소: " + `/artists/${data.slug}`);
        setSelectedSub(null);
        fetchSubmissions(passcode);
      } else {
        alert(data.error || "공개 중 오류가 발생했습니다.");
      }
    } catch {
      alert("네트워크 통신 오류가 발생했습니다.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("⚠️ 주의: 이 등록 데이터 및 디지털 카드를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "DELETE",
        headers: { "x-admin-passcode": passcode },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("삭제가 완료되었습니다.");
        if (selectedSub?.id === id) {
          setSelectedSub(null);
        }
        fetchSubmissions(passcode);
      } else {
        alert(data.error || "삭제 중 오류가 발생했습니다.");
      }
    } catch {
      alert("네트워크 삭제 요청 실패. 다시 시도해 주세요.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCopyLink = (id: number) => {
    const fullUrl = `${window.location.origin}/p/${id}`;
    navigator.clipboard.writeText(fullUrl);
    alert("공개 명함 링크가 복사되었습니다!");
  };

  if (loading) {
    return <div style={{ padding: "80px 0" }}><LoadingSpinner message="등록 명함 목록 로딩 중..." /></div>;
  }

  if (error) {
    return <div style={{ padding: "40px 0" }}><ErrorMessage message={error} /></div>;
  }

  return (
    <div style={{ padding: "20px 0", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1.5px solid var(--border)", paddingBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--navy)" }}>POPOK 등록자 관리</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }}>
            총 {submissions.length}명의 POPOK 디지털 명함이 등록되어 있습니다.
          </p>
        </div>
        <Link href="/admin" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy)", textDecoration: "none" }}>
          ← 대시보드로 돌아가기
        </Link>
      </div>

      {/* Submissions Grid List */}
      <div style={{ background: "#FFF", border: "1.5px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.86rem" }}>
          <thead>
            <tr style={{ background: "#FAF8F5", borderBottom: "1px solid var(--border)", color: "var(--navy)", fontWeight: 700 }}>
              <th style={{ padding: "16px 20px" }}>등록번호</th>
              <th style={{ padding: "16px 20px" }}>이름</th>
              <th style={{ padding: "16px 20px" }}>이메일</th>
              <th style={{ padding: "16px 20px" }}>장르/카테고리</th>
              <th style={{ padding: "16px 20px" }}>페이지 공개</th>
              <th style={{ padding: "16px 20px" }}>등록일시</th>
              <th style={{ padding: "16px 20px" }}>작업 관리</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => (
              <tr key={sub.id} style={{ borderBottom: "1px solid #EEE" }}>
                <td style={{ padding: "14px 20px", fontWeight: 700, color: "var(--accent-dark)" }}>{sub.id}</td>
                <td style={{ padding: "14px 20px", fontWeight: 800 }}>{sub.name}</td>
                <td style={{ padding: "14px 20px" }}>{sub.email || "-"}</td>
                <td style={{ padding: "14px 20px" }}>{sub.genre || "-"}</td>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{
                    padding: "3px 8px",
                    borderRadius: "999px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    background: sub.status === "approved" ? "#ECFDF5" : "#FFF7ED",
                    color: sub.status === "approved" ? "#047857" : "#C2410C",
                    border: sub.status === "approved" ? "1px solid #A7F3D0" : "1px solid #FFEDD5"
                  }}>
                    {sub.status === "approved" ? "게시완료" : "검토대기"}
                  </span>
                </td>
                <td style={{ padding: "14px 20px", color: "var(--ink-muted)" }}>
                  {sub.created_at ? new Date(sub.created_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }) : "-"}
                </td>
                <td style={{ padding: "14px 20px", display: "flex", gap: "6px" }}>
                  <button onClick={() => handleOpenEdit(sub)} style={actionBtnStyle}>
                    상세 / 수정 ⚙️
                  </button>
                  <a href={`/p/${sub.id}`} target="_blank" rel="noreferrer" style={linkBtnStyle}>
                    보기 👁️
                  </a>
                  <button onClick={() => handleCopyLink(sub.id)} style={actionBtnStyle}>
                    링크 복사 🔗
                  </button>
                  <button onClick={() => handleDelete(sub.id)} style={{ ...actionBtnStyle, background: "#FEF2F2", color: "#EF4444", borderColor: "#FEE2E2" }}>
                    삭제 🗑️
                  </button>
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-muted)" }}>
                  등록된 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Details & Edit Overlay Modal */}
      {selectedSub && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: "20px", border: "1.5px solid var(--navy)",
            width: "min(600px, 94vw)", maxHeight: "90vh", overflowY: "auto", padding: "30px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)", position: "relative"
          }}>
            <button 
              onClick={() => setSelectedSub(null)} 
              style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", fontWeight: 900 }}
            >
              ✕
            </button>

            <span style={{ fontSize: "0.72rem", color: "var(--accent-dark)", fontWeight: 800, textTransform: "uppercase" }}>
              Submission No. {selectedSub.id}
            </span>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--navy)", marginTop: "4px", marginBottom: "20px" }}>
              상세 정보 조회 및 수정
            </h2>

            <form onSubmit={handleUpdateSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={labelStyle}>이름</label>
                  <input required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>장르 / 역할</label>
                  <input required value={editForm.genre} onChange={e => setEditForm({ ...editForm, genre: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>인스타그램 URL</label>
                <input required value={editForm.instagram} onChange={e => setEditForm({ ...editForm, instagram: e.target.value })} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>이메일 주소</label>
                <input type="email" required value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>대표 프로필 이미지 URL</label>
                <input value={editForm.profile_image_url} onChange={e => setEditForm({ ...editForm, profile_image_url: e.target.value })} placeholder="미입력 시 첫 번째 URL 사용" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>업로드 이미지 리스트 (한 줄에 하나씩 입력)</label>
                <textarea 
                  rows={3} 
                  value={editForm.profile_image_urls_raw} 
                  onChange={e => setEditForm({ ...editForm, profile_image_urls_raw: e.target.value })} 
                  placeholder="https://.../img1.jpg&#10;https://.../img2.jpg" 
                  style={{ ...inputStyle, fontFamily: "monospace", fontSize: "0.75rem", resize: "vertical" }} 
                />
              </div>

              <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "12px", background: "#FAF8F5" }}>
                <label style={labelStyle}>Motion Profile Video Link</label>
                <input value={editForm.motion_video_url} onChange={e => setEditForm({ ...editForm, motion_video_url: e.target.value })} placeholder="https://youtube.com/watch?v=... 또는 https://vimeo.com/..." style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>간단한 이력 (Bio Short)</label>
                <textarea rows={3} value={editForm.bio_short} onChange={e => setEditForm({ ...editForm, bio_short: e.target.value })} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>추가 요청 사항</label>
                <textarea rows={2} value={editForm.additional_requests} onChange={e => setEditForm({ ...editForm, additional_requests: e.target.value })} style={inputStyle} />
              </div>

            {/* ── 원본 신청 내용 (읽기 전용) ── */}
            <div style={{ border: "1px solid var(--border)", borderRadius: "10px", padding: "14px", background: "#FAF8F5", marginTop: "18px" }}>
              <label style={labelStyle}>원본 신청 내용 (읽기 전용 — AI가 절대 덮어쓰지 않습니다)</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.8rem", marginTop: "10px" }}>
                <div><b>이름</b><div style={{ color: "var(--ink-muted)" }}>{selectedSub.name || "-"}</div></div>
                <div><b>장르</b><div style={{ color: "var(--ink-muted)" }}>{selectedSub.genre || "-"}</div></div>
                <div><b>Instagram</b><div style={{ color: "var(--ink-muted)" }}>{selectedSub.instagram || "-"}</div></div>
                <div><b>이메일</b><div style={{ color: "var(--ink-muted)" }}>{selectedSub.email || "-"}</div></div>
              </div>
              <div style={{ marginTop: "10px", fontSize: "0.8rem" }}>
                <b>bio_short 원문</b>
                <p style={{ whiteSpace: "pre-wrap", color: "var(--ink-muted)", margin: "4px 0 10px" }}>{selectedSub.bio_short || "(없음)"}</p>
                <b>additional_requests 원문</b>
                <p style={{ whiteSpace: "pre-wrap", color: "var(--ink-muted)", margin: "4px 0 0" }}>{selectedSub.additional_requests || "(없음)"}</p>
              </div>
              {(selectedSub.profile_image_url || (selectedSub.profile_image_urls && selectedSub.profile_image_urls.length > 0)) && (
                <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {(selectedSub.profile_image_urls && selectedSub.profile_image_urls.length > 0
                    ? selectedSub.profile_image_urls
                    : [selectedSub.profile_image_url]
                  ).filter(Boolean).map((url, i) => (
                    <img key={i} src={url as string} alt="" style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border)" }} />
                  ))}
                </div>
              )}
              {selectedSub.motion_video_url && (
                <p style={{ marginTop: "8px", fontSize: "0.75rem" }}>
                  <b>영상</b>: <a href={selectedSub.motion_video_url} target="_blank" rel="noreferrer">{selectedSub.motion_video_url}</a>
                </p>
              )}
            </div>

            {/* ── AI 정리 영역 ── */}
            <div style={{ border: "1.5px solid var(--navy)", borderRadius: "12px", padding: "16px", background: "#FFFFFF", marginTop: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <label style={labelStyle}>AI 정리</label>
                  <div style={{ marginTop: "4px" }}>
                    <ParserStatusBadge status={parserStatus} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAIParse}
                  disabled={parsing}
                  className="btn-outline"
                  style={{ padding: "10px 16px", borderRadius: "10px", fontWeight: 800, fontSize: "0.82rem", cursor: "pointer", background: "none", border: "1.5px solid var(--navy)" }}
                >
                  {parsing ? "AI가 정리하는 중..." : "🤖 AI로 이력 정리하기"}
                </button>
              </div>

              {parserStatus === "error" && parserError && (
                <p style={{ fontSize: "0.78rem", color: "#EF4444", marginBottom: "10px" }}>{parserError}</p>
              )}

              {!parsedProfile && parserStatus !== "error" && (
                <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>
                  아직 AI로 정리한 내용이 없습니다. 위 버튼을 눌러 bio_short / additional_requests 원문을 구조화된 프로필로 정리해보세요.
                </p>
              )}

              {parsedProfile && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={labelStyle}>이름</label>
                      <input style={inputStyle} value={parsedProfile.artist.name} onChange={e => setParsedProfile({ ...parsedProfile, artist: { ...parsedProfile.artist, name: e.target.value } })} />
                    </div>
                    <div>
                      <label style={labelStyle}>영문 이름</label>
                      <input style={inputStyle} value={parsedProfile.artist.name_en || ""} onChange={e => setParsedProfile({ ...parsedProfile, artist: { ...parsedProfile.artist, name_en: e.target.value || null } })} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>장르</label>
                    <input style={inputStyle} value={parsedProfile.artist.genre} onChange={e => setParsedProfile({ ...parsedProfile, artist: { ...parsedProfile.artist, genre: e.target.value } })} />
                  </div>

                  <div>
                    <label style={labelStyle}>짧은 소개 (bio_short)</label>
                    <textarea rows={2} style={inputStyle} value={parsedProfile.artist.bio_short} onChange={e => setParsedProfile({ ...parsedProfile, artist: { ...parsedProfile.artist, bio_short: e.target.value } })} />
                  </div>

                  <div>
                    <label style={labelStyle}>프로필 소개 (summary, 2~3문단)</label>
                    <textarea rows={5} style={inputStyle} value={parsedProfile.artist.summary} onChange={e => setParsedProfile({ ...parsedProfile, artist: { ...parsedProfile.artist, summary: e.target.value } })} />
                  </div>

                  <ArrayField
                    label="소속"
                    items={parsedProfile.affiliations}
                    onChange={(v) => setParsedProfile({ ...parsedProfile, affiliations: v })}
                    newItem={() => ({ name: "", position: null })}
                    renderItem={(item, set) => (
                      <>
                        <input style={inputStyle} placeholder="소속명" value={item.name} onChange={e => set({ ...item, name: e.target.value })} />
                        <input style={inputStyle} placeholder="직책/역할 (선택)" value={item.position || ""} onChange={e => set({ ...item, position: e.target.value || null })} />
                      </>
                    )}
                  />

                  <StringArrayField
                    label="현재 활동"
                    items={parsedProfile.current_activity}
                    onChange={(v) => setParsedProfile({ ...parsedProfile, current_activity: v })}
                    placeholder="예: OO컴퍼니 출강 중"
                  />

                  <ArrayField
                    label="작품 및 공연"
                    items={parsedProfile.works}
                    onChange={(v) => setParsedProfile({ ...parsedProfile, works: v })}
                    newItem={() => ({ title: "", organization: null, festival: null, role: null, year: null, type: "performance", description: null })}
                    renderItem={(item, set) => (
                      <>
                        <input style={inputStyle} placeholder="작품명" value={item.title} onChange={e => set({ ...item, title: e.target.value })} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                          <input type="number" style={inputStyle} placeholder="연도 (예: 2025)" value={item.year ?? ""} onChange={e => set({ ...item, year: e.target.value === "" ? null : parseInt(e.target.value, 10) })} />
                          <select style={inputStyle} value={item.type} onChange={e => set({ ...item, type: e.target.value })}>
                            <option value="performance">공연</option>
                            <option value="broadcast">방송</option>
                            <option value="music_video">뮤직비디오</option>
                          </select>
                        </div>
                        <input style={inputStyle} placeholder="기관/단체 (선택)" value={item.organization || ""} onChange={e => set({ ...item, organization: e.target.value || null })} />
                        <input style={inputStyle} placeholder="축제/공연장 (선택)" value={item.festival || ""} onChange={e => set({ ...item, festival: e.target.value || null })} />
                        <input style={inputStyle} placeholder="역할 (선택)" value={item.role || ""} onChange={e => set({ ...item, role: e.target.value || null })} />
                        <textarea rows={2} style={inputStyle} placeholder="설명 (선택)" value={item.description || ""} onChange={e => set({ ...item, description: e.target.value || null })} />
                      </>
                    )}
                  />

                  <ArrayField
                    label="수상"
                    items={parsedProfile.awards}
                    onChange={(v) => setParsedProfile({ ...parsedProfile, awards: v })}
                    newItem={() => ({ year: null, title: "", organization: null, result: "" })}
                    renderItem={(item, set) => (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "6px" }}>
                          <input type="number" style={inputStyle} placeholder="연도 (예: 2025)" value={item.year ?? ""} onChange={e => set({ ...item, year: e.target.value === "" ? null : parseInt(e.target.value, 10) })} />
                          <input style={inputStyle} placeholder="수상명" value={item.title} onChange={e => set({ ...item, title: e.target.value })} />
                        </div>
                        <input style={inputStyle} placeholder="주최 기관 (선택)" value={item.organization || ""} onChange={e => set({ ...item, organization: e.target.value || null })} />
                        <input style={inputStyle} placeholder="결과 (예: 대상, 1위)" value={item.result} onChange={e => set({ ...item, result: e.target.value })} />
                      </>
                    )}
                  />

                  <ArrayField
                    label="콩쿠르 및 진출"
                    items={parsedProfile.competitions}
                    onChange={(v) => setParsedProfile({ ...parsedProfile, competitions: v })}
                    newItem={() => ({ year: null, title: "", organization: null, result: "" })}
                    renderItem={(item, set) => (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "6px" }}>
                          <input type="number" style={inputStyle} placeholder="연도 (예: 2025)" value={item.year ?? ""} onChange={e => set({ ...item, year: e.target.value === "" ? null : parseInt(e.target.value, 10) })} />
                          <input style={inputStyle} placeholder="콩쿠르명" value={item.title} onChange={e => set({ ...item, title: e.target.value })} />
                        </div>
                        <input style={inputStyle} placeholder="주최 기관 (선택)" value={item.organization || ""} onChange={e => set({ ...item, organization: e.target.value || null })} />
                        <input style={inputStyle} placeholder="결과 (예: 본선 진출)" value={item.result} onChange={e => set({ ...item, result: e.target.value })} />
                      </>
                    )}
                  />

                  <StringArrayField
                    label="교육"
                    items={parsedProfile.education}
                    onChange={(v) => setParsedProfile({ ...parsedProfile, education: v })}
                    placeholder="예: OO대학교 무용과 졸업"
                  />

                  <ArrayField
                    label="링크"
                    items={parsedProfile.links}
                    onChange={(v) => setParsedProfile({ ...parsedProfile, links: v })}
                    newItem={() => ({ label: null, url: "" })}
                    renderItem={(item, set) => (
                      <>
                        <input style={inputStyle} placeholder="라벨 (선택)" value={item.label || ""} onChange={e => set({ ...item, label: e.target.value || null })} />
                        <input style={inputStyle} placeholder="URL" value={item.url} onChange={e => set({ ...item, url: e.target.value })} />
                      </>
                    )}
                  />

                  <StringArrayField
                    label="경고 및 확인 필요 사항"
                    items={parsedProfile.warnings}
                    onChange={(v) => setParsedProfile({ ...parsedProfile, warnings: v })}
                    placeholder="AI가 확신하지 못한 내용"
                  />

                  <button
                    type="button"
                    onClick={handleSaveParsedProfile}
                    disabled={savingParsed}
                    style={{ padding: "12px", borderRadius: "10px", fontWeight: 900, fontSize: "0.85rem", cursor: "pointer", background: "#FFFFFF", border: "1.5px solid var(--navy)", color: "var(--navy)" }}
                  >
                    {savingParsed ? "저장 중..." : "정리 결과 저장"}
                  </button>
                </div>
              )}
            </div>

              {/* QR Code and Sharing Actions inside detail */}
              <div style={{ display: "flex", gap: "16px", alignItems: "center", borderTop: "1.5px solid var(--border)", paddingTop: "18px", marginTop: "6px" }}>
                {qrUrl ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <img src={qrUrl} alt="QR Code" style={{ width: "90px", height: "90px", border: "1px solid var(--border)", borderRadius: "6px", padding: "4px", background: "#FFF" }} />
                    <span style={{ fontSize: "0.58rem", color: "var(--ink-muted)", fontWeight: 700 }}>디지털 명함 QR</span>
                  </div>
                ) : (
                  <div style={{ width: "90px", height: "90px", background: "#FAF8F5", borderRadius: "6px" }} />
                )}
                
                <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      type="submit" 
                      disabled={submittingAction} 
                      className="btn-lime" 
                      style={{ border: "none", flex: 1, padding: "12px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 900, cursor: "pointer" }}
                    >
                      {submittingAction ? "저장 중..." : "정보 수정 완료"}
                    </button>

                    {selectedSub.status === "approved" ? (
                      <Link 
                        href={`/artists/${selectedSub.name.replace(/[^\w가-힣\s-]/g, '').trim().replace(/[\s\t]+/g, '-').toLowerCase()}-${selectedSub.id}`}
                        target="_blank"
                        className="btn-outline" 
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flex: 1, padding: "12px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 900, cursor: "pointer", background: "none", border: "1px solid var(--border)", color: "var(--navy)" }}
                      >
                        아티스트 페이지 보기 👁️
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePublishShowroom(selectedSub.id)}
                        disabled={submittingAction || (!!parsedProfile && parserStatus !== "reviewed")}
                        className="btn-lime"
                        style={{ border: "none", flex: 1, padding: "12px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 900, cursor: (submittingAction || (!!parsedProfile && parserStatus !== "reviewed")) ? "not-allowed" : "pointer", background: "var(--navy)", color: "#FFF", opacity: (!!parsedProfile && parserStatus !== "reviewed") ? 0.5 : 1 }}
                      >
                        공개 승인 🚀
                      </button>
                    )}
                  </div>
                  {parsedProfile && parserStatus !== "reviewed" && selectedSub.status !== "approved" && (
                    <p style={{ fontSize: "0.72rem", color: "#C2410C", margin: 0 }}>
                      AI 정리 결과를 검수하고 &quot;정리 결과 저장&quot;을 눌러야 공개 승인이 가능합니다.
                    </p>
                  )}
                  <button 
                    type="button" 
                    onClick={() => {
                      const fullUrl = `${window.location.origin}/p/${selectedSub.id}`;
                      window.open(fullUrl, "_blank");
                    }} 
                    className="btn-outline" 
                    style={{ width: "100%", padding: "10px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 800, cursor: "pointer", background: "none", border: "1px solid var(--border)" }}
                  >
                    새 창에서 포퐄 열기 👁️
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: "6px",
  border: "1px solid var(--border)",
  background: "#FFF",
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "var(--navy)",
  cursor: "pointer",
  fontFamily: "inherit",
};

const linkBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: "6px",
  border: "1.5px solid var(--navy)",
  background: "var(--navy)",
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#FFF",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center"
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.7rem",
  fontWeight: 700,
  color: "var(--navy)",
  marginBottom: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.02em"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1.5px solid var(--border)",
  fontSize: "0.84rem",
  outline: "none",
  background: "#FFFFFF",
  color: "var(--navy)",
  fontFamily: "inherit"
};

const iconBtnStyle: React.CSSProperties = {
  width: "26px",
  height: "26px",
  borderRadius: "6px",
  border: "1px solid var(--border)",
  background: "#FFFFFF",
  fontSize: "0.7rem",
  fontWeight: 700,
  color: "var(--navy)",
  cursor: "pointer",
  fontFamily: "inherit",
};

// ── AI 정리 결과 상태 배지 ──────────────────────────────────
function ParserStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string; border: string }> = {
    not_parsed: { label: "정리 전", bg: "#F3F4F6", fg: "#6B7280", border: "#E5E7EB" },
    parsing: { label: "정리 중...", bg: "#EFF6FF", fg: "#2563EB", border: "#BFDBFE" },
    parsed: { label: "정리 완료 (검수 필요)", bg: "#FFF7ED", fg: "#C2410C", border: "#FFEDD5" },
    reviewed: { label: "검수 완료", bg: "#ECFDF5", fg: "#047857", border: "#A7F3D0" },
    error: { label: "정리 실패", bg: "#FEF2F2", fg: "#EF4444", border: "#FEE2E2" },
  };
  const s = map[status] || map.not_parsed;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: "999px",
      fontSize: "0.72rem", fontWeight: 700, background: s.bg, color: s.fg, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

// ArrayField / StringArrayField moved to components/admin/ArrayField.tsx
// (shared with app/admin/companies/[id]/page.tsx).
