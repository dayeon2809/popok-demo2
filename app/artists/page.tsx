import { Suspense } from "react";
import ArtistsClient from "./ArtistsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "아티스트 — POPOK" };

export default function ArtistsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "80px 20px", textAlign: "center", color: "var(--ink-muted)" }}>아티스트 목록을 불러오는 중...</div>}>
      <ArtistsClient />
    </Suspense>
  );
}
