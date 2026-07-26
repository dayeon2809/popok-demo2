import CompanyDiscoveryClient from "./CompanyDiscoveryClient";
import { getPublishedCompanies } from "@/lib/companies";
import { getViewerHeroState } from "@/lib/viewerState";

export const dynamic = "force-dynamic";
export const metadata = { title: "단체 탐색 — POPOK" };

export default async function CompaniesPage() {
  const [companies, viewer] = await Promise.all([
    getPublishedCompanies(),
    getViewerHeroState(),
  ]);
  return (
    <CompanyDiscoveryClient
      companies={companies}
      isLoggedIn={viewer.isLoggedIn}
      myArtistSlug={viewer.myArtistSlug}
    />
  );
}