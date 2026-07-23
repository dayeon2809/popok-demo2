// New "opportunities" section below the performance carousel. Only one
// category (오디션 공고) exists so far and it has no real content yet —
// shown as a coming-soon placeholder until postings are wired up.
export default function OpportunitiesSection() {
  return (
    <section className="home-section" style={{
      maxWidth: "1120px",
      margin: "0 auto",
      padding: "60px 32px",
      borderTop: "1px solid var(--border)",
    }}>
      <div style={{ marginBottom: "20px" }}>
        <h2 className="display" style={{
          fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
          color: "var(--navy)",
          fontWeight: 950,
          letterSpacing: "-0.03em",
          margin: 0
        }}>
          🎁 POPOK&apos;s Opportunity
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "6px", fontWeight: 700 }}>
          예술인들을 위한 다양한 기회를 만나보세요.
        </p>
      </div>

      <p style={{ fontSize: "0.8rem", color: "var(--ink-faint)", fontWeight: 700 }}>
        🎤 오디션 공고 — 준비 중입니다.
      </p>
    </section>
  );
}
