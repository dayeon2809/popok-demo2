"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewAdminCompanyPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", name_en: "", slug: "", genre: "", category: "", city_or_region: "", bio_short: "", profile_image_url: "", website: "", instagram: "", email: "", owner_id: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "단체 생성에 실패했습니다.");
      router.push(`/admin/companies/${data.data.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "단체 생성에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof form, label: string, required = false) => (
    <label style={{ display: "grid", gap: 7 }}>
      <span style={{ fontWeight: 800, fontSize: 13 }}>{label}{required ? " *" : ""}</span>
      <input required={required} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} style={inputStyle} />
    </label>
  );

  return (
    <main style={{ maxWidth: 860, margin: "0 auto" }}>
      <Link href="/admin/companies" style={{ color: "var(--ink-muted)", fontSize: 13 }}>← 단체 목록</Link>
      <div style={{ margin: "24px 0 30px" }}>
        <p style={{ color: "#8AAE22", fontWeight: 900, letterSpacing: ".12em", fontSize: 12 }}>NEW COMPANY</p>
        <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", margin: "8px 0" }}>새 단체 만들기</h1>
        <p style={{ color: "var(--ink-muted)" }}>초안 상태로 생성한 뒤 공통 단체 편집기에서 상세 정보를 완성할 수 있습니다.</p>
      </div>
      <form onSubmit={submit} style={{ border: "1px solid var(--border)", background: "#fff", padding: "clamp(20px, 4vw, 40px)", display: "grid", gap: 22 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
          {field("name", "단체명", true)}
          {field("name_en", "영문명")}
          {field("slug", "공개 URL slug", true)}
          {field("genre", "장르")}
          {field("category", "분류")}
          {field("city_or_region", "활동 지역")}
          {field("profile_image_url", "대표 이미지 URL")}
          {field("website", "홈페이지")}
          {field("instagram", "인스타그램")}
          {field("email", "이메일")}
          {field("owner_id", "대표자 user ID (선택)")}
        </div>
        <label style={{ display: "grid", gap: 7 }}>
          <span style={{ fontWeight: 800, fontSize: 13 }}>짧은 소개</span>
          <textarea value={form.bio_short} onChange={(event) => setForm({ ...form, bio_short: event.target.value })} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
        </label>
        {error && <p role="alert" style={{ color: "#B91C1C", fontWeight: 700 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Link href="/admin/companies" style={{ ...buttonStyle, textDecoration: "none", background: "#fff" }}>취소</Link>
          <button disabled={saving} style={{ ...buttonStyle, background: "var(--accent)", borderColor: "var(--accent)", cursor: saving ? "wait" : "pointer" }}>{saving ? "생성 중…" : "초안 생성"}</button>
        </div>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid var(--border-dark)", padding: "12px 14px", font: "inherit", background: "#fff" };
const buttonStyle: React.CSSProperties = { border: "1px solid var(--navy)", color: "var(--navy)", padding: "11px 18px", fontWeight: 800, font: "inherit" };
