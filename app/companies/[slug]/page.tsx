import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedCompanyById, getPublishedCompanyBySlug } from "@/lib/companies";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Deliberately minimal — the real company detail page (ABOUT US, members,
// company works, timeline) is a separate, not-yet-designed effort. This
// just keeps a company card's link from 404ing.
export default async function CompanyDetailPlaceholderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug).trim();

  const company = UUID_RE.test(decoded)
    ? await getPublishedCompanyById(decoded)
    : await getPublishedCompanyBySlug(decoded);

  if (!company) {
    notFound();
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "24px" }}>
      <div className="card fade-up" style={{
        maxWidth: "480px",
        width: "100%",
        padding: "48px 32px",
        textAlign: "center",
        border: "1.5px solid var(--border)",
        background: "#FFFFFF",
        borderRadius: "20px",
        boxShadow: "0 8px 30px rgba(23, 20, 17, 0.04)",
      }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--navy)", marginBottom: "12px", overflowWrap: "break-word" }}>
          {company.name}
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--ink-muted)", lineHeight: 1.6, marginBottom: "28px" }}>
          단체 상세 페이지를 준비하고 있습니다.<br />
          곧 작품과 활동 기록을 만나보실 수 있습니다.
        </p>
        <Link
          href="/companies"
          style={{
            display: "inline-block",
            textDecoration: "none",
            fontSize: "0.88rem",
            fontWeight: 800,
            color: "var(--navy)",
            borderBottom: "1.5px solid var(--navy)",
            paddingBottom: "2px",
          }}
        >
          전체 단체 보기 →
        </Link>
      </div>
    </div>
  );
}
