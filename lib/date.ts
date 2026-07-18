// Asia/Seoul-safe date helpers for the homepage "이번 주 공연" section.
// All "today" / "this week" concepts are anchored to KST regardless of the
// server's runtime timezone, and every function here takes its reference
// date as a parameter so date-boundary behavior (Monday, Sunday, month-end,
// year-end, KST/UTC mismatch, etc.) can be tested without waiting for the
// real calendar to reach those days.

const SEOUL_TZ = "Asia/Seoul";

/** "YYYY-MM-DD" for `at` (default: now) as seen in Asia/Seoul, never UTC. */
export function getSeoulDateString(at: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD, which both sorts/compares correctly as a
  // plain string and matches the `date` column type used by
  // performances.start_date / end_date.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** Today's calendar date in Asia/Seoul, as a "YYYY-MM-DD" string. */
export function getSeoulToday(at: Date = new Date()): string {
  return getSeoulDateString(at);
}

/**
 * Parses a "YYYY-MM-DD"-prefixed value into a normalized "YYYY-MM-DD"
 * string, or null if it's missing/malformed. Deliberately does *not* go
 * through `new Date(value)` for validation — that would silently roll
 * invalid dates like "2026-02-30" over into March, masking bad data instead
 * of rejecting it.
 */
export function parseDateOnly(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  const daysInMonth = new Date(Number(y), Number(m), 0).getDate();
  if (Number(m) < 1 || Number(m) > 12 || Number(d) < 1 || Number(d) > daysInMonth) return null;
  return `${y}-${m}-${d}`;
}

/** Monday 00:00 – Sunday 23:59 (inclusive), as "YYYY-MM-DD" strings, in Asia/Seoul. */
export function getWeeklyPerformanceRange(referenceDate: Date = new Date()): { weekStart: string; weekEnd: string } {
  const todayStr = getSeoulToday(referenceDate);
  const [y, m, d] = todayStr.split("-").map(Number);

  // A UTC-anchored Date used purely as day-math scratch space — only its
  // day-of-week and +/- N day arithmetic are used, never its wall-clock
  // fields read back through a timezone conversion, so this can't drift a
  // calendar day regardless of the process's local timezone.
  const anchor = new Date(Date.UTC(y, m - 1, d));
  const dow = anchor.getUTCDay(); // 0 = Sunday ... 6 = Saturday
  const daysSinceMonday = (dow + 6) % 7; // Monday -> 0, ..., Sunday -> 6

  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() - daysSinceMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const toStr = (dt: Date) =>
    `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;

  return { weekStart: toStr(monday), weekEnd: toStr(sunday) };
}

export interface DateRangeLike {
  startDate?: string | null;
  endDate?: string | null;
}

/**
 * Given a pool of candidate performances, returns up to `limit` for the
 * homepage carousel:
 *   1. This week's performances (today's in-progress ones first, then
 *      soonest start date, then soonest end date, then original order)
 *   2. If that's not enough to fill `limit`, the nearest future
 *      performances (soonest start date first)
 * Performances that have already ended (end date before `referenceDate`'s
 * Seoul-local today) are always excluded and never used to pad the list.
 * Entries with an unparseable/missing start date are silently dropped —
 * callers that want to log those should pre-scan with `parseDateOnly`
 * before calling this, since this function itself is pure (no logging, no
 * I/O) to keep it trivially testable.
 */
export function filterUpcomingPerformances<T extends DateRangeLike>(
  performances: T[],
  referenceDate: Date = new Date(),
  limit = 8
): T[] {
  const today = getSeoulToday(referenceDate);
  const { weekStart, weekEnd } = getWeeklyPerformanceRange(referenceDate);

  type Entry = { item: T; start: string; end: string; index: number };
  const valid: Entry[] = [];

  performances.forEach((item, index) => {
    const start = parseDateOnly(item.startDate);
    if (!start) return; // invalid/missing start date — drop
    // A single-day performance with no end_date ends the same day it starts.
    const end = parseDateOnly(item.endDate) || start;

    if (end < today) return; // already ended — never shown, never used as filler

    valid.push({ item, start, end, index });
  });

  const thisWeek = valid.filter((e) => e.start <= weekEnd && e.end >= weekStart);
  const future = valid.filter((e) => e.start > weekEnd);

  const byStartThenEndThenOriginalOrder = (a: Entry, b: Entry) => {
    if (a.start !== b.start) return a.start < b.start ? -1 : 1;
    if (a.end !== b.end) return a.end < b.end ? -1 : 1;
    return a.index - b.index;
  };

  thisWeek.sort((a, b) => {
    const aInProgress = a.start <= today && a.end >= today;
    const bInProgress = b.start <= today && b.end >= today;
    if (aInProgress !== bInProgress) return aInProgress ? -1 : 1;
    return byStartThenEndThenOriginalOrder(a, b);
  });

  future.sort(byStartThenEndThenOriginalOrder);

  return [...thisWeek, ...future].slice(0, limit).map((e) => e.item);
}

export type PerformanceLifecycleStatus = "upcoming" | "ongoing" | "ended";

/**
 * Derives a performance's display status purely from start_date/end_date —
 * never stored as its own DB column, so it can never drift out of sync with
 * the dates. Asia/Seoul-anchored via getSeoulToday, same as everything else
 * in this file. A missing/unparseable start_date is treated as "upcoming"
 * (nothing to compare against yet) rather than thrown away, since callers
 * (the admin list) still need a status to render.
 *
 * upcoming: today < start_date
 * ongoing:  start_date <= today <= end_date (end_date defaults to start_date
 *           for a single-day performance)
 * ended:    today > end_date
 */
export function getPerformanceLifecycleStatus(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  referenceDate: Date = new Date()
): PerformanceLifecycleStatus {
  const today = getSeoulToday(referenceDate);
  const start = parseDateOnly(startDate);
  if (!start) return "upcoming";
  const end = parseDateOnly(endDate) || start;

  if (today < start) return "upcoming";
  if (today > end) return "ended";
  return "ongoing";
}

const DELETION_PENDING_GRACE_DAYS = 30;

/**
 * True once a performance has been over for more than
 * DELETION_PENDING_GRACE_DAYS days — computed on every read (no DB column),
 * per the "삭제 예정" admin filter/badge. A missing end_date is never
 * pending deletion — there's nothing to measure "over" against.
 */
export function isPerformanceDeletionPending(
  endDate: string | null | undefined,
  referenceDate: Date = new Date()
): boolean {
  const end = parseDateOnly(endDate);
  if (!end) return false;

  const today = getSeoulToday(referenceDate);
  const [y, m, d] = today.split("-").map(Number);
  const cutoff = new Date(Date.UTC(y, m - 1, d));
  cutoff.setUTCDate(cutoff.getUTCDate() - DELETION_PENDING_GRACE_DAYS);
  const cutoffStr = `${cutoff.getUTCFullYear()}-${String(cutoff.getUTCMonth() + 1).padStart(2, "0")}-${String(cutoff.getUTCDate()).padStart(2, "0")}`;

  return end < cutoffStr;
}
