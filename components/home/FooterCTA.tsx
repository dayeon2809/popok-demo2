"use client";

import Link from "next/link";

export default function FooterCTA() {
  return (
    <section className="home-section" style={{
      background: "var(--accent)",
      borderTop: "1px solid var(--navy)",
      borderBottom: "1px solid var(--navy)",
      padding: "100px 32px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background scattered cards illustration */}
      <div style={{
        position: "absolute",
        top: "10%",
        right: "10%",
        width: "400px",
        height: "350px",
        opacity: 0.1,
        zIndex: 0,
        pointerEvents: "none",
        display: "flex",
        gap: "20px",
        transform: "rotate(-12deg) scale(1.1)",
      }} className="header-nav-links">
        <div style={{ width: "120px", height: "180px", border: "2px solid var(--navy)", borderRadius: "8px", background: "#FFFFFF" }} />
        <div style={{ width: "120px", height: "180px", border: "2px solid var(--navy)", borderRadius: "8px", background: "var(--accent)", transform: "translateY(40px)" }} />
        <div style={{ width: "120px", height: "180px", border: "2px solid var(--navy)", borderRadius: "8px", background: "#FFFFFF", transform: "translateY(-20px)" }} />
      </div>

      <div style={{
        maxWidth: "1120px",
        margin: "0 auto",
        position: "relative",
        zIndex: 1
      }}>
        <h2 className="display" style={{
          fontSize: "clamp(2rem, 5vw, 3.6rem)",
          color: "var(--navy)",
          fontWeight: 950,
          lineHeight: 1.1,
          letterSpacing: "-0.04em",
          marginBottom: "20px",
          margin: 0
        }}>
          당신만의 포퐄을<br />만들어보세요.
        </h2>

        <p style={{
          fontSize: "clamp(1rem, 2vw, 1.25rem)",
          color: "var(--navy)",
          fontWeight: 700,
          lineHeight: 1.5,
          marginBottom: "36px",
          maxWidth: "600px",
          letterSpacing: "-0.02em",
          marginTop: "12px"
        }}>
          포퐄을 만들고,<br />하나의 링크로 당신을 보여주세요.
        </p>

        <Link href="/auth" style={{
          textDecoration: "none",
          background: "var(--navy)",
          color: "#FFFFFF",
          padding: "16px 36px",
          borderRadius: "999px",
          fontSize: "0.95rem",
          fontWeight: 800,
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          transition: "all 0.2s ease",
        }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(23, 20, 17, 0.2)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(23, 20, 17, 0.12)";
          }}>
          내 포퐄 만들기 <span style={{ fontSize: "1.1rem" }}>→</span>
        </Link>
      </div>
    </section>
  );
}
