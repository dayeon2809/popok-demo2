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

function humanizeGenre(genre: string): string {
  return genre
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
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
  const [selectedGenre, setSelectedGenre] = useState("all");

  const handleUploadClick = () => {
    const uploadPath = "/my-popok?upload=1";
    router.push(isLoggedIn ? uploadPath : `/auth?redirect=${encodeURIComponent(uploadPath)}`);
  };

  const publishedCompanies = useMemo(
    () => companies.filter((c) => showDraft || c.status === "published" || !c.status),
    [companies, showDraft]
  );

  // Distinct genres present in the current published companies, for the
  // genre filter pills below — derived from data rather than a fixed enum
  // since company.genre is a free-text field (see lib/companies.ts).
  const genreOptions = useMemo(() => {
    const genres = new Set<string>();
    publishedCompanies.forEach((c) => { if (c.genre) genres.add(c.genre); });
    return Array.from(genres).sort();
  }, [publishedCompanies]);

  const feedItems = useMemo(() => {
    const genreFiltered = selectedGenre === "all"
      ? publishedCompanies
      : publishedCompanies.filter((c) => c.genre === selectedGenre);
    // Show only companies on the group explore page
    const real = buildRealFeedItems([], genreFiltered);
    return padWithPlaceholders(real, FEED_DENSITY_TARGET);
  }, [publishedCompanies, selectedGenre]);

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

        {genreOptions.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginTop: "16px" }}>
            <button
              type="button"
              onClick={() => setSelectedGenre("all")}
              style={{
                padding: "7px 14px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                border: selectedGenre === "all" ? "1.5px solid var(--navy)" : "1.5px solid var(--border)",
                background: selectedGenre === "all" ? "var(--navy)" : "#FFFFFF",
                color: selectedGenre === "all" ? "#FFFFFF" : "var(--ink-muted)",
              }}
            >
              전체
            </button>
            {genreOptions.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                style={{
                  padding: "7px 14px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                  border: selectedGenre === genre ? "1.5px solid var(--navy)" : "1.5px solid var(--border)",
                  background: selectedGenre === genre ? "var(--navy)" : "#FFFFFF",
                  color: selectedGenre === genre ? "#FFFFFF" : "var(--ink-muted)",
                }}
              >
                {humanizeGenre(genre)}
              </button>
            ))}
          </div>
        )}
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
