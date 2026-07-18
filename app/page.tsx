import { getPublishedArtists } from "@/lib/artists";
import { getUpcomingPerformances } from "@/lib/performances";
import { getPublishedCompanies } from "@/lib/companies";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [artists, performances, companies] = await Promise.all([
    getPublishedArtists(),
    getUpcomingPerformances(),
    getPublishedCompanies(),
  ]);

  return (
    <HomeClient
      initialArtists={artists}
      initialPerformances={performances}
      initialCompanies={companies}
    />
  );
}
