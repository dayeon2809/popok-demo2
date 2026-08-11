"use client";

import { useState } from "react";
type UserResult = { id: string; email: string; name: string };
export default function AdminCompanyOwnerPanel({ companyId, entityId, entityType = "company", ownerId, onChanged }: { companyId?: string; entityId?: string; entityType?: "company" | "artist"; ownerId?: string | null; onChanged: (ownerId: string | null) => void }) {
  const targetId = entityId || companyId || "";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const search = async () => {
    if (query.trim().length < 2) return setMessage("이름 또는 이메일을 2자 이상 입력하세요.");
    setBusy(true); setMessage("");
    const response = await fetch("/api/admin/users?search=" + encodeURIComponent(query.trim()));
    const data = await response.json(); setBusy(false);
    if (!response.ok || !data.success) return setMessage(data.error || "사용자 검색에 실패했습니다.");
    setResults(data.data || []); if (!data.data?.length) setMessage("검색 결과가 없습니다.");
  };
  const changeOwner = async (nextOwnerId: string | null) => {
    if (ownerId && nextOwnerId && ownerId !== nextOwnerId && !confirm("기존 대표자를 새 사용자로 변경할까요?")) return;
    setBusy(true); setMessage("");
    const response = await fetch("/api/admin/" + (entityType === "company" ? "companies/" : "artists/") + targetId, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ owner_id: nextOwnerId }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok || !data.success) return setMessage(data.error || "대표자 변경에 실패했습니다.");
    onChanged(nextOwnerId); setResults([]); setQuery("");
    setMessage(data.representativeSync?.warning || (nextOwnerId ? "\uB300\uD45C\uC790\uC640 \uACF5\uAC1C \uB300\uD45C \uD504\uB85C\uD544\uC744 \uC5F0\uACB0\uD588\uC2B5\uB2C8\uB2E4." : "\uB300\uD45C\uC790 \uC5F0\uACB0\uC744 \uD574\uC81C\uD588\uC2B5\uB2C8\uB2E4."));
  };
  return <section style={{ border: "1px solid var(--border)", background: "#fff", padding: 20, marginBottom: 20 }}>
    <p style={{ margin: 0, color: "#8AAE22", fontSize: 11, fontWeight: 900, letterSpacing: ".12em" }}>ADMIN ONLY</p>
    <h2 style={{ margin: "7px 0 6px", fontSize: 19 }}>대표자 및 권한</h2>
    <p style={{ margin: "0 0 15px", color: "var(--ink-muted)", fontSize: 13 }}>현재 owner_id: <code>{ownerId || "연결 없음"}</code></p>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && search()} placeholder="사용자 이름 또는 이메일" style={{ flex: "1 1 240px", padding: "10px 12px", border: "1px solid var(--border-dark)", font: "inherit" }} />
      <button type="button" onClick={search} disabled={busy} style={buttonStyle}>검색</button>
      {ownerId && <button type="button" onClick={() => changeOwner(null)} disabled={busy} style={{ ...buttonStyle, color: "#B91C1C" }}>연결 해제</button>}
    </div>
    {message && <p style={{ fontSize: 13, margin: "10px 0 0" }}>{message}</p>}
    {results.length > 0 && <div style={{ display: "grid", gap: 7, marginTop: 12 }}>{results.map((user) => <button type="button" key={user.id} onClick={() => changeOwner(user.id)} style={{ ...buttonStyle, textAlign: "left", background: "#fff" }}><strong>{user.name || "이름 없음"}</strong> · {user.email}</button>)}</div>}
  </section>;
}
const buttonStyle: React.CSSProperties = { padding: "10px 13px", border: "1px solid var(--border-dark)", background: "#fff", color: "var(--navy)", font: "inherit", fontWeight: 800, cursor: "pointer" };
