import PerformanceMagazine from "./PerformanceMagazine";
import PerformanceDiscovery, { PerformanceNavigation, type DiscoveryQuery } from "./PerformanceDiscovery";
import { getCalendarPerformances, getMagazinePerformances } from "@/lib/performances";
import { getPublishedArtists } from "@/lib/artists";
import { getPublishedCompanies } from "@/lib/companies";
import { deduplicatePerformances } from "@/lib/deduplicatePerformances";
import { getSeoulToday } from "@/lib/date";
import { balanceMagazinePerformances, filterPerformances, hasValidPoster, isPublicPerformanceEligible, normalizePerformanceGenre, sortPerformances, type PerformanceGenre, type PerformanceQuick, type PerformanceRegion, type PerformanceSort } from "@/lib/performanceDiscovery";
import { normalizePerformanceRegion } from "@/lib/performanceDiscovery";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { unstable_cache } from "next/cache";

const getCachedMagazineArtists = unstable_cache(getPublishedArtists, ["public-magazine-artists-v1"], { revalidate: 120, tags: ["public-artists"] });
const getCachedMagazineCompanies = unstable_cache(getPublishedCompanies, ["public-magazine-companies-v1"], { revalidate: 120, tags: ["public-companies"] });

function addDays(date: string, count: number) { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + count); return value.toISOString().slice(0, 10); }
function monthBounds(month: string) { const valid = /^\d{4}-\d{2}$/.test(month) ? month : getSeoulToday().slice(0, 7); const start = `${valid}-01`; const [year, value] = valid.split("-").map(Number); const end = new Date(Date.UTC(year, value, 0)).toISOString().slice(0, 10); return { month: valid, start, end }; }
function sundayOfWeek(today: string) { const date = new Date(`${today}T00:00:00Z`); const day = date.getUTCDay(); date.setUTCDate(date.getUTCDate() + (day === 0 ? 0 : 7 - day)); return date.toISOString().slice(0, 10); }

const genreValues = new Set(["all","music","dance","theater","musical","traditional","unclassified"]);
const regionValues = new Set(["all","seoul","capital","gangwon","chungcheong","jeolla","gyeongsang","jeju","nationwide"]);
const quickValues = new Set(["all","today","week","month","soon","my-region"]);
const sortValues = new Set(["start-date","newest","ending","recommended"]);

export async function renderPerformancesPage(locale: "ko" | "en", raw: Record<string, string | string[] | undefined>) {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const query: DiscoveryQuery = {
    genre: (genreValues.has(first(raw.genre) || "") ? first(raw.genre) : "all") as PerformanceGenre,
    region: (regionValues.has(first(raw.region) || "") ? first(raw.region) : "all") as PerformanceRegion,
    quick: (quickValues.has(first(raw.quick) || "") ? first(raw.quick) : "all") as PerformanceQuick,
    sort: (sortValues.has(first(raw.sort) || "") ? first(raw.sort) : "start-date") as PerformanceSort,
    q: (first(raw.q) || "").slice(0, 100), view: first(raw.view) === "calendar" ? "calendar" : "list", month: first(raw.month) || getSeoulToday().slice(0, 7), page: Math.max(1, Math.min(100, Number(first(raw.page)) || 1)),
  };
  const today = getSeoulToday(); const weekEnd = sundayOfWeek(today); const currentMonth = monthBounds(today.slice(0, 7)); const selectedMonth = monthBounds(query.month);
  if (query.quick === "my-region") {
    const userClient = await createServerSupabaseClient();
    const { data:{ user } } = await userClient.auth.getUser();
    const { data: viewer } = user ? await userClient.from("artists").select("city_or_region").eq("owner_id",user.id).maybeSingle() : { data:null };
    const viewerRegion = viewer?.city_or_region ? normalizePerformanceRegion({ venue:viewer.city_or_region, organizer:null }) : "unknown";
    if (viewerRegion !== "unknown") query.region = viewerRegion;
  }
  const rangeStart = selectedMonth.start < today ? selectedMonth.start : today; const rangeEnd = addDays(today, 365) > selectedMonth.end ? addDays(today, 365) : selectedMonth.end;
  const nextWeekEnd = addDays(weekEnd, 7);
  const [rawPerformances, rawMagazinePerformances, artists, companies] = await Promise.all([getCalendarPerformances(rangeStart, rangeEnd), getMagazinePerformances(today, nextWeekEnd), getCachedMagazineArtists(), getCachedMagazineCompanies()]);
  const performances = deduplicatePerformances(rawPerformances).filter((item) => isPublicPerformanceEligible(item));
  const magazinePerformances = deduplicatePerformances(rawMagazinePerformances).filter((item) => isPublicPerformanceEligible(item));
  const baseOptions = { region: query.region, q: query.q, quick: query.quick, today, weekEnd, monthEnd: currentMonth.end };
  const filtered = filterPerformances(performances, { ...baseOptions, genre: query.genre });
  const posterResults = sortPerformances(filtered.filter(hasValidPoster), query.sort, today);
  const calendarSource = filterPerformances(performances, { ...baseOptions, genre: query.genre }).filter((item) => item.startDate! <= selectedMonth.end && (item.endDate || item.startDate)! >= selectedMonth.start);
  const counts = { all: performances.length, music:0, dance:0, theater:0, musical:0, traditional:0, unclassified:0 } as Record<PerformanceGenre, number>;
  performances.forEach((item) => counts[normalizePerformanceGenre(item)]++);
  // The editorial area is based on actual Supabase rows that overlap today
  // through this Sunday. Text-only rows remain available in the calendar.
  const editorialWindow = filterPerformances(magazinePerformances, { ...baseOptions, genre:query.genre, quick:"all" });
  const magazineBase = query.genre === "all" ? balanceMagazinePerformances(editorialWindow, 36) : editorialWindow.filter(hasValidPoster).slice(0, 36);
  const pageStart = (query.page - 1) * 24;
  const navigation = <PerformanceNavigation locale={locale} query={query} counts={counts} />;
  const discovery = <PerformanceDiscovery locale={locale} query={query} list={posterResults.slice(pageStart, pageStart + 24)} calendar={calendarSource} total={posterResults.length} monthStart={selectedMonth.start} />;
  return <PerformanceMagazine locale={locale} performances={magazineBase} artists={artists} companies={companies} navigation={navigation} discovery={discovery} />;
}
