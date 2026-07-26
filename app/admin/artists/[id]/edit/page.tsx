"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingSpinner, ErrorMessage } from "@/components/ui/States";
import MyPopokClient from "@/app/my-popok/MyPopokClient";

interface OwnerProfile {
  display_name: string | null;
  email: string | null;
}

// Admin-override editor for a single artist's personal 포퐄. Reuses
// MyPopokClient (the exact same form the artist's own owner uses at
// /my-popok) in adminMode — see that component's adminMode prop doc for why
// this isn't a separate duplicated form. Saves go to PATCH
// /api/admin/artists/[id] (service-role write, no owner_id filter — an
// admin edit never touches owner_id, see lib/artist-profile.ts
// buildArtistUpdateFromPayload) instead of the self-serve POST /api/artists/me.
export default function AdminArtistEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const artistId = params.id;

  const [artist, setArtist] = useState<any | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authHeader = () => ({});

  const fetchArtist = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/artists/${artistId}`, { headers: authHeader() });
      const data = await res.json();
      if (res.ok && data.success) {
        setArtist(data.data);
        setOwnerProfile(data.ownerProfile || null);
      } else {
        setError(data.error || "아티스트 정보를 불러오지 못했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!artistId) return;
    fetchArtist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId]);

  if (loading) return <div style={{ padding: "60px 0" }}><LoadingSpinner message="아티스트 정보를 불러오는 중..." /></div>;
  if (error || !artist) return <div style={{ padding: "40px 0" }}><ErrorMessage message={error || "아티스트를 찾을 수 없습니다."} /></div>;

  const ownerStatusLabel = artist.owner_id
    ? `연결된 사용자 있음${ownerProfile?.display_name ? ` · ${ownerProfile.display_name}` : ""}`
    : "소유자 없는 프로필";

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <Link href="/admin/artists" style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--ink-muted)", textDecoration: "none" }}>
          ← 아티스트 목록으로
        </Link>
      </div>

      <MyPopokClient
        initialArtist={artist}
        adminMode
        saveEndpoint={`/api/admin/artists/${artistId}`}
        saveMethod="PATCH"
        saveHeaders={authHeader()}
        ownerStatusLabel={ownerStatusLabel}
      />
    </div>
  );
}
