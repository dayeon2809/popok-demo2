import type { Metadata } from "next";
import { renderPerformancesPage } from "@/components/calendar/PerformancesPage";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title:"공연 | POPOK", description:"무용, 음악, 연극·뮤지컬, 국악 공연을 매거진과 월간 캘린더로 탐색하세요." };
export default async function PerformancesPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) { return renderPerformancesPage("ko", await searchParams); }
