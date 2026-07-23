"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/useLanguage";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

const menuItemStyle: React.CSSProperties = {
  display: "block",
  textDecoration: "none",
  padding: "10px 12px",
  borderRadius: "8px",
  fontSize: "0.82rem",
  fontWeight: 700,
  color: "var(--navy)",
};

export default function AuthNav() {
  const { language } = useLanguage();
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [user, setUser] = useState<any>(null);
  // The artist profile linked to this user (artists.owner_id === user.id), fetched
  // via the existing /api/artists/me route — null while unknown or if none is linked.
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function getSession() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!user) {
      setArtist(null);
      return;
    }
    let cancelled = false;
    fetch("/api/artists/me")
      .then((r) => r.json())
      .then(({ success, data }) => {
        if (!cancelled && success) setArtist(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const t = {
    cta: language === "ko" ? "내 POPOK 만들기" : "Get my POPOK",
    noProfile: language === "ko" ? "아직 연결된 POPOK 프로필이 없습니다." : "No linked POPOK profile yet.",
    createPopok: language === "ko" ? "내 POPOK 만들기" : "Create my POPOK",
    viewProfile: language === "ko" ? "내 프로필 보기" : "View my profile",
    manageProfile: language === "ko" ? "프로필 관리" : "Manage profile",
    accountSettings: language === "ko" ? "계정 설정" : "Account settings",
    logout: language === "ko" ? "로그아웃" : "Sign out",
  };

  if (loading) {
    return <div className="auth-nav" style={{ width: "88px", height: "32px", visibility: "hidden" }} />;
  }

  if (!user) {
    return (
      <div className="auth-nav auth-nav-guest" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
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

  const accountHandle = artist?.slug || user.email?.split("@")[0] || "user";
  const displayHandle = accountHandle.length > 16 ? `${accountHandle.slice(0, 14)}…` : accountHandle;
  const avatarUrl = artist?.profile_image_url;

  return (
    <div className="auth-nav-account" ref={menuRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-haspopup="true"
        aria-label={`@${accountHandle} 계정 메뉴`}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          border: "1px solid var(--border)", background: "#FFFFFF",
          borderRadius: "999px", padding: "4px 10px 4px 4px",
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <span style={{
          width: "24px", height: "24px", borderRadius: "50%", overflow: "hidden",
          background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, fontSize: "0.65rem", fontWeight: 800, color: "var(--accent-dark)",
        }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            accountHandle.charAt(0).toUpperCase()
          )}
        </span>
        <span className="auth-nav-handle" style={{
          fontSize: "0.8rem", fontWeight: 800, color: "var(--navy)",
          maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          @{displayHandle}
        </span>
        <span className="auth-nav-chevron" aria-hidden="true" style={{ fontSize: "0.7rem", color: "var(--ink-muted)" }}>
          ⌄
        </span>
      </button>

      {menuOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "14px",
          boxShadow: "0 12px 30px rgba(23,20,17,0.12)", minWidth: "220px",
          padding: "8px", zIndex: 300,
        }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", marginBottom: "6px" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 900, color: "var(--navy)" }}>@{accountHandle}</div>
            <div style={{
              fontSize: "0.72rem", color: "var(--ink-muted)", marginTop: "2px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {user.email}
            </div>
          </div>

          {artist ? (
            <>
              <Link href={`/artists/${artist.slug || artist.id}`} onClick={() => setMenuOpen(false)} className="account-menu-item" style={menuItemStyle}>
                {t.viewProfile}
              </Link>
              <Link href="/my-popok" onClick={() => setMenuOpen(false)} className="account-menu-item" style={menuItemStyle}>
                {t.manageProfile}
              </Link>
            </>
          ) : (
            <>
              <div style={{ padding: "8px 12px", fontSize: "0.78rem", color: "var(--ink-muted)", lineHeight: 1.5 }}>
                {t.noProfile}
              </div>
              <Link href="/onboarding" onClick={() => setMenuOpen(false)} className="account-menu-item" style={menuItemStyle}>
                {t.createPopok}
              </Link>
            </>
          )}

          <Link href="/account" onClick={() => setMenuOpen(false)} className="account-menu-item" style={menuItemStyle}>
            {t.accountSettings}
          </Link>

          <button
            onClick={handleSignOut}
            className="account-menu-item"
            style={{ ...menuItemStyle, width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            {t.logout}
          </button>
        </div>
      )}

      <style>{`
        .account-menu-item:hover {
          background: rgba(23, 20, 17, 0.05);
        }
      `}</style>
    </div>
  );
}
