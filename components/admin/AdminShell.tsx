"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const menuItems = [
  { name: "Dashboard", path: "/admin" },
  { name: "Submissions", path: "/admin/submissions" },
  { name: "Artists", path: "/admin/artists" },
  { name: "이번 주 공연 관리", path: "/admin/performances" },
  { name: "Organizations", path: "/admin/organizations" },
  { name: "Companies", path: "/admin/companies" },
  { name: "대표 권한 신청", path: "/admin/company-claim-requests" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div style={{ minHeight: "80vh", background: "#f8f9fa", display: "flex", flexDirection: "column" }}>
      <header style={{ height: "54px", background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontWeight: 800, fontSize: "0.95rem", letterSpacing: "-0.01em" }}>POPOK Admin</span>
          <span style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.15)", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>MVP</span>
        </div>
        <button onClick={handleLogout} style={{ padding: "6px 12px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          로그아웃
        </button>
      </header>

      <div style={{ display: "flex", flex: 1, minHeight: "calc(80vh - 54px)" }}>
        <aside style={{ width: "220px", background: "#fff", borderRight: "1.5px solid var(--border)", padding: "24px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(`${item.path}/`));
            return (
              <Link key={item.path} href={item.path} style={{ display: "block", padding: "10px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none", color: isActive ? "var(--navy)" : "var(--ink-muted)", background: isActive ? "#f1f3f5" : "transparent", transition: "all 0.15s" }}>
                {item.name}
              </Link>
            );
          })}
        </aside>
        <main style={{ flex: 1, padding: "32px", minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
}