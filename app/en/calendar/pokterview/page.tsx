import type { Metadata } from "next";
import PokterviewFeed from "@/components/calendar/PokterviewFeed";
import { getWeeklyStories } from "@/lib/instagram";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Pokterview | POPOK",
  description: "Stories told directly by the artists on stage.",
};

export default async function EnglishCalendarPokterviewPage() {
  const stories = await getWeeklyStories({ limit: 24, requireHashtag: "퐄터뷰" });
  return <PokterviewFeed locale="en" stories={stories} />;
}
