"use client";

export default function EnglishCalendarError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div role="alert" style={{ maxWidth: 720, margin: "80px auto", padding: "64px 24px", textAlign: "center" }}>
    <h1 style={{ color: "var(--navy)", fontSize: "2rem" }}>We couldn't load the performance magazine.</h1>
    <p style={{ color: "var(--ink-muted)" }}>Please try again in a moment.</p>
    <button type="button" onClick={reset} className="btn-lime" style={{ marginTop: 20, border: 0, borderRadius: 8, padding: "12px 18px", fontWeight: 850, cursor: "pointer" }}>Try again</button>
  </div>;
}
