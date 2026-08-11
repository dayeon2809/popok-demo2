// Shared, side-effect-free performance link resolution — deliberately has
// zero server-only imports (no getSupabaseServer/@supabase/supabase-js) so
// it's safe to import from "use client" components (PerformanceCarousel,
// CompanyUpcomingPerformances), same reasoning as lib/resumeFileTypes.ts.

export function isValidHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^https?:\/\/.+/i.test(value.trim());
}

interface PerformanceLinkFields {
  externalUrl?: string | null;
  ticketUrl?: string | null;
  sourceUrl?: string | null;
}

/**
 * The one URL a performance card should link to: an admin-entered
 * externalUrl first (ticket page, official site, Instagram post, ...),
 * falling back to the crawler's ticketUrl, then its sourceUrl — covers both
 * admin-curated rows and crawler-imported ones, which only ever have
 * ticketUrl/sourceUrl. Returns null (never an empty string) if none of the
 * three is a real http(s) URL, so callers can render the card without a
 * link rather than a broken href.
 */
export function getPerformanceExternalLink(perf: PerformanceLinkFields): string | null {
  for (const candidate of [perf.externalUrl, perf.ticketUrl, perf.sourceUrl]) {
    if (isValidHttpUrl(candidate)) return candidate.trim();
  }
  return null;
}
