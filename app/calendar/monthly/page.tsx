import type { Metadata } from "next";
import MonthlyCalendar from "@/components/calendar/MonthlyCalendar";
import { buildMonthGrid } from "@/lib/monthGrid";
import { getCalendarPerformances } from "@/lib/performances";
import { deduplicatePerformances } from "@/lib/deduplicatePerformances";
import { getSeoulToday } from "@/lib/date";
import { isPublicPerformanceEligible } from "@/lib/performanceDiscovery";
import type { PerformanceGenre } from "@/lib/performanceDiscovery";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "월간 캘린더 | POPOK",
  description: "이번 달 공연을 날짜별로 한눈에 확인하세요.",
};

function resolveMonthStart(raw: string | undefined): string {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) return `${raw}-01`;
  return `${getSeoulToday().slice(0, 7)}-01`;
}

const genres = new Set<PerformanceGenre>(["all", "music", "dance", "theater", "musical", "traditional"]);

export default async function CalendarMonthlyPage({ searchParams }: { searchParams: Promise<{ month?: string; genre?: string }> }) {
  const { month, genre } = await searchParams;
  const monthStart = resolveMonthStart(month);
  const { gridStart, gridEnd } = buildMonthGrid(monthStart);
  const performances = await getCalendarPerformances(gridStart, gridEnd);
  return <MonthlyCalendar locale="ko" monthStart={monthStart} selectedGenre={genres.has(genre as PerformanceGenre) ? genre as PerformanceGenre : "all"} performances={deduplicatePerformances(performances).filter(isPublicPerformanceEligible)} />;
}
