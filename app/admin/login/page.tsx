"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

// Deliberately outside the (protected) route group's layout — this page
// must be reachable without an admin session (it's what issues one). See
// lib/admin.ts for the server-side verification this posts to.
export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.replace("/admin");
        router.refresh();
      } else {
        setError(data.error || "로그인에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8F9FA", padding: "24px" }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%", maxWidth: "360px", background: "#FFFFFF",
          border: "1px solid var(--border)", borderRadius: "12px",
          padding: "32px", display: "flex", flexDirection: "column", gap: "16px",
        }}
      >
        <div>
          <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "var(--navy)", letterSpacing: "-0.03em", marginBottom: "4px" }}>
            POPOK Admin
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--ink-muted)", margin: 0 }}>
            관리자 비밀번호를 입력해주세요.
          </p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          autoFocus
          style={{ padding: "12px 14px", fontSize: "0.95rem", borderRadius: "6px", border: "1px solid var(--border)", fontFamily: "inherit" }}
        />

        {error && (
          <p style={{ fontSize: "0.8rem", color: "#C0392B", margin: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="btn-lime"
          style={{
            padding: "12px", borderRadius: "6px", border: "none",
            fontSize: "0.9rem", fontWeight: 800, fontFamily: "inherit",
            cursor: loading || !password ? "default" : "pointer",
            opacity: loading || !password ? 0.6 : 1,
          }}
        >
          {loading ? "확인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
