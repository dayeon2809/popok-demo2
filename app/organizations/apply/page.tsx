import { Suspense } from "react";
import OrganizationApplyClient from "./OrganizationApplyClient";
import { LoadingSpinner } from "@/components/ui/States";

export const dynamic = "force-dynamic";

export default function OrganizationApplyPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="불러오는 중..." />}>
      <OrganizationApplyClient />
    </Suspense>
  );
}
