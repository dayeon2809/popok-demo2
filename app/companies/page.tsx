import CompanyDiscoveryClient from "./CompanyDiscoveryClient";
import { getPublishedCompanies } from "@/lib/companies";

export const dynamic = "force-dynamic";
export const metadata = { title: "단체 탐색 — POPOK" };

export default async function CompaniesPage() {
  const companies = await getPublishedCompanies();
  return <CompanyDiscoveryClient companies={companies} />;
}