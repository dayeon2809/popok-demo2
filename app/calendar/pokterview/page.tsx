import type { Metadata } from "next";
import PokterviewFeed from "@/components/calendar/PokterviewFeed";
import { getWeeklyStories } from "@/lib/instagram";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "퐄터뷰 | POPOK",
  description: "무대 위 예술가들이 직접 들려주는 이야기를 만나보세요.",
};

export default async function CalendarPokterviewPage() {
  const stories = await getWeeklyStories({ limit: 24, requireHashtag: "퐄터뷰" });
  return <PokterviewFeed locale="ko" stories={stories} />;
}
