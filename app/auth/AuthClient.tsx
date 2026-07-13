"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

export default function AuthClient() {
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserSupabaseClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
      if (error) {
        alert("로그인 중 오류가 발생했습니다: " + error.message);
        setLoading(false);
      }
    } catch (err: any) {
      alert("로그인 중 오류가 발생했습니다: " + (err.message || String(err)));
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "70vh",
      padding: "24px",
    }}>
      <div className="card fade-up" style={{
        maxWidth: "420px",
        width: "100%",
        padding: "48px 32px",
        textAlign: "center",
        border: "1.5px solid var(--border)",
        background: "#FFFFFF",
        borderRadius: "20px",
        boxShadow: "0 8px 30px rgba(23, 20, 17, 0.04)"
      }}>
        {/* Brand Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            fontWeight: 900,
            fontSize: "2rem",
            color: "var(--navy)",
            letterSpacing: "-0.04em",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            marginBottom: "12px"
          }}>
            POPOK
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
          </div>
          <p style={{
            color: "var(--ink-muted)",
            fontSize: "0.95rem",
            lineHeight: 1.5,
            fontWeight: 500
          }}>
            당신의 포트폴리오를, 더 가볍게.<br />
            하나의 링크로 예술적 작업을 연결하세요.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 20px",
            borderRadius: "12px",
            border: "1.5px solid var(--navy)",
            background: "#FFFFFF",
            color: "var(--navy)",
            fontSize: "1rem",
            fontWeight: 750,
            cursor: loading ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
          className="google-btn"
        >
          {loading ? (
            <span style={{ fontSize: "0.9rem", color: "var(--ink-muted)" }}>연결 중...</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.59.1-1.17.282-1.706V4.962H.957A8.997 8.997 0 000 9c0 1.455.348 2.83 1.018 4.073l2.946-2.367z" fill="#FBBC05"/>
                <path d="M9 3.58c1.32 0 2.507.454 3.44 1.346l2.582-2.581C13.463.896 11.426 0 9 0 5.42 0 2.38 2.045 1.018 5.038l2.946 2.367C4.672 5.239 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              <span>Google로 계속하기</span>
            </>
          )}
        </button>

        {/* Extra CSS injection in JSX for simple custom hover style */}
        <style>{`
          .google-btn:hover {
            background-color: var(--accent-light) !important;
            border-color: var(--accent-dark) !important;
            transform: scale(1.02);
          }
        `}</style>
      </div>
    </div>
  );
}
