import { getPublishedArtists } from "@/lib/artists";
import { getUpcomingPerformances } from "@/lib/performances";
import { getPublishedCompanies } from "@/lib/companies";
import { getWeeklyStories, isInstagramConfigured } from "@/lib/instagram";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [artists, performances, companies, weeklyStories] = await Promise.all([
    getPublishedArtists(),
    getUpcomingPerformances(),
    getPublishedCompanies(),
    getWeeklyStories(),
  ]);

  return (
    <HomeClient
      initialArtists={artists}
      initialPerformances={performances}
      initialCompanies={companies}
      initialWeeklyStories={weeklyStories}
      instagramConfigured={isInstagramConfigured()}
    />
  );
}
