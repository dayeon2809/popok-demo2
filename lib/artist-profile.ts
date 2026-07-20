// Normalization for the individual-artist profile JSONB columns
// (education, awards, competitions, affiliations, current_activity) —
// shared by the self-serve dashboard (app/my-popok/MyPopokClient.tsx), the
// onboarding/AI-import save paths (app/api/artists/onboard,
// app/api/artists/me), and the public artist detail page
// (app/artists/[id]/page.tsx), so all of them read/write the exact same
// shape. Mirrors the lib/company.ts pattern (kept as a separate module
// rather than importing across the artist/company boundary, matching this
// repo's existing per-entity module convention).
//
// Confirmed against a live `public.artists` PostgREST sample (all 13 rows,
// 2026-07-21): education is 100% plain strings, awards/competitions are
// 100% { year, title, organization, result } objects, affiliations are
// 100% { name, position } objects, current_activity is 100% plain strings —
// no legacy/mixed shapes currently exist in production. Every normalizer
// below still defensively accepts stray legacy shapes (JSONB has no schema
// enforcement, and lib/profileParser.ts's AI import is not the only past
// write path), so no existing data is ever dropped on read.

import { toStringArray, toObjectArray } from "./normalize";

// ── Education — plain string list. Kept as strings rather than a
// structured {school, department, degree} object: 0/13 live rows use a
// structured shape, and the only automated writer (the AI importer, see
// lib/profileParser.ts's Zod schema) also only ever emits strings.
// Converting to a structured shape now would be a speculative schema change
// with no live data to justify it — flagged as optional future work rather
// than done here.
export function normalizeArtistEducation(value: unknown): string[] {
  return toStringArray(value);
}
export const cleanArtistEducationForPayload = normalizeArtistEducation;

// ── Current activity — plain string list (the "CURRENT" entries at the top
// of the public page's Activity Timeline).
export function normalizeArtistCurrentActivity(value: unknown): string[] {
  return toStringArray(value);
}
export const cleanArtistCurrentActivityForPayload = normalizeArtistCurrentActivity;

// ── Affiliations — { name, position, year? }. `year` is optional and not
// present in any live row today, but app/artists/[id]/page.tsx's Activity
// Timeline already reads it (to sort an affiliation alongside dated
// entries) — so exposing it for editing uses an already-consumed field
// rather than inventing a new one.
export interface ArtistAffiliation {
  name?: string;
  position?: string;
  year?: string;
}

export function normalizeArtistAffiliations(value: unknown): ArtistAffiliation[] {
  return toObjectArray<any>(value)
    .map((item): ArtistAffiliation => {
      const name = typeof item.name === "string" ? item.name.trim() : "";
      const position = typeof item.position === "string" ? item.position.trim() : "";
      const year = item.year !== undefined && item.year !== null ? String(item.year).trim() : "";
      return {
        name: name || undefined,
        position: position || undefined,
        year: year || undefined,
      };
    })
    .filter((a) => a.name);
}
export const cleanArtistAffiliationsForPayload = normalizeArtistAffiliations;

// ── Awards / Competitions — { year, title, organization, result }, same
// shape/logic as lib/company.ts normalizeCompanyAwards. Two DB columns
// (artists.awards / artists.competitions) share this one shape, so a single
// implementation backs both.
export interface ArtistAward {
  year?: string;
  title?: string;
  organization?: string;
  result?: string;
}

/**
 * Normalizes an awards/competitions value into `ArtistAward[]`. Structured
 * objects pass through as-is (trimmed); a legacy plain string (e.g.
 * "2026: HCI Korea Creative Awards — 뉴챌린지상") is best-effort parsed as
 * "YYYY: title" — anything that doesn't match that shape is preserved whole
 * as `title` rather than dropped, so no legacy text is ever silently lost.
 * Rows where every field is empty are dropped. Deliberately does NOT
 * dedupe or sort — that's a display-only concern the public page applies
 * on top (see normalizeAwardList in app/artists/[id]/page.tsx), while the
 * edit dashboard needs the user's own original order preserved.
 */
export function normalizeArtistAwards(value: unknown): ArtistAward[] {
  const raw = Array.isArray(value) ? value : [];

  return raw
    .map((item: any): ArtistAward => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (!trimmed) return {};

        const yearMatch = trimmed.match(/^(\d{4})\s*[:.]\s*(.*)$/);
        const year = yearMatch ? yearMatch[1] : undefined;
        const title = (yearMatch ? yearMatch[2] : trimmed).trim();
        return { year, title: title || undefined };
      }

      if (item && typeof item === "object") {
        const year = item.year !== undefined && item.year !== null ? String(item.year).trim() : "";
        const title = typeof item.title === "string" ? item.title.trim() : "";
        const organization = typeof item.organization === "string" ? item.organization.trim() : "";
        const result = typeof item.result === "string" ? item.result.trim() : "";
        return {
          year: year || undefined,
          title: title || undefined,
          organization: organization || undefined,
          result: result || undefined,
        };
      }

      return {};
    })
    .filter((a) => a.year || a.title || a.organization || a.result);
}
export const cleanArtistAwardsForPayload = normalizeArtistAwards;

// competitions uses the exact same shape/logic as awards — kept as
// separately named exports (rather than one generic function) so call
// sites read as "this is the competitions column" vs "this is the awards
// column", matching how the two are named as distinct DB columns.
export const normalizeArtistCompetitions = normalizeArtistAwards;
export const cleanArtistCompetitionsForPayload = normalizeArtistAwards;

/**
 * Normalizes representative images gallery (up to 3 images).
 * Trims strings, filters empty items, dedupes URLs, caps at 3.
 */
export function normalizeArtistRepresentativeImages(value: unknown): string[] {
  let raw: any[] = [];
  if (Array.isArray(value)) {
    raw = value;
  } else if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    if (trimmed.startsWith("[")) {
      try {
        raw = JSON.parse(trimmed);
      } catch {
        raw = [trimmed];
      }
    } else {
      raw = [trimmed];
    }
  }

  const cleaned = raw
    .map((img: any) => (typeof img === "string" ? img.trim() : (img?.url || img?.src || "").trim()))
    .filter(Boolean);

  return Array.from(new Set(cleaned)).slice(0, 3);
}
export const cleanArtistRepresentativeImagesForPayload = normalizeArtistRepresentativeImages;

