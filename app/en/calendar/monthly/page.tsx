import type { Metadata } from "next";
import MonthlyCalendar, { buildMonthGrid } from "@/components/calendar/MonthlyCalendar";
import { getCalendarPerformances } from "@/lib/performances";
import { deduplicatePerformances } from "@/lib/deduplicatePerformances";
import { getSeoulToday } from "@/lib/date";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Monthly Calendar | POPOK",
  description: "See this month's performances at a glance, day by day.",
};

function resolveMonthStart(raw: string | undefined): string {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) return `${raw}-01`;
  return `${getSeoulToday().slice(0, 7)}-01`;
}

export default async function EnglishCalendarMonthlyPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const monthStart = resolveMonthStart(month);
  const { gridStart, gridEnd } = buildMonthGrid(monthStart);
  const performances = await getCalendarPerformances(gridStart, gridEnd);
  return <MonthlyCalendar locale="en" monthStart={monthStart} performances={deduplicatePerformances(performances)} />;
}
