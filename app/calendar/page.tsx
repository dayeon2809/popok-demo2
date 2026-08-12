import type { Metadata } from "next";
import { renderPerformancesPage } from "@/components/calendar/PerformancesPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "지금, 공연예술계에서는 | POPOK",
  description: "새로운 공연과 아티스트, 공연예술계의 이야기를 만나보세요.",
};

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) { return renderPerformancesPage("ko", await searchParams); }
