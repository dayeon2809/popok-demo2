import type { Performance } from "../types";
import { filterUpcomingPerformances, parseDateOnly } from "./date.ts";

const GENERIC_TITLE_PREFIXES = /^(?:기획공연|정기공연)+/;
const GENERIC_TITLE_SUFFIXES = /(?:기획공연|정기공연|공연)+$/;
const EDGE_YEAR_PREFIX = /^(?:(?:19|20)\d{2}(?:년(?:도)?)?)+/;
const EDGE_YEAR_SUFFIX = /(?:(?:19|20)\d{2}(?:년(?:도)?)?)+$/;

function normalizeComparableText(value: string | null | undefined): string {
  return (value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/[<>{}\[\]()〈〉《》「」『』【】〔〕"'‘’“”`´]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();
}

/** Conservative exact-title normalization used before duplicate checks. */
export function normalizePerformanceTitle(title: string | null | undefined): string {
  let normalized = normalizeComparableText(title);
  let previous = "";

  while (normalized && normalized !== previous) {
    previous = normalized;
    normalized = normalized
      .replace(EDGE_YEAR_PREFIX, "")
      .replace(EDGE_YEAR_SUFFIX, "")
      .replace(GENERIC_TITLE_PREFIXES, "")
      .replace(GENERIC_TITLE_SUFFIXES, "");
  }

  return normalized;
}

export function getPerformanceDuplicateKey(performance: Performance): string {
  return normalizePerformanceTitle(performance.title);
}

interface NormalizedRange {
  start: string;
  end: string;
}

function getRange(performance: Performance): NormalizedRange | null {
  const start = parseDateOnly(performance.startDate);
  if (!start) return null;
  const end = parseDateOnly(performance.endDate) || start;
  return start <= end ? { start, end } : { start: end, end: start };
}

function dateToDayNumber(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function rangesOverlapOrTouch(a: NormalizedRange, b: NormalizedRange): boolean {
  return dateToDayNumber(a.start) <= dateToDayNumber(b.end) + 1
    && dateToDayNumber(b.start) <= dateToDayNumber(a.end) + 1;
}

function rangesAreIdentical(a: NormalizedRange | null, b: NormalizedRange | null): boolean {
  return !!a && !!b && a.start === b.start && a.end === b.end;
}

function normalizeEntity(value: string | null | undefined): string {
  return normalizeComparableText(value);
}

function getEntityKeys(performance: Performance): Set<string> {
  const keys = new Set<string>();
  if (performance.companyId) keys.add(`company-id:${performance.companyId}`);

  const companyName = normalizeEntity(performance.companyName || performance.company);
  if (companyName) keys.add(`company-name:${companyName}`);

  const organizer = normalizeEntity(performance.organizer);
  if (organizer) keys.add(`organizer:${organizer}`);

  for (const relation of performance.relatedArtists || []) {
    const artist = relation.artist;
    const artistId = artist.recordId || artist.id;
    if (artistId) keys.add(`artist-id:${artistId}`);
    const artistName = normalizeEntity(artist.name);
    if (artistName) keys.add(`artist-name:${artistName}`);
  }

  for (const artistId of performance.artistIds || []) {
    if (artistId) keys.add(`artist-id:${artistId}`);
  }

  return keys;
}

function setsIntersect(a: Set<string>, b: Set<string>): boolean {
  for (const value of a) {
    if (b.has(value)) return true;
  }
  return false;
}

function venuesMatch(a: Performance, b: Performance): boolean {
  const left = normalizeEntity(a.venue);
  const right = normalizeEntity(b.venue);
  if (!left || !right) return false;
  if (left === right) return true;

  // Handles conservative variants such as "예술의전당 CJ토월극장" vs
  // "CJ 토월극장", while refusing very short/ambiguous containment matches.
  const shorter = left.length <= right.length ? left : right;
  const longer = left.length > right.length ? left : right;
  return shorter.length >= 4 && longer.includes(shorter);
}

function sameStartDate(a: Performance, b: Performance): boolean {
  const left = getRange(a);
  const right = getRange(b);
  return !!left && !!right && left.start === right.start;
}

function areDuplicatePerformances(a: Performance, b: Performance): boolean {
  const title = getPerformanceDuplicateKey(a);
  if (!title || title !== getPerformanceDuplicateKey(b)) return false;

  const aRange = getRange(a);
  const bRange = getRange(b);
  if (rangesAreIdentical(aRange, bRange)) return true;

  const sameEntity = setsIntersect(getEntityKeys(a), getEntityKeys(b));
  const sameVenue = venuesMatch(a, b);

  // Explicitly different, non-adjacent dates are treated as separate runs,
  // even when the title/company/venue are the same.
  if (aRange && bRange && !rangesOverlapOrTouch(aRange, bRange)) return false;

  if (sameEntity && sameVenue) return true;
  if (sameEntity && sameStartDate(a, b)) return true;
  return false;
}

function hasPoster(performance: Performance): boolean {
  return !!(performance.posterUrl || performance.posterImage || performance.imageUrl);
}

function hasBookingLink(performance: Performance): boolean {
  return !!(performance.ticketUrl || performance.externalUrl);
}

function informationScore(performance: Performance): number {
  return (performance.description?.trim().length || 0)
    + (performance.venue?.trim().length || 0)
    + (performance.organizer?.trim().length || 0);
}

function timestamp(value: string | null | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : fallback;
}

function compareRepresentativePriority(a: Performance, b: Performance): number {
  if (hasPoster(a) !== hasPoster(b)) return hasPoster(a) ? -1 : 1;
  if (hasBookingLink(a) !== hasBookingLink(b)) return hasBookingLink(a) ? -1 : 1;

  const infoDifference = informationScore(b) - informationScore(a);
  if (infoDifference !== 0) return infoDifference;

  const updatedDifference = timestamp(b.updatedAt, Number.NEGATIVE_INFINITY)
    - timestamp(a.updatedAt, Number.NEGATIVE_INFINITY);
  if (updatedDifference !== 0) return updatedDifference;

  const createdDifference = timestamp(a.createdAt, Number.POSITIVE_INFINITY)
    - timestamp(b.createdAt, Number.POSITIVE_INFINITY);
  if (createdDifference !== 0) return createdDifference;

  return String(a.id).localeCompare(String(b.id));
}

function firstPresent<T>(values: Array<T | null | undefined>): T | null | undefined {
  return values.find((value) => value !== null && value !== undefined && value !== "");
}

function mergeRelatedArtists(group: Performance[]): Performance["relatedArtists"] {
  const merged = new Map<string, NonNullable<Performance["relatedArtists"]>[number]>();
  for (const performance of group) {
    for (const relation of performance.relatedArtists || []) {
      const artist = relation.artist;
      const key = String(artist.recordId || artist.id || artist.slug || artist.name);
      if (!merged.has(key)) merged.set(key, relation);
    }
  }
  return [...merged.values()];
}

function mergeGroup(group: Performance[]): Performance {
  const ranked = [...group].sort(compareRepresentativePriority);
  const representative = ranked[0];
  const ranges = group.map(getRange).filter((range): range is NormalizedRange => !!range);
  const starts = ranges.map((range) => range.start).sort();
  const ends = ranges.map((range) => range.end).sort();

  return {
    ...representative,
    startDate: starts[0] || representative.startDate,
    endDate: ends.at(-1) || representative.endDate || starts[0] || null,
    posterUrl: firstPresent(ranked.map((item) => item.posterUrl)) || representative.posterUrl,
    ticketUrl: firstPresent(ranked.map((item) => item.ticketUrl)) || representative.ticketUrl,
    externalUrl: firstPresent(ranked.map((item) => item.externalUrl)) || representative.externalUrl,
    sourceUrl: firstPresent(ranked.map((item) => item.sourceUrl)) || representative.sourceUrl,
    venue: firstPresent(ranked.map((item) => item.venue)) || representative.venue,
    description: firstPresent(ranked.map((item) => item.description)) || representative.description,
    organizer: firstPresent(ranked.map((item) => item.organizer)) || representative.organizer,
    companyId: firstPresent(ranked.map((item) => item.companyId)) || representative.companyId,
    companyName: firstPresent(ranked.map((item) => item.companyName)) || representative.companyName,
    relatedArtists: mergeRelatedArtists(group),
  };
}

/** Returns a new array and never mutates the input performances. */
export function deduplicatePerformances(performances: readonly Performance[]): Performance[] {
  const groups: Performance[][] = [];

  for (const performance of performances) {
    const matchingGroup = groups.find((group) =>
      group.some((existing) => areDuplicatePerformances(existing, performance))
    );
    if (matchingGroup) matchingGroup.push(performance);
    else groups.push([performance]);
  }

  return groups.map(mergeGroup);
}

/**
 * Home pipeline: exclude ended/invalid rows without limiting, deduplicate and
 * merge, then re-sort by the existing weekly ordering and apply the final limit.
 */
export function prepareHomeUpcomingPerformances(
  performances: readonly Performance[],
  referenceDate: Date = new Date(),
  limit = 8
): Performance[] {
  const upcoming = filterUpcomingPerformances([...performances], referenceDate, Number.MAX_SAFE_INTEGER);
  const deduplicated = deduplicatePerformances(upcoming);
  return filterUpcomingPerformances(deduplicated, referenceDate, limit);
}
