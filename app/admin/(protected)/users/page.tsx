"use client";

import { useEffect, useState } from "react";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";

type MemberStatus = "registered" | "signup_only" | "profile_missing";

interface AdminUserRow {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  provider: string;
  hasProfile: boolean;
  hasArtist: boolean;
  hasCompany: boolean;
  status: MemberStatus;
}

// Mirrors the reason codes app/api/admin/users/[userId]/send-onboarding-reminder
// returns on { error: "EMAIL_SEND_FAILED", reason }. Never shown to non-admins.
const EMAIL_FAILURE_REASON_MESSAGE: Record<string, string> = {
  EMAIL_CONFIG_MISSING: "메일 발송 설정이 완료되지 않았습니다. 관리자에게 환경변수 설정을 확인해달라고 요청해주세요.",
  DOMAIN_NOT_VERIFIED: "발신 도메인이 인증되지 않았습니다. Resend에서 도메인 인증이 필요합니다.",
  RECIPIENT_RESTRICTED: "현재 발신 주소는 테스트 모드라 이 회원에게는 보낼 수 없습니다. 발신 도메인 인증이 필요합니다.",
  INVALID_SENDER: "발신자 주소 설정에 문제가 있습니다. 관리자에게 확인을 요청해주세요.",
  RESEND_REJECTED: "메일 발송이 거절되었습니다. 잠시 후 다시 시도해주세요.",
  UNKNOWN: "메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.",
};

const STATUS_BADGE: Record<MemberStatus, { bg: string; fg: string; label: string }> = {
  registered: { bg: "#E0F0E8", fg: "var(--verified)", label: "포퐄 등록" },
  signup_only: { bg: "#FEF3DC", fg: "#B45309", label: "가입만 완료" },
  profile_missing: { bg: "#F1F5F9", fg: "var(--ink-muted)", label: "프로필 미생성" },
};

interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

const badgeStyle = (bg: string, color: string): React.CSSProperties => ({
  display: "inline-block",
  fontSize: "0.68rem",
  padding: "3px 9px",
  borderRadius: "12px",
  fontWeight: 800,
  background: bg,
  color,
  whiteSpace: "nowrap",
});

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR");
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  const fetchUsers = async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?page=${targetPage}&perPage=50`);
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.error || "회원 목록을 불러오지 못했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSendReminder = async (u: AdminUserRow) => {
    if (sendingReminderId) return; // one request in flight at a time — blocks double-submit
    if (!window.confirm("이 회원에게 포퐄 만들기 안내 메일을 보내시겠습니까?")) return;

    setSendingReminderId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/send-onboarding-reminder`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("포퐄 만들기 안내 메일을 보냈습니다.");
      } else if (data.error === "EMAIL_SEND_FAILED") {
        alert(EMAIL_FAILURE_REASON_MESSAGE[data.reason as string] || EMAIL_FAILURE_REASON_MESSAGE.UNKNOWN);
      } else {
        alert(data.error || "메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } catch {
      alert("메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSendingReminderId(null);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div style={{ padding: "80px 0" }}>
        <LoadingSpinner message="회원 목록을 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px 0" }}>
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "20px", borderBottom: "1.5px solid var(--border)", paddingBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--navy)" }}>회원 관리</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "4px" }}>
            POPOK에 가입한 전체 회원을 확인합니다. 아직 포퐄을 만들지 않은 사용자도 포함됩니다.
          </p>
        </div>
        {pagination && (
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink-faint)" }}>
            총 {pagination.total.toLocaleString("ko-KR")}명
          </span>
        )}
      </div>

      {/* Users Table */}
      <div style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>
        <table className="admin-mobile-cards admin-users-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid var(--border)" }}>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>이메일</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>가입일</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>최근 로그인</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>가입 방식</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>회원 상태</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>프로필</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>아티스트</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>단체</th>
              <th style={{ padding: "12px 14px", fontWeight: 800, color: "var(--navy)" }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "var(--ink-muted)" }}>
                  회원이 없습니다.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const statusBadge = STATUS_BADGE[u.status];
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 700, color: "var(--navy)" }}>{u.email || "(이메일 없음)"}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--ink-faint)", fontFamily: "monospace", marginTop: "2px" }}>{u.id}</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "var(--ink-muted)" }}>{formatDateTime(u.createdAt)}</td>
                    <td style={{ padding: "12px 14px", color: "var(--ink-muted)" }}>{u.lastSignInAt ? formatDateTime(u.lastSignInAt) : "기록 없음"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={badgeStyle("#F1F5F9", "var(--ink-muted)")}>{u.provider}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={badgeStyle(statusBadge.bg, statusBadge.fg)}>{statusBadge.label}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={badgeStyle(u.hasProfile ? "#E0F0E8" : "#F1F5F9", u.hasProfile ? "var(--verified)" : "var(--ink-faint)")}>
                        {u.hasProfile ? "생성됨" : "미생성"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={badgeStyle(u.hasArtist ? "#E0EAFE" : "#F1F5F9", u.hasArtist ? "#2454C7" : "var(--ink-faint)")}>
                        {u.hasArtist ? "연결됨" : "없음"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={badgeStyle(u.hasCompany ? "#E0EAFE" : "#F1F5F9", u.hasCompany ? "#2454C7" : "var(--ink-faint)")}>
                        {u.hasCompany ? "연결됨" : "없음"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {!u.hasArtist && !u.hasCompany && (
                        <button
                          onClick={() => handleSendReminder(u)}
                          disabled={sendingReminderId === u.id}
                          style={{ ...reminderBtnStyle, opacity: sendingReminderId === u.id ? 0.6 : 1 }}
                        >
                          {sendingReminderId === u.id ? "발송 중..." : "포퐄 만들기 안내 보내기"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "20px" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            style={{ ...pageBtnStyle, opacity: page <= 1 ? 0.4 : 1 }}
          >
            이전
          </button>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink-muted)" }}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages || loading}
            style={{ ...pageBtnStyle, opacity: page >= pagination.totalPages ? 0.4 : 1 }}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

const reminderBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  background: "transparent",
  color: "var(--navy)",
  border: "1.2px solid var(--border-dark)",
  borderRadius: "6px",
  fontSize: "0.74rem",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

const pageBtnStyle: React.CSSProperties = {
  padding: "8px 18px",
  background: "#fff",
  color: "var(--navy)",
  border: "1.2px solid var(--border-dark)",
  borderRadius: "8px",
  fontSize: "0.82rem",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};
