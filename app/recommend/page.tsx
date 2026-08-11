import { getPublishedArtists } from "@/lib/artists";
import RecommendClient from "./RecommendClient";

export const dynamic = "force-dynamic";

export default async function RecommendPage() {
  const artists = await getPublishedArtists();
  return <RecommendClient initialArtists={artists as any} />;
}
