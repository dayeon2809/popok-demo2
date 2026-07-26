"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Company } from "@/types";
import { buildRealFeedItems, padWithPlaceholders } from "@/lib/homeFeedPrototype";
import HomeVisualFeed from "@/components/home/HomeVisualFeed";
import CompanyDiscoveryPrototype from "@/components/company/CompanyDiscoveryPrototype";
import FAQSection from "@/components/FAQSection";

const FEED_DENSITY_TARGET = 48;

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

  const handleUploadClick = () => {
    const uploadPath = "/my-popok?upload=1";
    router.push(isLoggedIn ? uploadPath : `/auth?redirect=${encodeURIComponent(uploadPath)}`);
  };

  const feedItems = useMemo(() => {
    const publishedCompanies = companies.filter(
      (c) => showDraft || c.status === "published" || !c.status
    );
    // Show only companies on the group explore page
    const real = buildRealFeedItems([], publishedCompanies);
    return padWithPlaceholders(real, FEED_DENSITY_TARGET);
  }, [companies, showDraft]);

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
