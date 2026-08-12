import { getPublishedArtists } from "@/lib/artists";
import { getPublishedCompanies } from "@/lib/companies";
import { getWeeklyStories } from "@/lib/instagram";
import { getViewerHeroState } from "@/lib/viewerState";
import { listPublicOpportunities } from "@/lib/opportunities/repository";
import HomeClientV2 from "./HomeClientV2";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [artists, companies, weeklyStories, viewer, opportunities] = await Promise.all([
    getPublishedArtists(),
    getPublishedCompanies(),
    getWeeklyStories(),
    getViewerHeroState(),
    listPublicOpportunities().catch((error) => {
      console.error("[home] opportunity stats query failed", error);
      return [];
    }),
  ]);

  return (
    <HomeClientV2
      initialArtists={artists}
      initialCompanies={companies}
      initialWeeklyStories={weeklyStories}
      isLoggedIn={viewer.isLoggedIn}
      myArtistSlug={viewer.myArtistSlug}
      opportunities={opportunities
        .filter((item: any) => item.lifecycle_status === "open" || item.lifecycle_status === "upcoming")
        .map((item: any) => ({ opportunityType: item.opportunity_type }))}
    />
  );
}

