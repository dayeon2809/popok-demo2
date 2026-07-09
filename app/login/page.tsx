"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mockLogin, getLoggedInUser } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect away
  useEffect(() => {
    if (getLoggedInUser()) {
      router.push(redirectPath);
    }
  }, [router, redirectPath]);

  const handleGoogleLogin = () => {
    try {
      // Mock Google Login
      mockLogin("dance_lover@gmail.com", "구글무용러");
      window.dispatchEvent(new Event("poc-auth-change"));
      router.push(redirectPath);
    } catch (err: any) {
      setError("구글 로그인 중 문제가 발생했습니다.");
    }
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !nickname.trim()) {
      setError("이메일과 닉네임을 모두 입력해주세요.");
      return;
    }

    if (!email.includes("@")) {
      setError("올바른 이메일 형식이 아닙니다.");
      return;
    }

    try {
      mockLogin(email.trim(), nickname.trim());
      window.dispatchEvent(new Event("poc-auth-change"));
      router.push(redirectPath);
    } catch (err: any) {
      setError("로그인 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={{
      minHeight: "75vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      background: "var(--bg-warm)"
    }}>
      <div style={{
        maxWidth: "380px",
        width: "100%",
        background: "#fff",
        borderRadius: "16px",
        padding: "36px 32px",
        boxShadow: "0 8px 32px rgba(30,45,64,0.04)",
        border: "1.5px solid var(--border)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img
            src="/logo.png"
            alt="Piece of Cake"
            width={40}
            height={39}
            style={{ display: "inline-block", marginBottom: "12px", objectFit: "contain" }}
          />
          <h1 className="display" style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "var(--navy)",
            marginBottom: "8px"
          }}>
            Piece of Cake 시작하기
          </h1>
          <p style={{
            fontSize: "0.85rem",
            color: "var(--ink-muted)",
            lineHeight: 1.5
          }}>
            공연을 아카이빙하고 감상 평점과 한 줄 댓글을 나눠보세요.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            padding: "10px 14px",
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "8px",
            color: "#B91C1C",
            fontSize: "0.78rem",
            marginBottom: "20px",
            textAlign: "center"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            padding: "12px",
            background: "#fff",
            color: "#1E2D40",
            border: "1.5px solid var(--border-dark)",
            borderRadius: "10px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "24px",
            transition: "all 0.15s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#F8FAFC";
            e.currentTarget.style.borderColor = "var(--navy)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.borderColor = "var(--border-dark)";
          }}
        >
          {/* Simple colored dots mock logo */}
          <span style={{ display: "flex", gap: "2px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#EA4335" }} />
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4285F4" }} />
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FBBC05" }} />
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34A853" }} />
          </span>
          Google로 간편하게 시작하기
        </button>

        {/* Divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "var(--ink-faint)",
          fontSize: "0.75rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "24px"
        }}>
          <div style={{ flexGrow: 1, height: "1px", background: "var(--border)" }} />
          <span>또는 이메일로 로그인</span>
          <div style={{ flexGrow: 1, height: "1px", background: "var(--border)" }} />
        </div>

        {/* Email Login Form */}
        <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{
              display: "block",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--ink-muted)",
              marginBottom: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.04em"
            }}>
              이메일 주소
            </label>
            <input
              type="text"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "0.9rem"
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--ink-muted)",
              marginBottom: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.04em"
            }}>
              닉네임 (Nickname)
            </label>
            <input
              type="text"
              placeholder="무용매니아"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "0.9rem"
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              background: "var(--navy)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "0.9rem",
              marginTop: "4px",
              boxShadow: "0 4px 12px rgba(30,45,64,0.1)",
              transition: "opacity 0.15s"
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            이메일로 로그인
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: "80px 0", textAlign: "center", color: "var(--ink-muted)" }}>로그인 양식을 불러오는 중...</div>}>
      <LoginForm />
    </Suspense>
  );
}
