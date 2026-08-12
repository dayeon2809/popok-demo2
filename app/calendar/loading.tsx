export default function CalendarLoading() {
  return <div aria-label="공연 매거진을 불러오는 중" aria-busy="true" style={{ maxWidth: 1240, margin: "0 auto", padding: "72px 24px 120px" }}>
    <div style={{ width: "42%", height: 14, background: "#ecece8", marginBottom: 24 }} />
    <div style={{ width: "78%", height: 72, background: "#e5e6e2", marginBottom: 36 }} />
    <div style={{ width: "100%", aspectRatio: "16 / 8", minHeight: 360, background: "#dedfdb" }} />
  </div>;
}
