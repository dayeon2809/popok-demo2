import { getSupabaseServer } from "./supabaseServer";
import { mapArtistRowToArtist } from "./artists";
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

/**
 * Published performances that haven't ended yet (end_date >= today, or no
 * end_date recorded), soonest start_date first. Used by the homepage
 * "이번 주 공연" carousel.
 */
export async function getUpcomingPerformances(limit = 8): Promise<Performance[]> {
  try {
    const supabase = getSupabaseServer();
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("performances" as any)
      .select(PERFORMANCE_SELECT_WITH_ARTISTS as any)
      .eq("status", "published")
      .or(`end_date.gte.${today},end_date.is.null`)
      .order("start_date", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("[getUpcomingPerformances] Supabase error:", error);
      return [];
    }
    return (data || []).map(mapPerformanceRowToPerformance);
  } catch (err) {
    console.error("[getUpcomingPerformances] Unexpected error:", err);
    return [];
  }
}

/** Manually curated (performances.featured = true), published, soonest first. */
export async function getFeaturedPerformances(limit = 8): Promise<Performance[]> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("performances" as any)
      .select(PERFORMANCE_SELECT_WITH_ARTISTS as any)
      .eq("status", "published")
      .eq("featured", true)
      .order("start_date", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("[getFeaturedPerformances] Supabase error:", error);
      return [];
    }
    return (data || []).map(mapPerformanceRowToPerformance);
  } catch (err) {
    console.error("[getFeaturedPerformances] Unexpected error:", err);
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
