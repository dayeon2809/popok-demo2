import { getPublishedArtists } from "@/lib/artists";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const artists = await getPublishedArtists();
  return <HomeClient initialArtists={artists} />;
}
