"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadingSpinner, ErrorMessage, EmptyState } from "@/components/ui/States";

interface OrganizationApplication {
  id: string;
  org_name: string;
  contact_name: string;
  email: string;
  phone: string;
  instagram: string;
  website: string | null;
  description: string | null;
  resume_file_path: string | null;
  resume_file_name: string | null;
  status: "pending" | "approved" | "rejected";
  company_id: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<OrganizationApplication["status"], string> = {
  pending: "대기 중",
  approved: "승인됨",
  rejected: "반려",
};

const STATUS_COLOR: Record<OrganizationApplication["status"], { bg: string; fg: string }> = {
  pending: { bg: "#FFFBEB", fg: "#B45309" },
  approved: { bg: "#ECFDF5", fg: "#047857" },
  rejected: { bg: "#FEF2F2", fg: "#DC2626" },
};

const COMPANY_STATUS_LABEL: Record<string, string> = {
  draft: "초안",
  published: "공개",
  archived: "보관",
};

export default function AdminOrganizationsPage() {
  const [applications, setApplications] = useState<OrganizationApplication[] | null>(null);
  const [companyStatusById, setCompanyStatusById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const getPasscode = () => sessionStorage.getItem("admin_passcode") || "";

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const [appsRes, companiesRes] = await Promise.all([
        fetch("/api/admin/organization-applications", { headers: { "x-admin-passcode": getPasscode() } }),
        fetch("/api/admin/companies", { headers: { "x-admin-passcode": getPasscode() } }),
      ]);
      const appsData = await appsRes.json();
      const companiesData = await companiesRes.json();

      if (appsRes.ok && appsData.success) {
        setApplications(appsData.data);
      } else {
        setError(appsData.error || "신청 목록을 가져오는 데 실패했습니다.");
      }

      if (companiesRes.ok && companiesData.success) {
        const map: Record<string, string> = {};
        for (const c of companiesData.data) map[c.id] = c.status;
        setCompanyStatusById(map);
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/organization-applications/${id}/approve`, {
        method: "POST",
        headers: { "x-admin-passcode": getPasscode() },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "승인 처리에 실패했습니다.");
        return;
      }
      window.location.href = `/admin/companies/${data.companyId}`;
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("이 신청을 반려하시겠습니까?")) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/organization-applications/${id}/reject`, {
        method: "POST",
        headers: { "x-admin-passcode": getPasscode() },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "반려 처리에 실패했습니다.");
        return;
      }
      await fetchApplications();
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevertToPending = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/organization-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-passcode": getPasscode() },
        body: JSON.stringify({ status: "pending" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "되돌리기에 실패했습니다.");
        return;
      }
      await fetchApplications();
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDownload = async (id: string) => {
    setDownloadingId(id);
    try {
      const res = await fetch(`/api/admin/organization-applications/${id}/resume`, {
        headers: { "x-admin-passcode": getPasscode() },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        alert(data.error || "파일을 불러오지 못했습니다.");
      }
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "30px", borderBottom: "1.5px solid var(--border)", paddingBottom: "16px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--navy)" }}>단체 포트폴리오 제작 신청</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }}>
          단체가 로그인 없이 제출한 신청서를 확인하고, 승인해 단체 편집 화면으로 넘깁니다.
        </p>
      </div>

      {loading && <LoadingSpinner message="신청 목록을 불러오는 중..." />}
      {!loading && error && <ErrorMessage message={error} />}
      {!loading && !error && applications && applications.length === 0 && (
        <EmptyState message="아직 접수된 단체 신청이 없습니다." />
      )}

      {!loading && !error && applications && applications.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {applications.map((app) => {
            const statusColor = STATUS_COLOR[app.status];
            const companyStatus = app.company_id ? companyStatusById[app.company_id] : null;
            const isLoading = actionLoadingId === app.id;
            return (
              <div key={app.id} style={{
                background: "#fff",
                border: "1.5px solid var(--border)",
                borderRadius: "12px",
                padding: "20px 24px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--navy)", margin: 0 }}>{app.org_name}</h3>
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 800, padding: "2px 10px", borderRadius: "999px",
                        background: statusColor.bg, color: statusColor.fg,
                      }}>
                        {STATUS_LABEL[app.status]}
                      </span>
                      {companyStatus && (
                        <span style={{
                          fontSize: "0.7rem", fontWeight: 800, padding: "2px 10px", borderRadius: "999px",
                          background: "#EFF6FF", color: "#1D4ED8",
                        }}>
                          단체 상태: {COMPANY_STATUS_LABEL[companyStatus] || companyStatus}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", margin: 0 }}>
                      {new Date(app.created_at).toLocaleString("ko-KR")}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {app.resume_file_path && (
                      <button onClick={() => handleDownload(app.id)} disabled={downloadingId === app.id} style={actionBtnStyle}>
                        {downloadingId === app.id ? "여는 중..." : "PDF 다운로드"}
                      </button>
                    )}

                    {app.status === "pending" && (
                      <>
                        <button onClick={() => handleApprove(app.id)} disabled={isLoading} style={primaryBtnStyle}>
                          {isLoading ? "처리 중..." : "승인 후 초안 생성"}
                        </button>
                        <button onClick={() => handleReject(app.id)} disabled={isLoading} style={dangerBtnStyle}>
                          반려
                        </button>
                      </>
                    )}

                    {app.status === "approved" && app.company_id && (
                      <>
                        <Link href={`/admin/companies/${app.company_id}`} style={{ ...actionBtnStyle, textDecoration: "none", display: "inline-block" }}>
                          단체 편집
                        </Link>
                        <Link href={`/admin/companies/${app.company_id}/preview`} style={{ ...actionBtnStyle, textDecoration: "none", display: "inline-block" }}>
                          단체 미리보기
                        </Link>
                      </>
                    )}

                    {app.status === "rejected" && (
                      <button onClick={() => handleRevertToPending(app.id)} disabled={isLoading} style={actionBtnStyle}>
                        대기 중으로 되돌리기
                      </button>
                    )}
                  </div>
                </div>

                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "8px 20px", marginTop: "16px", fontSize: "0.82rem",
                }}>
                  <div><span style={{ color: "var(--ink-muted)" }}>대표자: </span><strong>{app.contact_name}</strong></div>
                  <div><span style={{ color: "var(--ink-muted)" }}>이메일: </span><strong>{app.email}</strong></div>
                  <div><span style={{ color: "var(--ink-muted)" }}>연락처: </span><strong>{app.phone}</strong></div>
                  <div><span style={{ color: "var(--ink-muted)" }}>인스타그램: </span><strong>{app.instagram}</strong></div>
                  {app.website && (
                    <div><span style={{ color: "var(--ink-muted)" }}>홈페이지: </span><strong>{app.website}</strong></div>
                  )}
                  {app.resume_file_name && (
                    <div><span style={{ color: "var(--ink-muted)" }}>첨부파일: </span><strong>{app.resume_file_name}</strong></div>
                  )}
                </div>

                {app.description && (
                  <p style={{
                    marginTop: "14px", padding: "12px 14px", background: "#f8f9fa", borderRadius: "8px",
                    fontSize: "0.82rem", color: "var(--ink-muted)", lineHeight: 1.6,
                  }}>
                    {app.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  padding: "6px 14px", borderRadius: "8px", border: "1.5px solid var(--border)",
  background: "#fff", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "6px 14px", borderRadius: "8px", border: "1.5px solid var(--navy)",
  background: "var(--navy)", color: "#fff", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};

const dangerBtnStyle: React.CSSProperties = {
  padding: "6px 14px", borderRadius: "8px", border: "1.5px solid #FCA5A5",
  background: "#FEF2F2", color: "#DC2626", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};
