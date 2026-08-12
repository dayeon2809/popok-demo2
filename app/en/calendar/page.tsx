import type { Metadata } from "next";
import { renderPerformancesPage } from "@/components/calendar/PerformancesPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Now in Performing Arts | POPOK",
  description: "Discover new performances, artists, and stories from the performing arts scene.",
};

export default async function EnglishCalendarPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) { return renderPerformancesPage("en", await searchParams); }
