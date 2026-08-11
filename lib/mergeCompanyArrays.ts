// Merge/dedupe rules for applying an AI draft's array fields onto a
// company's existing arrays (app/api/admin/companies/[id]/apply-ai-draft,
// mode "merge"). Existing (manually entered) items are always kept first,
// in their original order; AI items that don't collide by the field's key
// are appended after them — an AI suggestion never displaces a hand-entered
// item, it only fills gaps.

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

// Same URL-normalization approach as app/artists/[id]/page.tsx's dedupeKey().
function normalizeUrl(value: unknown): string {
  const str = typeof value === "string" ? value.trim() : "";
  if (!str) return "";
  return str
    .replace(/^https?:\/\/(www\.)?/i, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

export function mergeCurrentActivity(existing: string[], incoming: string[]): string[] {
  const existingList = Array.isArray(existing) ? existing : [];
  const incomingList = Array.isArray(incoming) ? incoming : [];

  const seen = new Set(existingList.map(normalize));
  const merged = [...existingList];
  for (const item of incomingList) {
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
  const merged = [...existingList];
  for (const item of incomingList) {
    const itemHasYear = !!normalize(item.year);
    const key = workKey(item, itemHasYear);
    if (!key) continue;
    const collides = merged.some((e) => {
      const eHasYear = !!normalize(e.year);
      const bothHaveYear = itemHasYear && eHasYear;
      return workKey(e, bothHaveYear) === workKey(item, bothHaveYear);
    });
    if (!collides) merged.push(item);
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

  const seen = new Set(existingList.map(awardKey));
  const merged = [...existingList];
  for (const item of incomingList) {
    const key = awardKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

interface LinkLike {
  url?: string;
  [key: string]: unknown;
}

export function mergeLinks<T extends LinkLike>(existing: T[], incoming: T[]): T[] {
  const existingList = Array.isArray(existing) ? existing : [];
  const incomingList = Array.isArray(incoming) ? incoming : [];

  const seen = new Set(existingList.map((e) => normalizeUrl(e.url)));
  const merged = [...existingList];
  for (const item of incomingList) {
    const key = normalizeUrl(item.url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}
