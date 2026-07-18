import { getSupabaseServer } from "./supabaseServer";
import { mapArtistRowToArtist } from "./artists";
import { getSeoulToday, filterUpcomingPerformances, parseDateOnly } from "./date";
import type { Performance, RelatedPerformanceArtist } from "@/types";

// Selects performances plus their linked artists via performance_artists.
// Requires supabase/migrations/create_performances.sql and
// create_performance_artists.sql to have been run — see walkthrough.md.
// If either table/relationship doesn't exist yet, every function below
// catches the resulting Supabase error and returns a safe empty result
// instead of throwing, so the homepage never 500s on this.
const PERFORMANCE_SELECT_WITH_ARTISTS = `
  *,
  performance_artists (
    role,
    artists ( * )
  )
`;

export function mapPerformanceRowToPerformance(record: any): Performance {
  if (!record) return {} as Performance;

  const status = record.status || "draft";

  const rawLinks: any[] = Array.isArray(record.performance_artists) ? record.performance_artists : [];
  const relatedArtists: RelatedPerformanceArtist[] = rawLinks
    .filter((link) => link && link.artists && link.artists.status === "published")
    .map((link) => ({
      artist: mapArtistRowToArtist(link.artists),
      role: link.role ?? null,
    }));

  return {
    id: String(record.id),
    title: record.title || "",
    slug: record.slug || null,

    posterUrl: record.poster_url || null,
    sourceUrl: record.source_url || null,
    ticketUrl: record.ticket_url || null,

    venue: record.venue || null,
    startDate: record.start_date || null,
    endDate: record.end_date || null,

    organizer: record.organizer || null,
    genre: record.genre || null,
    category: record.category || null,

    status,
    published: status === "published",
    featured: !!record.featured,

    createdAt: record.created_at || null,
    updatedAt: record.updated_at || null,

    companyId: record.company_id || null,
    // Populated only when the query joins companies(name) — see
    // getUpcomingPerformances(). null for queries that don't join it.
    companyName: record.companies && record.companies.name ? record.companies.name : null,
    externalUrl: record.external_url || null,
    displayOrder: typeof record.display_order === "number" ? record.display_order : 0,

    relatedArtists,
    description: record.description || "",
  };
}

/** Every published performance, soonest start_date first. */
export async function getPublishedPerformances(limit?: number): Promise<Performance[]> {
  try {
    const supabase = getSupabaseServer();
    let query = supabase
      .from("performances" as any)
      .select(PERFORMANCE_SELECT_WITH_ARTISTS as any)
      .eq("status", "published")
      .order("start_date", { ascending: true });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      console.error("[getPublishedPerformances] Supabase error:", error);
      return [];
    }
    return (data || []).map(mapPerformanceRowToPerformance);
  } catch (err) {
    console.error("[getPublishedPerformances] Unexpected error:", err);
    return [];
  }
}

// Fetch a wider candidate pool than the final display `limit` so the
// in-memory "this week, then nearest future" selection below has enough
// future performances to pick from when this week is thin — without
// scanning the entire table on every homepage request.
const UPCOMING_CANDIDATE_POOL_SIZE = 50;

/**
 * Performances for the homepage "이번 주 공연" carousel, recalculated on every
 * call against the current Asia/Seoul date (never the server/deploy
 * platform's local timezone):
 *   1. Published, not-yet-ended performances this week (today's in-progress
 *      ones first, then soonest start date)
 *   2. If this week doesn't fill `limit`, the nearest upcoming performances
 *      afterward — never anything that has already ended.
 * See lib/date.ts (getSeoulToday / getWeeklyPerformanceRange /
 * filterUpcomingPerformances) for the reusable, independently-testable date
 * logic this relies on.
 *
 * Deliberately does NOT require featured/external_url/company_id — this is
 * POPOK's whole performance catalog (crawler-imported rows included), not
 * just admin-curated ones. /admin/performances only manages the admin's own
 * rows (see its `source_url IS NULL` scoping) and is independent of this
 * query; PerformanceCarousel resolves whichever link field is actually
 * usable (externalUrl > ticketUrl > sourceUrl) per row.
 */
export async function getUpcomingPerformances(limit = 8): Promise<Performance[]> {
  try {
    const supabase = getSupabaseServer();
    const today = getSeoulToday(); // Asia/Seoul-local "today", not UTC

    const { data, error } = await supabase
      .from("performances" as any)
      .select(`${PERFORMANCE_SELECT_WITH_ARTISTS}, companies ( name )` as any)
      .eq("status", "published")
      .or(`end_date.gte.${today},end_date.is.null`)
      .order("start_date", { ascending: true })
      .limit(UPCOMING_CANDIDATE_POOL_SIZE);

    if (error) {
      console.error("[getUpcomingPerformances] Supabase error:", error);
      return [];
    }

    const mapped = (data || []).map(mapPerformanceRowToPerformance);

    // A single malformed start_date must not take down the whole homepage —
    // log it and let filterUpcomingPerformances silently exclude that row.
    for (const perf of mapped) {
      if (perf.startDate && !parseDateOnly(perf.startDate)) {
        console.error(
          "[getUpcomingPerformances] Invalid start_date, excluding from weekly list:",
          perf.id,
          perf.startDate
        );
      }
    }

    return filterUpcomingPerformances(mapped, new Date(), limit);
  } catch (err) {
    console.error("[getUpcomingPerformances] Unexpected error:", err);
    return [];
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Single performance by id (uuid) or slug — for a future detail page. */
export async function getPerformanceByIdOrSlug(idOrSlug: string): Promise<Performance | null> {
  try {
    const supabase = getSupabaseServer();
    // performances.id is uuid — filtering it with a non-uuid slug string via
    // .or() would fail to cast at the SQL level, so branch instead of combining.
    let query = supabase.from("performances" as any).select(PERFORMANCE_SELECT_WITH_ARTISTS as any);
    query = UUID_RE.test(idOrSlug) ? query.eq("id", idOrSlug) : query.eq("slug", idOrSlug);

    const { data, error } = await query.maybeSingle();
    if (error) {
      console.error("[getPerformanceByIdOrSlug] Supabase error:", error);
      return null;
    }
    return data ? mapPerformanceRowToPerformance(data) : null;
  } catch (err) {
    console.error("[getPerformanceByIdOrSlug] Unexpected error:", err);
    return null;
  }
}

/**
 * Fetches upcoming published performances connected to the company.
 * 
 * Filter conditions:
 * - company_id === companyId
 * - status === 'published'
 * - end_date >= Asia/Seoul today
 * - external_url is not null and not empty string and valid http/https URL
 * 
 * Sort order:
 * 1. display_order ASC (nulls last)
 * 2. start_date ASC
 * 3. created_at DESC
 */
export async function getUpcomingPerformancesByCompanyId(companyId: string): Promise<Performance[]> {
  try {
    const supabase = getSupabaseServer();
    const today = getSeoulToday(); // Returns 'YYYY-MM-DD' in Asia/Seoul time

    // Fetch matching data from Supabase
    const { data, error } = await supabase
      .from("performances" as any)
      .select("id, title, slug, poster_url, venue, start_date, end_date, organizer, genre, category, status, company_id, external_url, display_order, created_at, updated_at")
      .eq("company_id", companyId)
      .eq("status", "published")
      .or(`end_date.gte.${today},end_date.is.null`)
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("start_date", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getUpcomingPerformancesByCompanyId] Supabase error:", error);
      return [];
    }

    if (!data) return [];

    // Filter in-memory for non-empty external_url in http:// or https:// format
    const urlPattern = /^https?:\/\/.+/i;
    const filtered = data
      .filter((row: any) => {
        const url = (row.external_url || "").trim();
        return url !== "" && urlPattern.test(url);
      })
      .map(mapPerformanceRowToPerformance);

    return filtered;
  } catch (err) {
    console.error("[getUpcomingPerformancesByCompanyId] Unexpected error:", err);
    return [];
  }
}

// The bucket performance posters live in — the same public "artist-media"
// bucket artist/company images already use (see app/api/upload/route.ts),
// under a performances/{id}/ prefix. No dedicated bucket for this feature.
export const PERFORMANCE_POSTER_BUCKET = "artist-media";

/**
 * Extracts the Storage object path (e.g. "performances/<id>/<uuid>.jpg")
 * from a public poster_url so it can be passed to
 * supabase.storage.from(PERFORMANCE_POSTER_BUCKET).remove([path]). Returns
 * null for anything that isn't a same-bucket public Storage URL (e.g. a
 * legacy crawled poster_url from an external host) — callers should treat
 * null as "nothing to delete" rather than an error.
 */
export function extractPerformancePosterPath(posterUrl: string | null | undefined): string | null {
  if (!posterUrl) return null;
  const marker = `/object/public/${PERFORMANCE_POSTER_BUCKET}/`;
  const idx = posterUrl.indexOf(marker);
  if (idx === -1) return null;
  const path = posterUrl.slice(idx + marker.length).split("?")[0];
  return path || null;
}
