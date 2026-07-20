// Normalization for `companies.representative_images` — the "brand mood"
// gallery shown near the top of the company detail page. Deliberately
// separate from lib/company-works.ts (per-work images); never derived from
// works data.

/**
 * Cleans a representative-images value into the exact shape that should be
 * persisted: an array, empty strings dropped, duplicates removed, capped at
 * 3, original order preserved.
 */
// Values that should read as "not set" even though they're technically a
// non-empty string — leftover placeholder text ("없음", "N/A", the literal
// string "null", ...) rather than real data. Case-insensitive.
const EMPTY_COMPANY_VALUE_STRINGS = new Set(["-", "없음", "n/a", "na", "null", "undefined"]);

export function isEmptyCompanyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "" || EMPTY_COMPANY_VALUE_STRINGS.has(normalized);
}

/** Trims a possibly-placeholder company text field down to `null` if it's
 * empty/placeholder-only — never invents a fallback value. */
export function normalizeOptionalCompanyText(value: unknown): string | null {
  if (isEmptyCompanyValue(value)) return null;
  return typeof value === "string" ? value.trim() : null;
}

export function normalizeCompanyRepresentativeImages(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : [];

  const cleaned = raw
    .map((img: any) => (typeof img === "string" ? img.trim() : (img?.url || img?.src || "").trim()))
    .filter(Boolean);

  return Array.from(new Set(cleaned)).slice(0, 3);
}

// ── companies.awards — shared between the admin editor (already existed,
// components/admin/ArrayField.tsx `renderAwardsForm`), the self-serve CMS,
// and the public detail page, so all three read/write the exact same shape:
// { year, title, organization, result } — real DB shape, confirmed against
// the live `companies.awards` column (structured objects, not strings). The
// string-parsing branch below only exists for defensive legacy compat, in
// case any row was ever hand-written as a plain string.

export interface CompanyAward {
  year?: string;
  title?: string;
  organization?: string;
  result?: string;
}

/**
 * Normalizes an awards value into `CompanyAward[]`. Structured objects pass
 * through as-is (trimmed); a legacy plain string is best-effort parsed as
 * "YYYY: title - organization" — anything that doesn't match that shape is
 * preserved whole as `title` rather than dropped, so no legacy text is ever
 * silently lost. Rows where every field is empty are dropped.
 */
export function normalizeCompanyAwards(value: unknown): CompanyAward[] {
  const raw = Array.isArray(value) ? value : [];

  return raw
    .map((item: any): CompanyAward => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (!trimmed) return {};

        const yearMatch = trimmed.match(/^(\d{4})\s*[:.]\s*(.*)$/);
        const year = yearMatch ? yearMatch[1] : undefined;
        const rest = (yearMatch ? yearMatch[2] : trimmed).trim();

        const dashIdx = rest.lastIndexOf(" - ");
        if (dashIdx > -1) {
          const title = rest.slice(0, dashIdx).trim();
          const organization = rest.slice(dashIdx + 3).trim();
          return { year, title: title || undefined, organization: organization || undefined };
        }
        return { year, title: rest || undefined };
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

/** Same normalization, used specifically at the save boundary — kept as a
 * distinct export (per the requested `cleanCompanyAwardsForPayload` name)
 * even though the logic is identical to normalizeCompanyAwards, so call
 * sites read as "this is a save-time clean" vs "this is a display-time read". */
export const cleanCompanyAwardsForPayload = normalizeCompanyAwards;

/** "2026: 제목 - 기관명" — omits whichever pieces are missing without leaving
 * stray separators (no year → "제목 - 기관", no organization → "2026: 제목"). */
export function formatCompanyAward(award: CompanyAward): string {
  const title = award.title || "";
  const withYear = award.year ? `${award.year}: ${title}` : title;
  const withOrg = award.organization ? `${withYear}${withYear ? " - " : ""}${award.organization}` : withYear;
  return withOrg.trim();
}
