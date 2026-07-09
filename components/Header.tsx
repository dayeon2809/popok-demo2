"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthNav from "@/components/AuthNav";

const NAV_ITEMS = [
  { href: "/#about", label: "About" },
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/artists", label: "Artists" },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

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
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: active ? "var(--navy)" : "var(--ink-muted)",
                  borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
                  paddingBottom: "2px",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  textDecoration: "none",
                  padding: "14px 6px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: active ? "var(--navy)" : "var(--ink-muted)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
