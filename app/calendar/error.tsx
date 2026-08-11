"use client";

export default function CalendarError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div role="alert" style={{ maxWidth: 720, margin: "80px auto", padding: "64px 24px", textAlign: "center" }}>
    <h1 style={{ color: "var(--navy)", fontSize: "2rem" }}>공연 매거진을 불러오지 못했습니다.</h1>
    <p style={{ color: "var(--ink-muted)" }}>잠시 후 다시 시도해 주세요.</p>
    <button type="button" onClick={reset} className="btn-lime" style={{ marginTop: 20, border: 0, borderRadius: 8, padding: "12px 18px", fontWeight: 850, cursor: "pointer" }}>다시 시도</button>
  </div>;
}
