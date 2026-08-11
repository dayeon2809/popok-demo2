// Defensive normalization helpers for the JSONB columns on artists/companies
// (affiliations, current_activity, awards, competitions, education, links,
// review_links, works). Live data has been observed as strings, objects,
// arrays, nulls, and empty arrays/objects interchangeably depending on how
// each row was created (onboarding wizard vs. admin edit vs. AI import), so
// every function here accepts `unknown` and never throws — a single
// malformed field must not take down the whole detail page.

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Any shape -> string[], dropping anything that isn't a non-empty string. */
export function toStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item): item is string => item.length > 0);
  }
  return [];
}

/** Any shape -> T[], keeping only genuine plain objects. */
export function toObjectArray<T extends object>(value: unknown): T[] {
  if (isPlainObject(value)) return [value as T];
  if (Array.isArray(value)) {
    return value.filter((item): item is T => isPlainObject(item));
  }
  return [];
}

/** number | string -> display string; anything else (null/undefined/NaN/"") -> "". */
export function safeYear(value: unknown): string {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "string") return value.trim();
  return "";
}

interface WorkLike {
  kind?: string;
  title?: unknown;
  [key: string]: unknown;
}

/**
 * Filters a raw `works` JSONB value down to actual archived pieces:
 * excludes the onboarding pipeline's "kind": "popok_registration_media"
 * bookkeeping entry and any item with no real title. Both the "N WORKS
 * ARCHIVED" count and the rendered list must use this same function so the
 * number always matches what's shown.
 */
export function getValidWorks<T extends WorkLike>(works: unknown): T[] {
  return toObjectArray<T>(works).filter((work) => {
    if (work.kind === "popok_registration_media") return false;
    const title = typeof work.title === "string" ? work.title.trim() : "";
    return title.length > 0;
  });
}
