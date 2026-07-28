import CompaniesClient from "./CompaniesClient";
import { getPublishedCompanies } from "@/lib/companies";

export const dynamic = "force-dynamic";
export const metadata = { title: "단체 — POPOK" };

export default async function CompaniesPage() {
  const companies = await getPublishedCompanies();
  return <CompaniesClient companies={companies} />;
}
