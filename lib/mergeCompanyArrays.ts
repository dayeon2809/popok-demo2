// Merge/dedupe rules for applying an AI draft's array fields onto a
// company's existing arrays (app/api/admin/companies/[id]/apply-ai-draft,
// mode "merge"). Existing (manually entered) items are always kept first.
// Repeated existing/AI items collapse to one record; incoming values never
// overwrite hand-entered values and only fill fields that are still blank.

function normalize(value: unknown): string {
  return typeof value === "string"
    ? value.normalize("NFKC").trim().toLowerCase().replace(/[〈〉《》「」『』<>"']/g, "").replace(/[\s·:：_\-–—]+/g, "")
    : "";
}

// Same URL-normalization approach as app/artists/[id]/page.tsx's dedupeKey().
function normalizeUrl(value: unknown): string {
  const str = typeof value === "string" ? value.trim() : "";
  if (!str) return "";
  try {
    const url = new URL(str);
    url.hash = "";
    url.hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
    url.pathname = url.pathname.replace(/\/$/, "");
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_.+|fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    return `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
  } catch {
    return str.replace(/^https?:\/\/(www\.)?/i, "").replace(/[\/#]+$/, "").toLowerCase();
  }
}

function isBlank(value: unknown): boolean {
  return value == null || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && value.length === 0);
}

function enrichExisting<T extends Record<string, unknown>>(existing: T, incoming: T): T {
  const enriched = { ...existing } as T;
  for (const [key, value] of Object.entries(incoming)) {
    if (isBlank(enriched[key]) && !isBlank(value)) (enriched as Record<string, unknown>)[key] = value;
  }
  return enriched;
}

export function mergeCurrentActivity(existing: string[], incoming: string[]): string[] {
  const existingList = Array.isArray(existing) ? existing : [];
  const incomingList = Array.isArray(incoming) ? incoming : [];

  const seen = new Set<string>();
  const merged: string[] = [];
  for (const item of [...existingList, ...incomingList]) {
    const key = normalize(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

interface WorkLike {
  title?: string;
  year?: string;
  [key: string]: unknown;
}

function workKey(work: WorkLike, hasYear: boolean): string {
  const title = normalize(work.title);
  const year = normalize(work.year);
  return hasYear && year ? `${title}|${year}` : title;
}

export function mergeWorks<T extends WorkLike>(existing: T[], incoming: T[]): T[] {
  const existingList = Array.isArray(existing) ? existing : [];
  const incomingList = Array.isArray(incoming) ? incoming : [];

  // "year가 양쪽에 있으면 title+year, 한쪽에 없으면 title 기준" — evaluated
  // per incoming item against the existing set (both keyed the same way for
  // a fair comparison).
  const merged: T[] = [];
  for (const item of [...existingList, ...incomingList]) {
    const itemHasYear = !!normalize(item.year);
    const key = workKey(item, itemHasYear);
    if (!key) continue;
    const collisionIndex = merged.findIndex((e) => {
      const eHasYear = !!normalize(e.year);
      const bothHaveYear = itemHasYear && eHasYear;
      return workKey(e, bothHaveYear) === workKey(item, bothHaveYear);
    });
    if (collisionIndex === -1) merged.push(item);
    else merged[collisionIndex] = enrichExisting(merged[collisionIndex], item);
  }
  return merged;
}

interface AwardLike {
  year?: string;
  title?: string;
  organization?: string;
  [key: string]: unknown;
}

function awardKey(award: AwardLike): string {
  return `${normalize(award.year)}|${normalize(award.title)}|${normalize(award.organization)}`;
}

export function mergeAwards<T extends AwardLike>(existing: T[], incoming: T[]): T[] {
  const existingList = Array.isArray(existing) ? existing : [];
  const incomingList = Array.isArray(incoming) ? incoming : [];

  const seen = new Set<string>();
  const merged: T[] = [];
  for (const item of [...existingList, ...incomingList]) {
    const key = awardKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

interface LinkLike {
  url?: string;
  title?: string;
  label?: string;
  work?: string;
  [key: string]: unknown;
}

export function mergeLinks<T extends LinkLike>(existing: T[], incoming: T[]): T[] {
  const existingList = Array.isArray(existing) ? existing : [];
  const incomingList = Array.isArray(incoming) ? incoming : [];

  const merged: T[] = [];
  for (const item of [...existingList, ...incomingList]) {
    const urlKey = normalizeUrl(item.url);
    const textKey = `${normalize(item.title || item.label)}|${normalize(item.work)}`;
    if (!urlKey && textKey === "|") continue;
    const collisionIndex = merged.findIndex((entry) => {
      const existingUrlKey = normalizeUrl(entry.url);
      if (urlKey && existingUrlKey) return urlKey === existingUrlKey;
      return !urlKey && !existingUrlKey && `${normalize(entry.title || entry.label)}|${normalize(entry.work)}` === textKey;
    });
    if (collisionIndex === -1) merged.push(item);
    else merged[collisionIndex] = enrichExisting(merged[collisionIndex], item);
  }
  return merged;
}
