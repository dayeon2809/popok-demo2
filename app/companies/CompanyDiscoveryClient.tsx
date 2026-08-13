"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Company } from "@/types";
import { buildRealFeedItems, padWithPlaceholders } from "@/lib/homeFeedPrototype";
import HomeVisualFeed from "@/components/home/HomeVisualFeed";
import CompanyDiscoveryPrototype from "@/components/company/CompanyDiscoveryPrototype";
import FAQSection from "@/components/FAQSection";

const FEED_DENSITY_TARGET = 48;

// Same top-level field categories as the Artists tab (app/HomeClientV2.tsx) —
// ALL/DANCE/MUSIC/VISUAL. Company has no normalized `field` column the way
// Artist does (see lib/artists.ts mapArtistRowToArtist), so classify from the
// free-text genre/category fields via keyword match instead.
const FIELD_OPTIONS = [
  { key: "dance", label: "DANCE" },
  { key: "music", label: "MUSIC" },
  { key: "visual", label: "VISUAL" },
  { key: "actor", label: "ACTOR" },
];

function classifyCompanyField(company: Company): string | null {
  const text = `${company.genre || ""} ${company.category || ""}`.toLowerCase();
  if (!text.trim()) return null;
  if (/배우|연기|연극|뮤지컬|극단|actor|acting|theatre|theater|musical/.test(text)) return "actor";
  if (/무용|발레|ballet|dance|안무/.test(text)) return "dance";
  if (/음악|합주|오케스트라|orchestra|밴드|band|music|연주/.test(text)) return "music";
  if (/미술|시각|설치|사진|media|visual|art|photo/.test(text)) return "visual";
  return null;
}

interface CompanyDiscoveryClientProps {
  companies: Company[];
  isLoggedIn: boolean;
  myArtistSlug: string | null;
}

export default function CompanyDiscoveryClient({
  companies,
  isLoggedIn,
}: CompanyDiscoveryClientProps) {
  const router = useRouter();
  const showDraft = process.env.NEXT_PUBLIC_SHOW_DRAFT_ARTISTS === "true";
  const [selectedField, setSelectedField] = useState("all");

  const handleUploadClick = () => {
    const uploadPath = "/my-popok?upload=1";
    router.push(isLoggedIn ? uploadPath : "/onboarding");
  };

  const publishedCompanies = useMemo(
    () => companies.filter((c) => showDraft || c.status === "published" || !c.status),
    [companies, showDraft]
  );

  const feedItems = useMemo(() => {
    const fieldFiltered = selectedField === "all"
      ? publishedCompanies
      : publishedCompanies.filter((c) => classifyCompanyField(c) === selectedField);
    // Show only companies on the group explore page
    const real = buildRealFeedItems([], fieldFiltered);
    return padWithPlaceholders(real, FEED_DENSITY_TARGET);
  }, [publishedCompanies, selectedField]);

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh" }}>
      <div style={{ padding: "28px 16px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* 아티스트 / 단체 토글 버튼 */}
        <div className="discovery-toggle-container">
          <Link href="/" className="discovery-toggle-btn">
            아티스트
          </Link>
          <Link href="/companies" className="discovery-toggle-btn active">
            단체
          </Link>
        </div>
        <CompanyDiscoveryPrototype companies={companies} />

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginTop: "16px" }}>
          <button
            type="button"
            onClick={() => setSelectedField("all")}
            style={{
              padding: "7px 14px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
              border: selectedField === "all" ? "1.5px solid var(--navy)" : "1.5px solid var(--border)",
              background: selectedField === "all" ? "var(--navy)" : "#FFFFFF",
              color: selectedField === "all" ? "#FFFFFF" : "var(--ink-muted)",
            }}
          >
            ALL
          </button>
          {FIELD_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSelectedField(opt.key)}
              style={{
                padding: "7px 14px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                border: selectedField === opt.key ? "1.5px solid var(--navy)" : "1.5px solid var(--border)",
                background: selectedField === opt.key ? "var(--navy)" : "#FFFFFF",
                color: selectedField === opt.key ? "#FFFFFF" : "var(--ink-muted)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <HomeVisualFeed items={feedItems} />

      {/* "작업 올리기" — floating button */}
      <button
        type="button"
        onClick={handleUploadClick}
        className="btn-lime"
        style={{
          position: "fixed", right: "20px", bottom: "20px", zIndex: 50,
          padding: "14px 22px", borderRadius: "999px", border: "none",
          fontSize: "0.88rem", fontWeight: 850, cursor: "pointer",
          boxShadow: "0 8px 24px rgba(23,20,17,0.2)",
        }}
      >
        📸 작업 올리기
      </button>

      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <FAQSection />
      </div>
    </div>
  );
}
