import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "100px 24px", textAlign: "center" }}>
      <p className="mono" style={{ marginBottom: "12px" }}>404</p>
      <h1 className="display" style={{ fontSize: "2rem", marginBottom: "16px" }}>페이지를 찾을 수 없습니다.</h1>
      <Link href="/" style={{
        textDecoration: "none",
        border: "1px solid var(--ink)",
        color: "var(--ink)",
        padding: "10px 22px",
        fontSize: "0.85rem",
        display: "inline-block",
        marginTop: "12px",
      }}>
        홈으로 →
      </Link>
    </div>
  );
}
