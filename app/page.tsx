import { getPublishedArtists } from "@/lib/artists";
import { getUpcomingPerformances } from "@/lib/performances";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [artists, performances] = await Promise.all([
    getPublishedArtists(),
    getUpcomingPerformances(),
  ]);

  return <HomeClient initialArtists={artists} initialPerformances={performances} />;
}
