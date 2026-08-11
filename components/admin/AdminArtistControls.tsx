"use client";
import { useState } from "react";
import Link from "next/link";
import AdminCompanyOwnerPanel from "@/components/admin/AdminCompanyOwnerPanel";

export default function AdminArtistControls({ artist, onUpdated }: { artist: { id: string; owner_id?: string | null; status?: string; slug?: string | null; claim_code?: string | null }; onUpdated: (patch: Record<string, unknown>) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const changeStatus = async () => {
    const status = artist.status === "published" ? "draft" : "published";
    setBusy(true); setMessage("");
    const response = await fetch("/api/admin/artists/" + artist.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok || !data.success) return setMessage(data.error || "공개 상태 변경에 실패했습니다.");
    onUpdated({ status }); setMessage(status === "published" ? "아티스트를 공개했습니다." : "아티스트를 draft로 전환했습니다.");
  };
  const regenerateClaim = async () => {
    if (artist.claim_code && !confirm("기존 claim code를 새 코드로 교체할까요?")) return;
    setBusy(true); setMessage("");
    const response = await fetch("/api/admin/artists/" + artist.id, { method: "POST" });
    const data = await response.json(); setBusy(false);
    if (!response.ok || !data.success) return setMessage(data.error || "claim code 생성에 실패했습니다.");
    onUpdated({ claim_code: data.claimCode }); setMessage("새 claim code를 생성했습니다.");
  };
  return <div style={{ display: "grid", gap: 16, marginBottom: 22 }}>
    <AdminCompanyOwnerPanel entityId={artist.id} entityType="artist" ownerId={artist.owner_id} onChanged={(owner_id) => onUpdated({ owner_id })} />
    <section style={{ border: "1px solid var(--border)", background: "#fff", padding: 20 }}>
      <p style={{ margin: 0, color: "#8AAE22", fontSize: 11, fontWeight: 900, letterSpacing: ".12em" }}>ADMIN ONLY</p>
      <h2 style={{ margin: "7px 0 14px", fontSize: 19 }}>공개 설정 및 Claim</h2>
      <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ padding: "8px 11px", background: artist.status === "published" ? "#E8F8EE" : "#F1F3F5", fontWeight: 850, fontSize: 13 }}>{artist.status === "published" ? "공개됨" : "draft"}</span>
        <button type="button" disabled={busy} onClick={changeStatus} style={buttonStyle}>{artist.status === "published" ? "비공개 전환" : "공개하기"}</button>
        {artist.slug && <Link href={"/artists/" + artist.slug} target="_blank" style={{ ...buttonStyle, textDecoration: "none" }}>공개 페이지 열기 ↗</Link>}
        <button type="button" disabled={busy} onClick={regenerateClaim} style={buttonStyle}>{artist.claim_code ? "claim code 재생성" : "claim code 생성"}</button>
      </div>
      <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--ink-muted)" }}>현재 claim code: <code>{artist.claim_code || "없음"}</code></p>
      {message && <p style={{ margin: "10px 0 0", fontSize: 13, fontWeight: 750 }}>{message}</p>}
    </section>
  </div>;
}
const buttonStyle: React.CSSProperties = { display: "inline-flex", padding: "9px 12px", border: "1px solid var(--navy)", background: "#fff", color: "var(--navy)", font: "inherit", fontSize: 13, fontWeight: 850, cursor: "pointer" };
