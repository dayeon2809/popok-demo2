import { notFound } from "next/navigation";
import {
  getPublishedCompanyById,
  getPublishedCompanyBySlug,
  getConnectedArtistsByCompanyId,
  getRelatedCompanies,
} from "@/lib/companies";
import { getUpcomingPerformancesByCompanyId } from "@/lib/performances";
import CompanyClientView from "./CompanyClientView";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CompanyDetailPage({
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

  // Fetch connected artists, related companies, and upcoming performances in parallel
  const [fetchedArtists, relatedCompanies, upcomingPerformances] = await Promise.all([
    getConnectedArtistsByCompanyId(company.id),
    getRelatedCompanies(company.id),
    getUpcomingPerformancesByCompanyId(company.id),
  ]);

  // Mockup: 공원(GONGWON) — add placeholder "연결 아티스트" cards for design/demo
  // purposes only, alongside whatever real artist_companies rows already exist.
  const mockArtists =
    company.slug === "gongwon"
      ? [
          { id: "mock-ahn-seyoung", name: "안세영", name_en: "Ahn Se-young", profile_image_url: null, slug: null, role: "소속 아티스트", is_current: true, is_primary: false },
          { id: "mock-baek-seohyun", name: "백서현", name_en: "Baek Seo-hyun", profile_image_url: null, slug: null, role: "소속 아티스트", is_current: true, is_primary: false },
          { id: "mock-lee-changmin", name: "이창민", name_en: "Lee Chang-min", profile_image_url: null, slug: null, role: "소속 아티스트", is_current: true, is_primary: false },
        ]
      : [];
  const artists = [...fetchedArtists, ...mockArtists];

  return (
    <CompanyClientView
      company={company}
      artists={artists}
      relatedCompanies={relatedCompanies}
      upcomingPerformances={upcomingPerformances}
    />
  );
}
