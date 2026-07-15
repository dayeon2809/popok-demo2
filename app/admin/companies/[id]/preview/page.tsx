"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";

interface ConnectedArtist {
  relationId: string;
  role: string | null;
  artist: { id: string; name: string; slug: string | null; profileImage: string | null } | null;
}

interface CompanyPreview {
  id: string;
  name: string;
  name_en: string | null;
  status: "draft" | "published" | "archived";
  genre: string | null;
  city_or_region: string | null;
  bio_short: string | null;
  bio: string | null;
  profile_image_url: string | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
  current_activity: string[];
  connectedArtists: ConnectedArtist[];
}

// Admin-only preview of a company's public card — NOT the real /companies/[slug]
// detail page (that stays a placeholder). This exists purely so an admin can
// see roughly what a draft will look like before publishing it, reusing the
// existing sessionStorage admin-passcode gate (app/admin/layout.tsx) instead
// of inventing a new auth mechanism for the public route.
export default function AdminCompanyPreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const companyId = params.id;

  const [company, setCompany] = useState<CompanyPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const authHeader = () => ({ "x-admin-passcode": sessionStorage.getItem("admin_passcode") || "" });

  const fetchCompany = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok && data.success) {
        setCompany({ ...data.data, current_activity: Array.isArray(data.data.current_activity) ? data.data.current_activity : [] });
      } else {
        setError(data.error || "단체 정보를 불러오지 못했습니다.");
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/publish`, { method: "POST", headers: authHeader() });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "공개 처리에 실패했습니다.");
        return;
      }
      await fetchCompany();
    } catch (err) {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div style={{ padding: "60px 0" }}><LoadingSpinner message="미리보기를 불러오는 중..." /></div>;
  if (error || !company) return <div style={{ padding: "40px 0" }}><ErrorMessage message={error || "단체를 찾을 수 없습니다."} /></div>;

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      {company.status !== "published" && (
        <div style={{
          background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: "10px",
          padding: "12px 16px", marginBottom: "20px", display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: "10px",
        }}>
          <div>
            <div style={{ fontWeight: 800, color: "#92400E", fontSize: "0.82rem" }}>DRAFT PREVIEW</div>
            <div style={{ fontSize: "0.78rem", color: "#92400E" }}>이 페이지는 아직 공개되지 않았습니다.</div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link href={`/admin/companies/${companyId}`} style={btnOutlineStyle}>편집으로 돌아가기</Link>
            <button onClick={handlePublish} disabled={publishing} style={btnPrimaryStyle}>
              {publishing ? "공개 중..." : "공개하기"}
            </button>
            <Link href="/admin/companies" style={btnOutlineStyle}>단체 목록으로</Link>
          </div>
        </div>
      )}

      <div style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "20px", overflow: "hidden", boxShadow: "0 8px 30px rgba(23,20,17,0.04)" }}>
        <div style={{ width: "100%", aspectRatio: "16 / 9", background: "var(--bg-warm)" }}>
          <img
            src={company.profile_image_url || "/images/placeholders/cake-placeholder.png"}
            alt={company.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <div style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--navy)", margin: 0 }}>{company.name}</h1>
            {company.name_en && <span className="mono" style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>{company.name_en}</span>}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--ink-muted)", marginTop: "4px" }}>
            {[company.genre, company.city_or_region].filter(Boolean).join(" · ")}
          </div>

          {company.bio_short && (
            <p style={{ fontSize: "0.9rem", color: "var(--navy)", fontWeight: 700, marginTop: "16px" }}>{company.bio_short}</p>
          )}
          {company.bio && (
            <p style={{ fontSize: "0.85rem", color: "var(--ink-muted)", lineHeight: 1.6, marginTop: "8px", whiteSpace: "pre-line" }}>{company.bio}</p>
          )}

          {(company.email || company.instagram || company.website) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "16px", fontSize: "0.82rem" }}>
              {company.instagram && <span>📷 {company.instagram}</span>}
              {company.website && <span>🔗 {company.website}</span>}
              {company.email && <span>✉️ {company.email}</span>}
            </div>
          )}

          {company.current_activity.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <span className="mono" style={{ fontSize: "0.62rem", color: "var(--accent-dark)", fontWeight: 800 }}>CURRENT</span>
              <p style={{ fontSize: "0.82rem", color: "var(--navy)", marginTop: "4px" }}>{company.current_activity.join(" · ")}</p>
            </div>
          )}

          {company.connectedArtists.length > 0 && (
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--ink-faint)", textTransform: "uppercase" }}>연결된 아티스트</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                {company.connectedArtists.map((rel) => (
                  <div key={rel.relationId} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <img
                      src={rel.artist?.profileImage || "/images/placeholders/cake-placeholder.png"}
                      alt=""
                      style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)" }}>{rel.artist?.name}</span>
                    {rel.role && <span style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>· {rel.role}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const btnPrimaryStyle: React.CSSProperties = {
  padding: "8px 14px", background: "var(--navy)", color: "#fff", border: "none",
  borderRadius: "8px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};

const btnOutlineStyle: React.CSSProperties = {
  padding: "8px 14px", background: "#fff", color: "var(--navy)", border: "1.5px solid var(--border-dark)",
  borderRadius: "8px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  textDecoration: "none", display: "inline-flex", alignItems: "center",
};
