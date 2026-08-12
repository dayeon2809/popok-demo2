import type { Metadata } from "next";
import { renderPerformancesPage } from "@/components/calendar/PerformancesPage";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title:"Performances | POPOK", description:"Explore dance, music, theatre, musical, and Korean traditional performances." };
export default async function EnglishPerformancesPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) { return renderPerformancesPage("en", await searchParams); }
