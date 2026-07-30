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
        @media(max-width:768px){
          .admin-shell,.admin-frame,.admin-content{width:100%;max-width:100%;overflow-x:hidden}
          .admin-content{padding:18px 12px 32px!important}
          .admin-content *{box-sizing:border-box;min-width:0}
          .admin-content h1{font-size:1.45rem!important;line-height:1.25;overflow-wrap:anywhere}
          .admin-content h2{font-size:1.08rem!important;line-height:1.35;overflow-wrap:anywhere}
          .admin-content p,.admin-content code,.admin-content pre,.admin-content a,.admin-content span{overflow-wrap:anywhere;word-break:break-word}
          .admin-content input:not([type="checkbox"]):not([type="radio"]),.admin-content textarea,.admin-content select{width:100%!important;max-width:100%!important;font-size:16px!important}
          .admin-content textarea{min-height:110px}
          .admin-content button{min-height:44px;max-width:100%;white-space:normal}
          .admin-content [style*="grid-template-columns"]{grid-template-columns:minmax(0,1fr)!important}
          .admin-content [style*="overflow-x: auto"]{overflow-x:visible!important}
          .admin-content [style*="display: flex"]{max-width:100%;flex-wrap:wrap}
          .admin-content [style*="justify-content: space-between"]{row-gap:12px}
          .admin-content [style*="position: sticky"]{max-width:100%;left:0;right:0}
          .admin-mobile-cards{display:block!important;width:100%!important;border-collapse:separate!important}
          .admin-mobile-cards thead{display:none!important}
          .admin-mobile-cards tbody{display:grid!important;gap:12px;width:100%}
          .admin-mobile-cards tr{display:flex!important;flex-direction:column;width:100%;padding:12px;background:#fff;border:1px solid var(--border)!important;border-radius:12px;box-shadow:0 3px 12px rgba(23,20,17,.045)}
          .admin-mobile-cards td{display:flex!important;align-items:flex-start;gap:10px;width:100%!important;max-width:100%!important;padding:8px 4px!important;border:0!important;text-align:left!important;white-space:normal!important;overflow-wrap:anywhere;word-break:break-word}
          .admin-mobile-cards td::before{flex:0 0 82px;color:var(--ink-muted);font-size:11px;font-weight:850;line-height:1.6}
          .admin-mobile-cards td[colspan]{display:block!important;text-align:center!important;padding:24px 8px!important}
          .admin-mobile-cards td[colspan]::before{display:none}
          .admin-mobile-cards td:last-child{padding-top:12px!important;margin-top:4px;border-top:1px solid var(--border)!important}
          .admin-mobile-cards td:last-child>div{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;width:100%}
          .admin-mobile-cards td:last-child button,.admin-mobile-cards td:last-child a{display:flex!important;align-items:center;justify-content:center;min-height:44px!important;width:100%;margin:0!important;text-align:center}
          .admin-artists-table td:nth-child(1)::before{content:"Profile"}.admin-artists-table td:nth-child(2)::before{content:"Name"}.admin-artists-table td:nth-child(3)::before{content:"Ownership"}.admin-artists-table td:nth-child(4)::before{content:"Account"}.admin-artists-table td:nth-child(5)::before{content:"Last login"}.admin-artists-table td:nth-child(6)::before{content:"Works"}.admin-artists-table td:nth-child(7)::before{content:"Views"}.admin-artists-table td:nth-child(8)::before{content:"Updated"}.admin-artists-table td:nth-child(9)::before{content:"Status"}.admin-artists-table td:nth-child(10)::before{content:"Actions"}
          .admin-companies-table td:nth-child(1)::before{content:"Company"}.admin-companies-table td:nth-child(2)::before{content:"Slug"}.admin-companies-table td:nth-child(3)::before{content:"Status"}.admin-companies-table td:nth-child(4)::before{content:"Genre / Area"}.admin-companies-table td:nth-child(5)::before{content:"Content"}.admin-companies-table td:nth-child(6)::before{content:"Source"}.admin-companies-table td:nth-child(7)::before{content:"Actions"}
          .admin-submissions-table td:nth-child(1)::before{content:"ID"}.admin-submissions-table td:nth-child(2)::before{content:"Name"}.admin-submissions-table td:nth-child(3)::before{content:"Email"}.admin-submissions-table td:nth-child(4)::before{content:"Genre"}.admin-submissions-table td:nth-child(5)::before{content:"Status"}.admin-submissions-table td:nth-child(6)::before{content:"Created"}.admin-submissions-table td:nth-child(7)::before{content:"Actions"}
          .admin-performances-table td:nth-child(1)::before{content:"Select"}.admin-performances-table td:nth-child(2)::before{content:"Poster"}.admin-performances-table td:nth-child(3)::before{content:"Title"}.admin-performances-table td:nth-child(4)::before{content:"Date"}.admin-performances-table td:nth-child(5)::before{content:"Venue"}.admin-performances-table td:nth-child(6)::before{content:"Company"}.admin-performances-table td:nth-child(7)::before{content:"Link"}.admin-performances-table td:nth-child(8)::before{content:"Public"}.admin-performances-table td:nth-child(9)::before{content:"Featured"}.admin-performances-table td:nth-child(10)::before{content:"Status"}.admin-performances-table td:nth-child(11)::before{content:"Order"}.admin-performances-table td:nth-child(12)::before{content:"Actions"}
          .admin-claims-history-table td:nth-child(1)::before{content:"Date"}.admin-claims-history-table td:nth-child(2)::before{content:"Company"}.admin-claims-history-table td:nth-child(3)::before{content:"Applicant"}.admin-claims-history-table td:nth-child(4)::before{content:"Status"}
          .admin-content [style*="position: fixed"]{padding:12px!important;max-width:100vw!important}
          .admin-content [style*="position: fixed"]>div{width:min(95vw,720px)!important;max-width:95vw!important;max-height:90dvh!important;overflow-y:auto!important}
          .admin-content form{max-width:100%}
        }      `}</style>
    </div>
  );
}
