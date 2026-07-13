"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/useLanguage";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

export default function AuthNav() {
  const { language } = useLanguage();
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getSession() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const t = {
    myPopok: language === "ko" ? "내 POPOK" : "My POPOK",
    cta: language === "ko" ? "내 POPOK 만들기" : "Get my POPOK",
    logout: language === "ko" ? "로그아웃" : "Sign Out",
  };

  if (loading) {
    return (
      <div className="auth-nav" style={{ display: "flex", alignItems: "center", gap: "20px", visibility: "hidden" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>{t.myPopok}</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-nav" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <Link href="/auth" style={{
          textDecoration: "none", fontSize: "0.875rem", fontWeight: 800,
          padding: "10px 20px", borderRadius: "10px",
          display: "inline-flex", alignItems: "center",
        }} className="btn-lime">
          {t.cta}
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-nav" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
      <Link href="/my-popok" style={{
        textDecoration: "none", fontSize: "0.875rem", fontWeight: 700,
        color: "var(--navy)",
      }}>
        {t.myPopok}
      </Link>
      <button
        onClick={handleSignOut}
        style={{
          border: 0,
          background: "transparent",
          fontSize: "0.875rem",
          fontWeight: 800,
          color: "var(--ink-muted)",
          cursor: "pointer",
          fontFamily: "inherit",
          padding: 0
        }}
      >
        {t.logout}
      </button>
    </div>
  );
}
