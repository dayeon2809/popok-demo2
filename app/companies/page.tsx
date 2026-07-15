import { Suspense } from "react";
import CompaniesClient from "./CompaniesClient";
import { LoadingSpinner } from "@/components/ui/States";
import { getPublishedCompanies } from "@/lib/companies";

export const dynamic = "force-dynamic";
export const metadata = { title: "단체 — POPOK" };

export default async function CompaniesPage() {
  const companies = await getPublishedCompanies();

  return (
    <Suspense fallback={<LoadingSpinner message="단체 목록을 불러오는 중..." />}>
      <CompaniesClient companies={companies} />
    </Suspense>
  );
}
