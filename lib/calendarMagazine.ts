import { getSeoulToday, getWeeklyPerformanceRange, overlapsDateRange, parseDateOnly } from "./date.ts";
import type { Artist, Company, Performance } from "@/types";

export type PerformanceShelf = { key: "opening" | "nextWeek" | "popok"; items: Performance[] };
export type CuratedProfile = {
  key: string;
  kind: "artist" | "company";
  name: string;
  nameEn?: string | null;
  role: string;
  imageUrl?: string | null;
  href: string;
  reason: "upcoming" | "active" | "popular" | "new";
};

function addDays(date: string, count: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

function upcomingOnly(items: Performance[], today: string) {
  return items.filter((item) => {
    const start = parseDateOnly(item.startDate);
    const end = parseDateOnly(item.endDate) || start;
    return Boolean(start && end && end >= today && item.status === "published");
  });
}

export function selectMagazineCover(items: Performance[], referenceDate = new Date()): Performance | null {
  return selectMagazineCovers(items, referenceDate, 1)[0] || null;
}

export function selectMagazineCovers(items: Performance[], referenceDate = new Date(), limit = 4): Performance[] {
  const today = getSeoulToday(referenceDate);
  const candidates = upcomingOnly(items, today).sort((a, b) => (a.startDate || "9999").localeCompare(b.startDate || "9999"));
  // Editorial selections first, then POPOK-linked productions, then the
  // nearest performances. Preserve date order inside each priority group.
  return [...candidates]
    .sort((a, b) => {
      const priority = (item: Performance) => item.featured ? 0 : (item.companyId || item.relatedArtists?.length) ? 1 : 2;
      return priority(a) - priority(b) || (a.startDate || "9999").localeCompare(b.startDate || "9999");
    })
    .slice(0, Math.max(1, limit));
}

export function buildPerformanceShelves(items: Performance[], referenceDate = new Date()): PerformanceShelf[] {
  const today = getSeoulToday(referenceDate);
  const { weekStart, weekEnd } = getWeeklyPerformanceRange(referenceDate);
  const nextWeekStart = addDays(weekEnd, 1);
  const nextWeekEnd = addDays(weekEnd, 7);
  const current = upcomingOnly(items, today);
  const shelves: PerformanceShelf[] = [
    { key: "opening", items: current.filter((item) => {
      const start = parseDateOnly(item.startDate);
      return Boolean(start && start >= today && start >= weekStart && start <= weekEnd);
    }) },
    { key: "nextWeek", items: current.filter((item) => overlapsDateRange(item, nextWeekStart, nextWeekEnd)) },
    { key: "popok", items: current.filter((item) => Boolean(item.companyId || item.relatedArtists?.length)) },
  ];

  return shelves
    .map((shelf) => ({ ...shelf, items: shelf.items.slice(0, 16) }))
    .filter((shelf) => shelf.items.length > 0);
}

function timestamp(value?: string | null) {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function curateProfiles(
  artists: Artist[],
  companies: Company[],
  performances: Performance[],
  limit = 8,
): CuratedProfile[] {
  const artistUpcoming = new Set(performances.flatMap((p) => p.relatedArtists?.map((entry) => entry.artist.id) || []));
  const companyUpcoming = new Set(performances.map((p) => p.companyId).filter(Boolean));

  // Four signals are deliberately mixed instead of sorting only by views:
  // upcoming participation, recent activity/update, profile views, and recent signup.
  // Artist/company candidates are then interleaved and deduplicated so one entity
  // or one profile type cannot dominate the entire editorial row.
  const score = (upcoming: boolean, updated: number, created: number, views: number) =>
    (upcoming ? 1_000_000_000_000_000 : 0) + updated + created * 0.25 + Math.min(views, 100_000) * 10_000_000;
  const reason = (upcoming: boolean, updated: number, created: number, views: number): CuratedProfile["reason"] => {
    if (upcoming) return "upcoming";
    if (updated >= Date.now() - 1000 * 60 * 60 * 24 * 60) return "active";
    if (views > 0) return "popular";
    return created ? "new" : "active";
  };

  const artistPool = artists.map((artist) => {
    const updated = timestamp(artist.updatedAt || artist.updated_at);
    const created = timestamp(artist.createdAt || artist.created_at);
    const upcoming = artistUpcoming.has(artist.id) || (artist.recordId ? artistUpcoming.has(artist.recordId) : false);
    return { score: score(upcoming, updated, created, artist.view_count || 0), value: {
      key: `artist-${artist.id}`, kind: "artist" as const, name: artist.name, nameEn: artist.name_en,
      role: artist.role || artist.genre || artist.field || "Artist", imageUrl: artist.profile_image_url || artist.profileImage || artist.profile_image_urls?.[0],
      href: `/artists/${encodeURIComponent(artist.slug || artist.id)}`, reason: reason(upcoming, updated, created, artist.view_count || 0),
    }};
  }).sort((a, b) => b.score - a.score);

  const companyPool = companies.map((company) => {
    const updated = timestamp(company.updatedAt);
    const created = timestamp(company.createdAt);
    const upcoming = companyUpcoming.has(company.id);
    return { score: score(upcoming, updated, created, company.view_count || 0), value: {
      key: `company-${company.id}`, kind: "company" as const, name: company.name, nameEn: company.name_en,
      role: company.genre || company.category || "Performing Arts Company", imageUrl: company.profile_image_url || company.profile_image_urls?.[0] || company.representative_images?.[0],
      href: `/companies/${encodeURIComponent(company.slug || company.id)}`, reason: reason(upcoming, updated, created, company.view_count || 0),
    }};
  }).sort((a, b) => b.score - a.score);

  const output: CuratedProfile[] = [];
  for (let index = 0; output.length < limit && (index < artistPool.length || index < companyPool.length); index += 1) {
    if (artistPool[index]) output.push(artistPool[index].value);
    if (output.length < limit && companyPool[index]) output.push(companyPool[index].value);
  }
  return output;
}
