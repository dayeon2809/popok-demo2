import { notFound } from "next/navigation";
import {
  getPublishedCompanyById,
  getPublishedCompanyBySlug,
  getConnectedArtistsByCompanyId,
  getRelatedCompanies,
} from "@/lib/companies";
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

  // Fetch connected artists and related companies in parallel
  const [artists, relatedCompanies] = await Promise.all([
    getConnectedArtistsByCompanyId(company.id),
    getRelatedCompanies(company.id),
  ]);

  return (
    <CompanyClientView
      company={company}
      artists={artists}
      relatedCompanies={relatedCompanies}
    />
  );
}
