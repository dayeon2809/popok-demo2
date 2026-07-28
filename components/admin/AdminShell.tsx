"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const menuGroups = [
  { label: "Overview", items: [{ name: "대시보드", path: "/admin" }] },
  { label: "Content", items: [
    { name: "제출 자료", path: "/admin/submissions" },
    { name: "아티스트", path: "/admin/artists" },
    { name: "공연", path: "/admin/performances" },
  ] },
  { label: "Companies", items: [
    { name: "단체", path: "/admin/companies" },
    { name: "단체 등록 신청", path: "/admin/organizations" },
    { name: "대표 권한 신청", path: "/admin/company-claim-requests" },
  ] },
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
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link href="/admin" className="admin-brand">POPOK <span>ADMIN</span></Link>
        <button onClick={handleLogout} className="admin-logout">로그아웃</button>
      </header>
      <div className="admin-frame">
        <aside className="admin-sidebar" aria-label="관리자 메뉴">
          {menuGroups.map((group) => (
            <section key={group.label} className="admin-nav-group">
              <p>{group.label}</p>
              <div>
                {group.items.map((item) => {
                  const active = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path + "/"));
                  return <Link key={item.path} href={item.path} aria-current={active ? "page" : undefined} className={active ? "active" : ""}>{item.name}</Link>;
                })}
              </div>
            </section>
          ))}
        </aside>
        <main className="admin-content">{children}</main>
      </div>
      <style jsx global>{`
        .admin-shell{min-height:80vh;background:#f8f9fa;color:var(--navy)}
        .admin-topbar{height:58px;background:var(--navy);display:flex;align-items:center;justify-content:space-between;padding:0 24px}
        .admin-brand{color:#fff;text-decoration:none;font-weight:900;letter-spacing:-.02em}.admin-brand span{color:var(--accent);font-size:11px;margin-left:7px;letter-spacing:.12em}
        .admin-logout{border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;padding:7px 12px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
        .admin-frame{display:grid;grid-template-columns:224px minmax(0,1fr);min-height:calc(80vh - 58px)}
        .admin-sidebar{background:#fff;border-right:1px solid var(--border);padding:24px 15px}
        .admin-nav-group{margin-bottom:24px}.admin-nav-group>p{margin:0 10px 7px;color:#98a0aa;font-size:10px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}
        .admin-nav-group>div{display:grid;gap:3px}.admin-nav-group a{padding:9px 11px;text-decoration:none;color:var(--ink-muted);font-size:13px;font-weight:750;border-left:3px solid transparent}.admin-nav-group a:hover{background:#f5f6f7;color:var(--navy)}.admin-nav-group a.active{color:var(--navy);background:#f2f5e9;border-left-color:var(--accent)}
        .admin-content{padding:32px;min-width:0}
        @media(max-width:760px){.admin-topbar{padding:0 16px}.admin-frame{display:block}.admin-sidebar{position:sticky;top:0;z-index:20;display:flex;gap:20px;overflow-x:auto;padding:10px 14px;border-right:0;border-bottom:1px solid var(--border)}.admin-nav-group{margin:0;flex:none}.admin-nav-group>p{display:none}.admin-nav-group>div{display:flex}.admin-nav-group a{white-space:nowrap;border-left:0;border-bottom:2px solid transparent;padding:8px 10px}.admin-nav-group a.active{border-bottom-color:var(--accent)}.admin-content{padding:22px 14px}}
      `}</style>
    </div>
  );
}
