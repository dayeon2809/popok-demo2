"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AuthNav from "@/components/AuthNav";
import { useLanguage, type Language } from "@/lib/useLanguage";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { analytics } from "@/lib/analytics";

const NAV_ITEMS: Array<{ href: string; label: Record<Language, string>; match: (pathname: string) => boolean }> = [
  {
    href: "/about",
    label: { ko: "소개", en: "About" },
    match: (pathname) => pathname === "/about",
  },
  {
    href: "/artists",
    label: { ko: "아티스트", en: "Artists" },
    match: (pathname) => pathname === "/artists" || pathname.startsWith("/artists/"),
  },
  {
    href: "/companies",
    label: { ko: "단체", en: "Company" },
    match: (pathname) => pathname === "/companies" || pathname.startsWith("/companies/"),
  },
  {
    href: "/premium",
    label: { ko: "Premium", en: "Premium" },
    match: (pathname) => pathname === "/premium",
  },
  {
    href: "/about#testimonials",
    label: { ko: "이용 후기", en: "Testimonials" },
    match: () => false,
  },
  {
    href: "/about#faq",
    label: { ko: "자주 묻는 질문", en: "FAQ" },
    match: () => false,
  },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    async function getSession() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        
        // Track explicit login if it was pending
        if (typeof window !== "undefined" && sessionStorage.getItem("popok_login_pending") === "true") {
          sessionStorage.removeItem("popok_login_pending");
          analytics.login("google");
        }
        
        if (typeof window !== "undefined") {
          localStorage.setItem("popok_logged_in", "true");
        }
      } else {
        setUser(null);
        
        // Track logout if user was previously logged in
        if (typeof window !== "undefined") {
          const wasLoggedIn = localStorage.getItem("popok_logged_in") === "true";
          if (wasLoggedIn || event === "SIGNED_OUT") {
            localStorage.removeItem("popok_logged_in");
            analytics.logout();
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 200,
      background: "rgba(245,241,232,0.92)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      borderBottom: "1px solid var(--border)",
    }}>
      <div className="header-inner" style={{
        maxWidth: "1120px", margin: "0 auto", padding: "0 32px", height: "56px",
        display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: "24px",
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ fontWeight: 900, fontSize: "1.3rem", color: "var(--navy)", letterSpacing: "-0.04em", display: "flex", alignItems: "center", gap: "2px" }}>
            POPOK
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
          </div>
        </Link>

        <div className="header-nav-links" style={{ display: "flex", justifyContent: "center", gap: "28px" }}>
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (item.href === "/premium") {
                    analytics.premiumClick("header");
                  }
                }}
                style={{
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: active ? "var(--navy)" : "var(--ink-muted)",
                  borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
                  paddingBottom: "2px",
                }}
              >
                {item.label[language]}
              </Link>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            aria-label="Language selector"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
              flexShrink: 0,
            }}
          >
            {(["ko", "en"] as Language[]).map((item, idx) => {
              const active = language === item;
              return (
                <span key={item} style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
                  {idx > 0 && (
                    <span style={{ color: "var(--ink-faint)", fontSize: "0.7rem", fontWeight: 300, userSelect: "none", padding: "0 1px" }}>/</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setLanguage(item)}
                    aria-pressed={active}
                    style={{
                      border: 0,
                      background: "transparent",
                      color: active ? "var(--navy)" : "var(--ink-faint)",
                      fontFamily: "inherit",
                      fontSize: active ? "0.8rem" : "0.75rem",
                      fontWeight: active ? 800 : 400,
                      letterSpacing: "0.04em",
                      padding: "4px 3px",
                      cursor: "pointer",
                      transition: "color 0.15s ease, font-weight 0.15s ease",
                      lineHeight: 1,
                    }}
                  >
                    {item.toUpperCase()}
                  </button>
                </span>
              );
            })}
          </div>
          <button
            type="button"
            className="header-burger-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={menuOpen}
            style={{
              display: "none",
              width: "40px", height: "40px",
              alignItems: "center", justifyContent: "center",
              background: "transparent", border: "1.5px solid var(--border-dark)",
              borderRadius: "10px", cursor: "pointer", flexShrink: 0,
              fontSize: "1.1rem", color: "var(--navy)", fontFamily: "inherit", lineHeight: 1,
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
          <AuthNav />
        </div>
      </div>

      {menuOpen && (
        <div
          className="header-mobile-panel"
          style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            background: "var(--bg-warm)",
            borderTop: "1.5px solid var(--border)",
            boxShadow: "0 12px 24px rgba(30,45,64,0.08)",
            padding: "8px 20px 16px",
            display: "flex",
            flexDirection: "column",
            zIndex: 199,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setMenuOpen(false);
                  if (item.href === "/premium") {
                    analytics.premiumClick("header");
                  }
                }}
                style={{
                  textDecoration: "none",
                  padding: "14px 6px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: active ? "var(--navy)" : "var(--ink-muted)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {item.label[language]}
              </Link>
            );
          })}
          {!user ? (
            <Link
              href="/auth"
              onClick={() => setMenuOpen(false)}
              className="btn-lime"
              style={{
                textDecoration: "none",
                marginTop: "12px",
                padding: "13px 16px",
                borderRadius: "12px",
                fontSize: "0.9rem",
                fontWeight: 850,
                textAlign: "center",
              }}
            >
              {language === "ko" ? "내 포퐄 만들기" : "Get my POPOK"}
            </Link>
          ) : (
            <>
              <Link
                href="/my-popok"
                onClick={() => setMenuOpen(false)}
                style={{
                  textDecoration: "none",
                  padding: "14px 6px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: pathname === "/my-popok" ? "var(--navy)" : "var(--ink-muted)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {language === "ko" ? "내 포퐄 확인하기" : "My POPOK"}
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  textDecoration: "none",
                  padding: "14px 6px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "var(--ink-muted)",
                  border: 0,
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {language === "ko" ? "로그아웃" : "Sign Out"}
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
