import type { Performance } from "@/types";

export type PerformanceGenre = "all" | "dance" | "music" | "theater" | "traditional" | "unclassified";
export type PerformanceRegion = "all" | "seoul" | "capital" | "gangwon" | "chungcheong" | "jeolla" | "gyeongsang" | "jeju" | "nationwide";
export type PerformanceQuick = "all" | "today" | "week" | "month" | "soon" | "my-region";
export type PerformanceSort = "start-date" | "newest" | "ending" | "recommended";

function overlapsDateRange(item: Pick<Performance, "startDate" | "endDate">, rangeStart: string, rangeEnd: string) { const start = item.startDate; const end = item.endDate || start; return Boolean(start && end && start <= rangeEnd && end >= rangeStart); }

const DANCE = /무용|현대무용|한국무용|발레|contemporary.?dance|ballet|dance/i;
const MUSIC = /클래식|오페라|재즈|대중음악|콘서트|음악|classic|opera|jazz|music|concert/i;
const THEATER = /연극|뮤지컬|아동극|가족극|theat(?:re|er)|musical/i;
const TRADITIONAL = /국악|전통음악|창극|판소리|정가|민요|사물놀이|풍물|전통연희|한국음악|국악관현악|traditional/i;

/** Uses explicit genre/category only. Venue, source and title never decide genre. */
export function normalizePerformanceGenre(performance: Pick<Performance, "genre" | "category">): Exclude<PerformanceGenre, "all"> {
  const value = `${performance.genre || ""} ${performance.category || ""}`.trim();
  if (!value) return "unclassified";
  if (TRADITIONAL.test(value)) return "traditional";
  if (DANCE.test(value)) return "dance";
  if (THEATER.test(value)) return "theater";
  if (MUSIC.test(value)) return "music";
  return "unclassified";
}

const INVALID_POSTER = /(?:placeholder|transparent|spacer|blank|default[-_]?image|no[-_]?image|logo|banner)(?:[._/-]|$)/i;
export function hasValidPoster(performance: Pick<Performance, "posterUrl">) {
  if (!performance.posterUrl) return false;
  try { const url = new URL(performance.posterUrl); return /^https?:$/.test(url.protocol) && !INVALID_POSTER.test(url.pathname); } catch { return false; }
}

export function normalizePerformanceRegion(performance: Pick<Performance, "venue" | "organizer">): PerformanceRegion | "unknown" {
  const value = `${performance.venue || ""} ${performance.organizer || ""}`;
  if (/온라인|전국/.test(value)) return "nationwide";
  if (/서울/.test(value)) return "seoul";
  if (/경기|인천|수원|성남|고양|부천|용인/.test(value)) return "capital";
  if (/강원|춘천|원주|강릉/.test(value)) return "gangwon";
  if (/충청|충북|충남|대전|세종|청주|천안/.test(value)) return "chungcheong";
  if (/전라|전북|전남|광주|전주|목포|여수/.test(value)) return "jeolla";
  if (/경상|경북|경남|부산|대구|울산|창원|포항/.test(value)) return "gyeongsang";
  if (/제주/.test(value)) return "jeju";
  return "unknown";
}

export function filterPerformances(items: Performance[], options: { genre: PerformanceGenre; region: PerformanceRegion; q: string; quick: PerformanceQuick; today: string; weekEnd: string; monthEnd: string }) {
  return items.filter((item) => {
    const end = item.endDate || item.startDate;
    if (!item.startDate || !end || end < options.today) return false;
    if (options.genre !== "all" && normalizePerformanceGenre(item) !== options.genre) return false;
    if (options.region !== "all" && normalizePerformanceRegion(item) !== options.region) return false;
    const haystack = `${item.title} ${item.organizer || ""} ${item.companyName || ""} ${item.venue || ""} ${item.genre || ""} ${item.category || ""}`.toLocaleLowerCase("ko-KR");
    if (options.q && !haystack.includes(options.q.toLocaleLowerCase("ko-KR"))) return false;
    if (options.quick === "today" && !overlapsDateRange(item, options.today, options.today)) return false;
    if (options.quick === "week" && !overlapsDateRange(item, options.today, options.weekEnd)) return false;
    if (options.quick === "month" && !overlapsDateRange(item, options.today.slice(0, 8) + "01", options.monthEnd)) return false;
    if (options.quick === "soon" && !(item.startDate >= options.today && item.startDate <= options.weekEnd)) return false;
    return true;
  });
}

export function sortPerformances(items: Performance[], sort: PerformanceSort, today: string) {
  return [...items].sort((a, b) => {
    if (sort === "newest") return `${b.createdAt || ""}|${b.id}`.localeCompare(`${a.createdAt || ""}|${a.id}`);
    if (sort === "ending") return `${a.endDate || a.startDate || "9999"}|${a.startDate || ""}|${a.id}`.localeCompare(`${b.endDate || b.startDate || "9999"}|${b.startDate || ""}|${b.id}`);
    if (sort === "recommended") return Number(b.featured) - Number(a.featured) || Number(Boolean(b.companyId || b.relatedArtists?.length)) - Number(Boolean(a.companyId || a.relatedArtists?.length)) || `${a.startDate}|${a.id}`.localeCompare(`${b.startDate}|${b.id}`);
    const aLive = a.startDate && a.startDate <= today && (a.endDate || a.startDate) >= today ? 0 : 1;
    const bLive = b.startDate && b.startDate <= today && (b.endDate || b.startDate) >= today ? 0 : 1;
    return aLive - bLive || `${a.startDate || "9999"}|${a.endDate || ""}|${a.id}`.localeCompare(`${b.startDate || "9999"}|${b.endDate || ""}|${b.id}`);
  });
}

export function balanceMagazinePerformances(items: Performance[], limit = 24) {
  const buckets = new Map<string, Performance[]>();
  for (const item of items.filter(hasValidPoster)) { const key = normalizePerformanceGenre(item); buckets.set(key, [...(buckets.get(key) || []), item]); }
  const keys = ["dance", "music", "theater", "traditional", "unclassified"];
  const result: Performance[] = [];
  for (let index = 0; result.length < limit; index++) {
    let added = false;
    for (const key of keys) { const item = buckets.get(key)?.[index]; if (item) { result.push(item); added = true; if (result.length === limit) break; } }
    if (!added) break;
  }
  return result;
}
