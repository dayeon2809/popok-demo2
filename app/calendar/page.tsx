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
  title: "지금, 공연예술계에서는 | POPOK",
  description: "새로운 공연과 아티스트, 공연예술계의 이야기를 만나보세요.",
};

function addDays(date: string, count: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

export default async function CalendarPage() {
  const today = getSeoulToday();
  const [performances, artists, companies, stories] = await Promise.all([
    getCalendarPerformances(today, addDays(today, 84)),
    getPublishedDatabaseArtists(),
    getPublishedCompanies(),
    getWeeklyStories({ limit: 5 }),
  ]);
  return <PerformanceMagazine locale="ko" performances={deduplicatePerformances(performances)} artists={artists} companies={companies} stories={stories} />;
}
