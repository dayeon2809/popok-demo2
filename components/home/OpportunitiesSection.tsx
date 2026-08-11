import Link from "next/link";

export default function OpportunitiesSection() {
  return (
    <section className="home-section" style={{ maxWidth: 1120, margin: "0 auto", padding: "52px 32px", borderTop: "1px solid var(--border)" }}>
      <div style={{ padding: 26, border: "1px solid var(--border)", borderRadius: 18, background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: "0 0 7px", color: "var(--accent)", fontWeight: 900, fontSize: ".7rem", letterSpacing: ".12em" }}>POPOK OPPORTUNITIES</p>
          <h2 style={{ margin: 0, fontSize: "clamp(1.35rem,3vw,1.9rem)", letterSpacing: "-.035em" }}>오늘 올라온 기회</h2>
          <p style={{ margin: "9px 0 0", color: "rgba(255,255,255,.68)", fontSize: ".82rem", fontWeight: 700 }}>오디션 12 · 협업 9 · 지원사업 7 <small style={{ opacity: .65 }}>(예시 데이터)</small></p>
        </div>
        <Link href="/opportunities" className="btn-lime" style={{ minHeight: 44, padding: "0 18px", borderRadius: 11, display: "inline-flex", alignItems: "center", color: "var(--navy)", textDecoration: "none", fontSize: ".82rem", fontWeight: 850 }}>기회 전체보기 →</Link>
      </div>
    </section>
  );
}