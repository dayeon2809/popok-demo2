"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function NewAdminArtistPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", name_en: "", slug: "", genre: "", bio_short: "", profile_image_url: "", email: "", instagram: "", website: "" });
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value, ...(key === "name_en" && !slugTouched ? { slug: slugify(value) } : {}) }));
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/admin/artists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "아티스트 생성에 실패했습니다.");
      router.push("/admin/artists/" + data.data.id);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "아티스트 생성에 실패했습니다."); }
    finally { setSaving(false); }
  };
  const field = (key: keyof typeof form, label: string, required = false) => <label style={{ display: "grid", gap: 7 }}><span style={{ fontSize: 13, fontWeight: 850 }}>{label}{required ? " *" : ""}</span><input required={required} value={form[key]} onChange={(event) => { if (key === "slug") setSlugTouched(true); update(key, event.target.value); }} style={inputStyle} /></label>;
  return <main style={{ maxWidth: 860, margin: "0 auto" }}>
    <Link href="/admin/artists" style={{ color: "var(--ink-muted)", fontSize: 13 }}>← 아티스트 목록</Link>
    <header style={{ margin: "24px 0 30px" }}><p style={{ color: "#8AAE22", fontWeight: 900, letterSpacing: ".12em", fontSize: 12 }}>NEW ARTIST</p><h1 style={{ fontSize: "clamp(28px,4vw,44px)", margin: "8px 0" }}>신규 아티스트 생성</h1><p style={{ color: "var(--ink-muted)" }}>소유자 없이 draft로 생성되며, 생성 후 공용 편집기에서 작품과 이력을 추가할 수 있습니다.</p></header>
    <form onSubmit={submit} style={{ border: "1px solid var(--border)", background: "#fff", padding: "clamp(20px,4vw,40px)", display: "grid", gap: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18 }}>
        {field("name", "이름", true)}{field("name_en", "영문명")}{field("slug", "공개 URL slug", true)}{field("genre", "장르")}{field("profile_image_url", "대표 이미지 URL")}{field("email", "이메일")}{field("instagram", "인스타그램")}{field("website", "웹사이트")}
      </div>
      <label style={{ display: "grid", gap: 7 }}><span style={{ fontSize: 13, fontWeight: 850 }}>짧은 소개</span><textarea value={form.bio_short} onChange={(event) => update("bio_short", event.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical" }} /></label>
      <div style={{ padding: 13, background: "#F7F8F2", border: "1px solid var(--border)", fontSize: 13 }}><strong>공개 상태:</strong> draft · <strong>대표자:</strong> 연결 없음 · <strong>claim code:</strong> 자동 생성</div>
      {error && <p role="alert" style={{ color: "#B91C1C", fontWeight: 750 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}><Link href="/admin/artists" style={{ ...buttonStyle, textDecoration: "none" }}>취소</Link><button disabled={saving} style={{ ...buttonStyle, background: "var(--accent)", borderColor: "var(--accent)", cursor: saving ? "wait" : "pointer" }}>{saving ? "생성 중…" : "draft 생성"}</button></div>
    </form>
  </main>;
}
const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", border: "1px solid var(--border-dark)", background: "#fff", font: "inherit" };
const buttonStyle: React.CSSProperties = { padding: "11px 18px", border: "1px solid var(--navy)", background: "#fff", color: "var(--navy)", font: "inherit", fontWeight: 850 };
