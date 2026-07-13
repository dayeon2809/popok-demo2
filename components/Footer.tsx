import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      padding: "64px 32px 48px",
      background: "var(--bg-warm)",
    }}>
      <div style={{
        maxWidth: "1120px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "40px"
      }}>
        {/* Left column */}
        <div>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginBottom: "12px" }}>
            <div style={{ fontWeight: 900, fontSize: "1.3rem", color: "var(--navy)", letterSpacing: "-0.04em", display: "flex", alignItems: "center", gap: "2px" }}>
              POPOK
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--accent)" }} />
            </div>
          </Link>
          <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", fontWeight: 500 }}>
            Your work, connected.
          </p>
        </div>

        {/* Right column (links) */}
        <div style={{ display: "flex", gap: "60px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink)", fontWeight: 700, letterSpacing: "0.1em" }}>POPOK</span>
            <Link href="/about" style={{ textDecoration: "none", fontSize: "0.875rem", color: "var(--ink-muted)", fontWeight: 500 }}>About</Link>
            <Link href="/artists" style={{ textDecoration: "none", fontSize: "0.875rem", color: "var(--ink-muted)", fontWeight: 500 }}>Artists</Link>
            <Link href="/premium" style={{ textDecoration: "none", fontSize: "0.875rem", color: "var(--ink-muted)", fontWeight: 500 }}>Premium</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span className="mono" style={{ fontSize: "0.68rem", color: "var(--ink)", fontWeight: 700, letterSpacing: "0.1em" }}>Social</span>
            <a href="https://www.instagram.com/popok.official/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", fontSize: "0.875rem", color: "var(--ink-muted)", fontWeight: 500 }}>Instagram</a>
            <a href="mailto:contact@popok.kr" style={{ textDecoration: "none", fontSize: "0.875rem", color: "var(--ink-muted)", fontWeight: 500 }}>Contact</a>
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div style={{
        maxWidth: "1120px",
        margin: "40px auto 0",
        paddingTop: "24px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "0.75rem",
        color: "var(--ink-muted)",
        fontWeight: 500
      }}>
        <span>© 2026 POPOK</span>
        <span className="mono" style={{ fontSize: "0.65rem" }}>popok.kr</span>
      </div>
    </footer>
  );
}
