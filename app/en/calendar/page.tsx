import type { Metadata } from "next";
import PerformanceMagazine from "@/components/calendar/PerformanceMagazine";
import { getCalendarPerformances } from "@/lib/performances";
import { getPublishedDatabaseArtists } from "@/lib/artists";
import { getPublishedCompanies } from "@/lib/companies";
import { getWeeklyStories } from "@/lib/instagram";
import { deduplicatePerformances } from "@/lib/deduplicatePerformances";
import { getSeoulToday } from "@/lib/date";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Now in Performing Arts | POPOK",
  description: "Discover new performances, artists, and stories from the performing arts scene.",
};

function addDays(date: string, count: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

export default async function EnglishCalendarPage() {
  const today = getSeoulToday();
  const [performances, artists, companies, stories] = await Promise.all([
    getCalendarPerformances(today, addDays(today, 84)),
    getPublishedDatabaseArtists(),
    getPublishedCompanies(),
    getWeeklyStories({ limit: 5 }),
  ]);
  return <PerformanceMagazine locale="en" performances={deduplicatePerformances(performances)} artists={artists} companies={companies} stories={stories} />;
}
