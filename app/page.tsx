import { getPublishedArtists } from "@/lib/artists";
import { getUpcomingPerformances } from "@/lib/performances";
import { getPublishedCompanies } from "@/lib/companies";
import { getWeeklyStories } from "@/lib/instagram";
import { getViewerHeroState } from "@/lib/viewerState";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [artists, performances, companies, weeklyStories, viewer] = await Promise.all([
    getPublishedArtists(),
    getUpcomingPerformances(14),
    getPublishedCompanies(),
    getWeeklyStories(),
    getViewerHeroState(),
  ]);

  return (
    <HomeClient
      initialArtists={artists}
      initialPerformances={performances}
      initialCompanies={companies}
      initialWeeklyStories={weeklyStories}
      isLoggedIn={viewer.isLoggedIn}
      myArtistSlug={viewer.myArtistSlug}
    />
  );
}
