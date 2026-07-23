export const dynamic = "force-static";

// Placeholder for the monthly performance calendar linked from the
// homepage's "POPOK 아티스트의 공연" section — content to be filled in later.
export default function CalendarPage() {
  return (
    <section style={{
      maxWidth: "720px",
      margin: "0 auto",
      padding: "120px 32px",
      textAlign: "center",
    }}>
      <h1 className="display" style={{
        fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
        color: "var(--navy)",
        fontWeight: 950,
        letterSpacing: "-0.03em",
        margin: "0 0 16px",
      }}>
        월간 공연 일정
      </h1>
      <p style={{ fontSize: "0.95rem", color: "var(--ink-muted)", lineHeight: 1.6 }}>
        공연 캘린더를 준비 중입니다. 곧 만나보실 수 있어요.
      </p>
    </section>
  );
}
