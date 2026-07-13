"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

interface ArtistSummary {
  id: string;
  name: string;
  slug: string | null;
  status: string | null;
}

interface AccountClientProps {
  email: string;
  artist: ArtistSummary | null;
  displayName: string;
}

export default function AccountClient({ email, artist, displayName }: AccountClientProps) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const accountHandle = artist?.slug || email.split("@")[0] || "user";
  const publicUrl = artist?.slug ? `popok.kr/artists/${artist.slug}` : null;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "계정 삭제 중 오류가 발생했습니다.");
        setDeleting(false);
        return;
      }
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setErrorMsg("서버 연결에 실패했습니다: " + err.message);
      setDeleting(false);
    }
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0",
    borderBottom: "1px solid var(--border)",
    gap: "16px",
  };
  const labelStyle: React.CSSProperties = { fontSize: "0.82rem", fontWeight: 700, color: "var(--ink-muted)", flexShrink: 0 };
  const valueStyle: React.CSSProperties = { fontSize: "0.9rem", fontWeight: 800, color: "var(--navy)", textAlign: "right", wordBreak: "break-all" };

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "60px 24px 100px" }}>
      <h1 className="display" style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", color: "var(--navy)", fontWeight: 950, letterSpacing: "-0.03em", marginBottom: "32px" }}>
        계정 설정
      </h1>

      <div className="card" style={{ padding: "8px 24px", marginBottom: "24px" }}>
        <div style={rowStyle}>
          <span style={labelStyle}>POPOK 아이디</span>
          <span style={valueStyle}>@{accountHandle}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>공개 프로필 주소</span>
          <span style={valueStyle}>{publicUrl || "아직 없음"}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>로그인 이메일</span>
          <span style={valueStyle}>{email}</span>
        </div>
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <span style={labelStyle}>연결된 아티스트 프로필</span>
          {artist ? (
            <Link href={`/artists/${artist.slug || artist.id}`} style={{ ...valueStyle, textDecoration: "underline" }}>
              {artist.name}
            </Link>
          ) : (
            <span style={valueStyle}>연결된 프로필 없음</span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "48px" }}>
        {!artist && (
          <Link href="/onboarding" className="btn-lime" style={{ textDecoration: "none", textAlign: "center", padding: "14px", borderRadius: "12px", fontSize: "0.9rem", fontWeight: 850 }}>
            내 POPOK 만들기
          </Link>
        )}
        {artist && (
          <Link href="/my-popok" className="btn-outline" style={{ textDecoration: "none", textAlign: "center", padding: "14px", borderRadius: "12px", fontSize: "0.9rem", fontWeight: 800 }}>
            프로필 관리
          </Link>
        )}
        <button
          onClick={handleSignOut}
          className="btn-outline"
          style={{ padding: "14px", borderRadius: "12px", fontSize: "0.9rem", fontWeight: 800, cursor: "pointer" }}
        >
          로그아웃
        </button>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
        <h2 style={{ fontSize: "0.95rem", fontWeight: 900, color: "var(--navy)", marginBottom: "8px" }}>
          계정 탈퇴
        </h2>
        <p style={{ fontSize: "0.8rem", color: "var(--ink-muted)", lineHeight: 1.6, marginBottom: "16px" }}>
          계정을 삭제하면 로그인 정보가 영구적으로 사라지며 되돌릴 수 없습니다. 연결된 POPOK 프로필은 비공개로 전환됩니다.
        </p>

        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            style={{
              border: "1px solid #DC2626", background: "none", color: "#DC2626",
              padding: "12px 20px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 800,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            계정 탈퇴하기
          </button>
        ) : (
          <div style={{ border: "1.5px solid #DC2626", borderRadius: "12px", padding: "16px" }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 800, color: "#DC2626", marginBottom: "12px" }}>
              정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            {errorMsg && (
              <p style={{ fontSize: "0.78rem", color: "#DC2626", marginBottom: "12px" }}>{errorMsg}</p>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="btn-outline"
                style={{ flex: 1, padding: "12px", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 800, cursor: "pointer" }}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{
                  flex: 1, border: "none", background: "#DC2626", color: "#FFFFFF",
                  padding: "12px", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 800,
                  cursor: deleting ? "not-allowed" : "pointer", fontFamily: "inherit",
                }}
              >
                {deleting ? "처리 중..." : "네, 탈퇴합니다"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
