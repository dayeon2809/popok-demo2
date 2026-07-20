"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";

interface ClaimRequest {
  id: string;
  company_id: string;
  user_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string | null;
  role_title?: string | null;
  proof_text?: string | null;
  status: "pending" | "approved" | "rejected" | string;
  created_at: string;
  companies?: {
    id: string;
    name: string;
    name_en?: string | null;
    owner_id?: string | null;
    status: string;
  } | null;
}

export default function AdminCompanyClaimRequestsPage() {
  const [requests, setRequests] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Overwrite confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    requestId: string;
    companyName: string;
    message: string;
  } | null>(null);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/company-claim-requests", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.requests || []);
      } else {
        setError(data.error || "신청 목록을 불러오는 데 실패했습니다.");
      }
    } catch (err: any) {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (requestId: string, confirmOverwrite = false) => {
    setProcessingId(requestId);
    try {
      const res = await fetch(`/api/admin/company-claim-requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmOverwrite }),
      });

      const data = await res.json();

      if (res.status === 409 && data.needsConfirmation) {
        // Show overwrite warning dialog
        setConfirmModal({
          requestId,
          companyName: data.companyName || "단체",
          message: data.message || "이미 대표 계정이 연결된 단체입니다. 기존 대표를 새로운 대표로 변경하시겠습니까?",
        });
        setProcessingId(null);
        return;
      }

      if (!data.success) {
        alert(data.error || "승인 처리에 실패했습니다.");
        setProcessingId(null);
        return;
      }

      alert("대표 권한이 승인되었습니다.");
      setConfirmModal(null);
      fetchRequests();
    } catch (err: any) {
      alert("오류가 발생했습니다: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm("이 신청을 거절하시겠습니까?")) return;
    setProcessingId(requestId);
    try {
      const res = await fetch(`/api/admin/company-claim-requests/${requestId}/reject`, {
        method: "POST",
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error || "거절 처리에 실패했습니다.");
        setProcessingId(null);
        return;
      }

      fetchRequests();
    } catch (err: any) {
      alert("오류가 발생했습니다.");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingList = requests.filter((r) => r.status === "pending");
  const processedList = requests.filter((r) => r.status !== "pending");

  return (
    <div>
      <div style={{ marginBottom: "28px", borderBottom: "1.5px solid var(--border)", paddingBottom: "16px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--navy)" }}>
          단체 대표 권한 신청 관리
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }}>
          개인 계정의 단체 대표 관리 권한 신청을 검토하고 승인 / 거절 처리합니다.
        </p>
      </div>

      {loading && <LoadingSpinner message="신청 목록을 불러오는 중..." />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
          
          {/* Section 1: Pending Claims */}
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 850, color: "var(--navy)", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              🟡 승인 대기 건 <span style={{ fontSize: "0.8rem", background: "#FFF7ED", color: "#C2410C", padding: "2px 8px", borderRadius: "12px" }}>{pendingList.length}건</span>
            </h2>

            {pendingList.length === 0 ? (
              <div style={{ padding: "30px", background: "#FFFFFF", border: "1px dashed var(--border)", borderRadius: "8px", color: "var(--ink-muted)", fontSize: "0.85rem" }}>
                현재 대기 중인 대표 권한 신청이 없습니다.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {pendingList.map((reqItem) => {
                  const hasCurrentOwner = !!reqItem.companies?.owner_id;
                  const isProcessing = processingId === reqItem.id;

                  return (
                    <div
                      key={reqItem.id}
                      style={{
                        background: "#FFFFFF",
                        border: "1.5px solid var(--border)",
                        borderLeft: hasCurrentOwner ? "4px solid #EA580C" : "4px solid var(--navy)",
                        borderRadius: "8px",
                        padding: "20px",
                        boxShadow: "0 4px 12px rgba(23, 20, 17, 0.03)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--navy)", margin: 0 }}>
                              {reqItem.companies?.name || "단체명 없음"}
                            </h3>
                            {hasCurrentOwner && (
                              <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#C2410C", background: "#FFF7ED", padding: "3px 8px", borderRadius: "4px", border: "1px solid #FFEDD5" }}>
                                ⚠️ 기존 대표 계정 연결됨
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: "0.72rem", color: "var(--ink-muted)", marginTop: "4px", display: "block" }}>
                            신청일: {new Date(reqItem.created_at).toLocaleString("ko-KR")}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => handleReject(reqItem.id)}
                            disabled={isProcessing}
                            style={{
                              padding: "8px 16px",
                              fontSize: "0.82rem",
                              fontWeight: 800,
                              color: "#991B1B",
                              background: "#FEF2F2",
                              border: "1px solid #FCA5A5",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                          >
                            거절
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(reqItem.id, false)}
                            disabled={isProcessing}
                            style={{
                              padding: "8px 20px",
                              fontSize: "0.82rem",
                              fontWeight: 800,
                              color: "#FFFFFF",
                              background: "var(--navy)",
                              border: "none",
                              borderRadius: "6px",
                              cursor: isProcessing ? "not-allowed" : "pointer",
                              opacity: isProcessing ? 0.6 : 1,
                            }}
                          >
                            {isProcessing ? "처리 중..." : "승인 (대표 연결)"}
                          </button>
                        </div>
                      </div>

                      {/* Details Box */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#FAF9F5", padding: "14px", borderRadius: "6px", fontSize: "0.82rem", color: "var(--navy)" }}>
                        <div>
                          <div><strong>신청자:</strong> {reqItem.applicant_name} ({reqItem.role_title || "대표"})</div>
                          <div><strong>이메일:</strong> {reqItem.applicant_email}</div>
                          {reqItem.applicant_phone && <div><strong>전화번호:</strong> {reqItem.applicant_phone}</div>}
                        </div>
                        <div>
                          <div><strong>신청 User ID:</strong> <code style={{ fontSize: "0.72rem" }}>{reqItem.user_id}</code></div>
                          {reqItem.proof_text && (
                            <div style={{ marginTop: "4px" }}>
                              <strong>증빙/메모:</strong> {reqItem.proof_text}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Processed Claims */}
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 850, color: "var(--navy)", marginBottom: "14px" }}>
              📋 이전 처리 내역 ({processedList.length}건)
            </h2>

            {processedList.length === 0 ? (
              <div style={{ padding: "20px", background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--ink-muted)", fontSize: "0.82rem" }}>
                이전 처리 항목이 없습니다.
              </div>
            ) : (
              <div style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", background: "#FFFFFF" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#FAF9F5", borderBottom: "1px solid var(--border)", color: "var(--navy)" }}>
                      <th style={{ padding: "12px 16px" }}>신청일</th>
                      <th style={{ padding: "12px 16px" }}>단체명</th>
                      <th style={{ padding: "12px 16px" }}>신청자</th>
                      <th style={{ padding: "12px 16px" }}>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedList.map((reqItem) => (
                      <tr key={reqItem.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "12px 16px", color: "var(--ink-muted)" }}>
                          {new Date(reqItem.created_at).toLocaleDateString("ko-KR")}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 800, color: "var(--navy)" }}>
                          {reqItem.companies?.name || "단체명 없음"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {reqItem.applicant_name} ({reqItem.applicant_email})
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {reqItem.status === "approved" ? (
                            <span style={{ color: "#047857", fontWeight: 800, background: "#ECFDF5", padding: "2px 8px", borderRadius: "4px" }}>
                              승인 완료
                            </span>
                          ) : (
                            <span style={{ color: "#991B1B", fontWeight: 800, background: "#FEF2F2", padding: "2px 8px", borderRadius: "4px" }}>
                              거절됨
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* OVERWRITE WARNING CONFIRMATION MODAL */}
      {confirmModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            backgroundColor: "rgba(23, 20, 17, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setConfirmModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "460px",
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "28px",
              border: "1px solid var(--border)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⚠️</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "var(--navy)", margin: "0 0 10px 0" }}>
              대표 계정 변경 경고
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--navy)", lineHeight: 1.5, margin: "0 0 20px 0" }}>
              {confirmModal.message}
            </p>
            <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)", background: "#FFF7ED", border: "1px solid #FFEDD5", padding: "10px 14px", borderRadius: "6px", marginBottom: "24px" }}>
              💡 승인 시 기존 대표 계정은 권한이 해제되고, 이번 신청자 계정으로 단체 관리 권한이 이전됩니다.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                style={{
                  padding: "10px 18px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--ink-muted)",
                  background: "#FFFFFF",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => handleApprove(confirmModal.requestId, true)}
                style={{
                  padding: "10px 20px",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  backgroundColor: "#C2410C",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                새로운 대표로 변경 승인 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
