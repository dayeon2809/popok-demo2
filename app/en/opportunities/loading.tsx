export default function EnglishOpportunitiesLoading() {
  return <div aria-label="Loading opportunities" aria-busy="true">
    <div style={{ background: "var(--navy)", padding: "76px 24px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ width: 160, height: 12, background: "rgba(255,255,255,.16)", marginBottom: 22 }} />
        <div style={{ width: "62%", height: 48, background: "rgba(255,255,255,.14)", marginBottom: 14 }} />
        <div style={{ width: "40%", height: 48, background: "rgba(255,255,255,.14)" }} />
      </div>
    </div>
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 14 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ height: 260, background: "#F5F1E8", border: "1px solid var(--border)", borderRadius: 16 }} />
        ))}
      </div>
    </div>
  </div>;
}
