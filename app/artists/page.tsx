import { Suspense } from "react";
import ArtistsClient from "./ArtistsClient";
import { LoadingSpinner } from "@/components/ui/States";

export const metadata = { title: "아티스트 — Piece of Cake" };

export default function ArtistsPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="아티스트 목록을 불러오는 중..." />}>
      <ArtistsClient />
    </Suspense>
  );
}
