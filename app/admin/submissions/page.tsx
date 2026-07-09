"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";

interface Submission {
  id: string;
  name: string;
  email: string;
  instagram: string;
  website: string;
  bio: string;
  works: string;
  portfolio_url: string;
  status: string;
  submitted_at: string;
  portfolio_works?: any;
}

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [editingSub, setEditingSub] = useState<Submission | null>(null);
  const [approvingSub, setApprovingSub] = useState<Submission | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [showApprovedNotice, setShowApprovedNotice] = useState(false);

  // Approve Form State
  const [approveForm, setApproveForm] = useState({
    name: "",
    company: "",
    works: "",
    field: "dance",
    genre: "contemporary",
    instagram: "",
    website: "",
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    instagram: "",
    website: "",
    bio: "",
    works: "",
    portfolio_url: "",
  });

  useEffect(() => {
    const cached = sessionStorage.getItem("admin_passcode");
    if (!cached) {
      router.push("/admin");
    } else {
      setPasscode(cached);
      fetchSubmissions(cached);
    }
  }, [router]);

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
        setError(data.error || "신청 데이터를 불러오는 데 실패했습니다.");
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

  const handleReject = async (id: string) => {
    if (!confirm("이 신청 항목을 반려 처리하시겠습니까?")) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({ action: "reject" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("반려 처리가 완료되었습니다.");
        fetchSubmissions(passcode);
      } else {
        alert(data.error || "반려 처리 중 오류가 발생했습니다.");
      }
    } catch (e) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenApprove = (sub: Submission) => {
    setApprovingSub(sub);
    setApproveForm({
      name: sub.name,
      company: "",
      works: sub.works,
      field: "dance",
      genre: "contemporary",
      instagram: sub.instagram,
      website: sub.website,
    });
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingSub) return;

    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/submissions/${approvingSub.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({
          action: "approve",
          artistData: {
            name: approveForm.name,
            company: approveForm.company,
            works: approveForm.works,
            field: approveForm.field,
            genre: approveForm.genre,
            instagram: approveForm.instagram,
            website: approveForm.website,
            email: approvingSub.email,
            name_en: (approvingSub as any).name_en || null,
            city_or_region: (approvingSub as any).city_or_region || null,
            bio_short: (approvingSub as any).bio_short || null,
            portfolio_works: (approvingSub as any).portfolio_works || null,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowApprovedNotice(true);
        setApprovingSub(null);
        fetchSubmissions(passcode);
      } else {
        alert(data.error || "승인 중 에러가 발생했습니다.");
      }
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenEdit = (sub: Submission) => {
    setEditingSub(sub);
    setEditForm({
      name: sub.name,
      email: sub.email,
      instagram: sub.instagram,
      website: sub.website,
      bio: sub.bio,
      works: sub.works,
      portfolio_url: sub.portfolio_url,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;

    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/submissions/${editingSub.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({
          action: "update",
          fields: editForm,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("수정이 완료되었습니다.");
        setEditingSub(null);
        fetchSubmissions(passcode);
      } else {
        alert(data.error || "수정 중 에러가 발생했습니다.");
      }
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmittingAction(false);
    }
  };


  const getStatusBadge = (status: string) => {
    const s = (status || "pending").toLowerCase();
    const style: React.CSSProperties = {
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "0.75rem",
      fontWeight: 700,
      display: "inline-block",
    };
    if (s === "approved") {
      return <span style={{ ...style, background: "#E0F0E8", color: "var(--verified)" }}>Approved</span>;
    }
    if (s === "rejected") {
      return <span style={{ ...style, background: "#FEF2F2", color: "#B91C1C" }}>Rejected</span>;
    }
    return <span style={{ ...style, background: "#FEF3DC", color: "var(--needs-review)" }}>Pending</span>;
  };

  if (loading) return <div style={{ padding: "80px 0" }}><LoadingSpinner message="신청 목록을 불러오는 중..." /></div>;
  if (error) return <div style={{ padding: "80px 20px" }}><ErrorMessage message={error} /></div>;

  return (
    <div>
      <div style={{ marginBottom: "30px", borderBottom: "1.5px solid var(--border)", paddingBottom: "16px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--navy)" }}>신청자 접수 현황 (Submissions)</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }}>Airtable Submissions 테이블에 들어온 신규 안무가 등록 정보입니다.</p>
      </div>

      {submissions.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center", border: "1.5px dashed var(--border)", borderRadius: "12px" }}>
          <p style={{ color: "var(--ink-faint)", fontSize: "0.9rem" }}>신청 접수된 데이터가 존재하지 않습니다.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto", background: "#fff", border: "1px solid var(--border)", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>이름</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>이메일</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>대표작</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>SNS / 링크</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>신청일</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>상태</th>
                <th style={{ padding: "14px 18px", fontWeight: 700, textAlign: "center" }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "16px 18px", fontWeight: 700 }}>{sub.name}</td>
                  <td style={{ padding: "16px 18px", color: "var(--ink-muted)" }}>{sub.email}</td>
                  <td style={{ padding: "16px 18px", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {sub.works || "—"}
                  </td>
                  <td style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {sub.instagram && (
                        <a href={sub.instagram} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", textDecoration: "none", color: "var(--accent-dark)", fontWeight: 700 }}>
                          Instagram↗
                        </a>
                      )}
                      {sub.website && (
                        <a href={sub.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", textDecoration: "none", color: "var(--navy)", fontWeight: 700 }}>
                          Web↗
                        </a>
                      )}
                      {!sub.instagram && !sub.website && "—"}
                    </div>
                  </td>
                  <td style={{ padding: "16px 18px", fontSize: "0.8rem", color: "var(--ink-faint)" }}>
                    {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "16px 18px" }}>{getStatusBadge(sub.status)}</td>
                  <td style={{ padding: "16px 18px", textAlign: "center" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      {sub.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleOpenApprove(sub)}
                            disabled={submittingAction}
                            style={{
                              padding: "6px 10px", background: "var(--navy)", color: "#fff",
                              border: "none", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700,
                              cursor: "pointer", fontFamily: "inherit"
                            }}
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleReject(sub.id)}
                            disabled={submittingAction}
                            style={{
                              padding: "6px 10px", background: "#FEF2F2", color: "#B91C1C",
                              border: "1px solid #FCA5A5", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700,
                              cursor: "pointer", fontFamily: "inherit"
                            }}
                          >
                            반려
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleOpenEdit(sub)}
                        disabled={submittingAction}
                        style={{
                          padding: "6px 10px", background: "transparent", color: "var(--ink-muted)",
                          border: "1px solid var(--border)", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit"
                        }}
                      >
                        수정
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 승인 폼 모달 ── */}
      {approvingSub && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 100, padding: "20px"
        }}>
          <form onSubmit={handleApproveSubmit} style={{
            background: "#fff", maxWidth: "550px", width: "100%",
            borderRadius: "16px", padding: "28px", display: "flex",
            flexDirection: "column", gap: "16px", border: "1.5px solid var(--border)"
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--navy)" }}>안무가 승인 및 업로드 설정</h2>
            <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", marginTop: "-8px" }}>승인 시 Airtable artists2 테이블에 아티스트 레코드가 자동으로 생성됩니다.</p>
            
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px" }}>이름</label>
                <input type="text" value={approveForm.name} onChange={(e) => setApproveForm({ ...approveForm, name: e.target.value })} style={inputStyle} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px" }}>소속/단체</label>
                <input type="text" value={approveForm.company} onChange={(e) => setApproveForm({ ...approveForm, company: e.target.value })} placeholder="예: 무용컴퍼니" style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px" }}>대표작 (쉼표로 구분)</label>
              <input type="text" value={approveForm.works} onChange={(e) => setApproveForm({ ...approveForm, works: e.target.value })} placeholder="작품명1, 작품명2" style={inputStyle} />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px" }}>분야</label>
                <select value={approveForm.field} onChange={(e) => setApproveForm({ ...approveForm, field: e.target.value })} style={selectStyle}>
                  <option value="dance">무용 (Dance)</option>
                  <option value="interdisciplinary">다원예술 (Interdisciplinary)</option>
                  <option value="theatre">연극 (Theatre)</option>
                  <option value="music">음악 (Music)</option>
                  <option value="unknown">기타 (Unknown)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px" }}>장르</label>
                <select value={approveForm.genre} onChange={(e) => setApproveForm({ ...approveForm, genre: e.target.value })} style={selectStyle}>
                  <option value="contemporary">현대무용</option>
                  <option value="ballet">발레</option>
                  <option value="korean">한국무용</option>
                  <option value="street">스트릿</option>
                  <option value="unknown">기타</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px" }}>Instagram URL</label>
                <input type="url" value={approveForm.instagram} onChange={(e) => setApproveForm({ ...approveForm, instagram: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px" }}>웹사이트 URL</label>
                <input type="url" value={approveForm.website} onChange={(e) => setApproveForm({ ...approveForm, website: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px" }}>
              <button type="button" onClick={() => setApprovingSub(null)} style={cancelBtnStyle}>취소</button>
              <button type="submit" disabled={submittingAction} style={submitBtnStyle}>승인 완료하기</button>
            </div>
          </form>
        </div>
      )}

      {/* ── 수정 폼 모달 ── */}
      {editingSub && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 100, padding: "20px"
        }}>
          <form onSubmit={handleEditSubmit} style={{
            background: "#fff", maxWidth: "550px", width: "100%",
            borderRadius: "16px", padding: "28px", display: "flex",
            flexDirection: "column", gap: "14px", border: "1.5px solid var(--border)"
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--navy)" }}>접수 데이터 수정</h2>
            
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px" }}>이름</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px" }}>이메일</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} required />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px" }}>소개글 (Bio)</label>
              <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px" }}>대표 작품 (쉼표로 구분)</label>
              <input type="text" value={editForm.works} onChange={(e) => setEditForm({ ...editForm, works: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px" }}>Instagram URL</label>
                <input type="url" value={editForm.instagram} onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px" }}>웹사이트 URL</label>
                <input type="url" value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px" }}>포트폴리오 URL (PDF 등)</label>
              <input type="url" value={editForm.portfolio_url} onChange={(e) => setEditForm({ ...editForm, portfolio_url: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px" }}>
              <button type="button" onClick={() => setEditingSub(null)} style={cancelBtnStyle}>취소</button>
              <button type="submit" disabled={submittingAction} style={submitBtnStyle}>저장하기</button>
            </div>
          </form>
        </div>
      )}

      {/* ── 승인 완료 후 동기화 안내 모달 ── */}
      {showApprovedNotice && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 110, padding: "20px"
        }}>
          <div style={{
            background: "#fff", maxWidth: "450px", width: "100%",
            borderRadius: "16px", padding: "30px", border: "1.5px solid var(--border)",
            textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🎉</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", marginBottom: "8px" }}>승인이 완료되었습니다!</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginBottom: "24px", lineHeight: "1.5" }}>
              Airtable에 안무가가 성공적으로 등록되었습니다.<br />
              공개 웹사이트에 실제로 반영하려면 동기화(Sync) 작업이 필요합니다.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={() => setShowApprovedNotice(false)}
                style={{
                  padding: "10px 16px", background: "transparent", border: "1.5px solid var(--border)",
                  borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
                  color: "var(--ink-muted)", fontFamily: "inherit"
                }}
              >
                나중에 하기
              </button>
              <button
                onClick={() => {
                  setShowApprovedNotice(false);
                  router.push("/admin/sync");
                }}
                style={{
                  padding: "10px 20px", background: "var(--navy)", color: "#fff", border: "none",
                  borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                Sync 페이지로 이동
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)",
  borderRadius: "8px", fontSize: "0.88rem", fontFamily: "inherit"
};
const selectStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", border: "1.5px solid var(--border)",
  borderRadius: "8px", fontSize: "0.88rem", background: "#fff", fontFamily: "inherit"
};
const cancelBtnStyle: React.CSSProperties = {
  padding: "10px 16px", background: "transparent", border: "1.5px solid var(--border)",
  borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
  color: "var(--ink-muted)", fontFamily: "inherit"
};
const submitBtnStyle: React.CSSProperties = {
  padding: "10px 18px", background: "var(--navy)", color: "#fff", border: "none",
  borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
  fontFamily: "inherit"
};
