import ArtistDiscoveryClient from "./ArtistDiscoveryClient";
import { getPublishedArtists } from "@/lib/artists";

export const dynamic = "force-dynamic";
export const metadata = { title: "아티스트 탐색 — POPOK" };

export default async function ArtistsPage() {
  const artists = await getPublishedArtists();
  return <ArtistDiscoveryClient artists={artists} />;
}