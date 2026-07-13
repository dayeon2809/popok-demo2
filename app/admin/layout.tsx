"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem("admin_passcode");
    if (cached) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      // Redirect to passcode login if not already on /admin page
      if (pathname !== "/admin") {
        router.push("/admin");
      }
    }
    setChecking(false);
  }, [pathname, router]);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_passcode");
    setIsAuthenticated(false);
    router.push("/admin");
  };

  if (checking) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center", color: "var(--ink-muted)" }}>
        인증 확인 중...
      </div>
    );
  }

  // If not authenticated, we only render children (which is the login portal at /admin)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const menuItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "Submissions", path: "/admin/submissions" },
    { name: "Artists", path: "/admin/artists" },
    { name: "Performances", path: "/admin/performances" },
  ];

  return (
    <div style={{ minHeight: "80vh", background: "#f8f9fa", display: "flex", flexDirection: "column" }}>
      {/* Top Header */}
      <header style={{
        height: "54px",
        background: "var(--navy)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontWeight: 800, fontSize: "0.95rem", letterSpacing: "-0.01em" }}>POPOK Admin</span>
          <span style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.15)", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>MVP</span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: "6px 12px",
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "6px",
            fontSize: "0.78rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
        >
          로그아웃
        </button>
      </header>

      {/* Main Panel Layout */}
      <div style={{ display: "flex", flex: 1, minHeight: "calc(80vh - 54px)" }}>
        {/* Sidebar */}
        <aside style={{
          width: "220px",
          background: "#fff",
          borderRight: "1.5px solid var(--border)",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                style={{
                  display: "block",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  color: isActive ? "var(--navy)" : "var(--ink-muted)",
                  background: isActive ? "#f1f3f5" : "transparent",
                  transition: "all 0.15s"
                }}
              >
                {item.name}
              </a>
            );
          })}
        </aside>

        {/* Content Area */}
        <main style={{ flex: 1, padding: "32px", minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
