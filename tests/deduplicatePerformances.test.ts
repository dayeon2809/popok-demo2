import test from "node:test";
import assert from "node:assert/strict";
import type { Performance } from "../types/index.ts";
import {
  deduplicatePerformances,
  normalizePerformanceTitle,
  prepareHomeUpcomingPerformances,
} from "../lib/deduplicatePerformances.ts";
import { overlapsDateRange } from "../lib/date.ts";

function performance(overrides: Partial<Performance> & Pick<Performance, "id" | "title">): Performance {
  return {
    startDate: "2026-07-20",
    endDate: "2026-07-20",
    relatedArtists: [],
    ...overrides,
  };
}

test("angle-bracket variants on the same date are deduplicated", () => {
  const result = deduplicatePerformances([
    performance({ id: "1", title: "<모서리>" }),
    performance({ id: "2", title: "〈모서리〉" }),
  ]);

  assert.equal(normalizePerformanceTitle("<모서리>"), "모서리");
  assert.equal(result.length, 1);
});

test("edge year variants on the same date and venue are deduplicated", () => {
  const result = deduplicatePerformances([
    performance({ id: "1", title: "2026 모서리", venue: "아르코예술극장" }),
    performance({ id: "2", title: "모서리", venue: "아르코 예술극장" }),
  ]);

  assert.equal(result.length, 1);
});

test("same title in clearly different months remains separate", () => {
  const result = deduplicatePerformances([
    performance({
      id: "1",
      title: "모서리",
      companyId: "company-1",
      venue: "아르코예술극장",
      startDate: "2026-07-20",
      endDate: "2026-07-20",
    }),
    performance({
      id: "2",
      title: "모서리 공연",
      companyId: "company-1",
      venue: "아르코예술극장",
      startDate: "2026-10-20",
      endDate: "2026-10-20",
    }),
  ]);

  assert.equal(result.length, 2);
});

test("adjacent daily rows merge into one full performance period", () => {
  const result = deduplicatePerformances([
    performance({
      id: "1",
      title: "모서리",
      companyId: "company-1",
      venue: "대학로예술극장",
      startDate: "2026-10-09",
      endDate: null,
    }),
    performance({
      id: "2",
      title: "〈모서리〉",
      companyId: "company-1",
      venue: "대학로 예술극장",
      startDate: "2026-10-10",
      endDate: null,
    }),
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0].startDate, "2026-10-09");
  assert.equal(result[0].endDate, "2026-10-10");
});

test("row with a poster is selected as the representative", () => {
  const result = deduplicatePerformances([
    performance({ id: "without-poster", title: "모서리", description: "더 긴 설명입니다." }),
    performance({ id: "with-poster", title: "모서리 공연", posterUrl: "https://example.com/poster.jpg" }),
  ]);

  assert.equal(result[0].id, "with-poster");
  assert.equal(result[0].posterUrl, "https://example.com/poster.jpg");
});

test("booking link from a duplicate row is merged into the representative", () => {
  const result = deduplicatePerformances([
    performance({ id: "poster", title: "모서리", posterUrl: "https://example.com/poster.jpg" }),
    performance({ id: "ticket", title: "〈모서리〉", ticketUrl: "https://tickets.example.com/edge" }),
  ]);

  assert.equal(result[0].id, "poster");
  assert.equal(result[0].ticketUrl, "https://tickets.example.com/edge");
});

test("home limit is applied after deduplication so the configured card count is filled", () => {
  const referenceDate = new Date("2026-07-20T00:00:00+09:00");
  const result = prepareHomeUpcomingPerformances([
    performance({ id: "duplicate-1", title: "<모서리>", startDate: "2026-07-20" }),
    performance({ id: "duplicate-2", title: "모서리 공연", startDate: "2026-07-20" }),
    performance({ id: "second", title: "두 번째 작품", startDate: "2026-07-21" }),
    performance({ id: "third", title: "세 번째 작품", startDate: "2026-07-22" }),
    performance({ id: "fourth", title: "네 번째 작품", startDate: "2026-07-23" }),
  ], referenceDate, 3);

  assert.equal(result.length, 3);
  assert.deepEqual(result.map((item) => item.id), ["duplicate-1", "second", "third"]);
});

test("calendar overlap uses inclusive start and effective end dates", () => {
  assert.equal(overlapsDateRange({ startDate: "2026-08-16", endDate: null }, "2026-08-10", "2026-08-16"), true);
  assert.equal(overlapsDateRange({ startDate: "2026-08-01", endDate: "2026-08-10" }, "2026-08-10", "2026-08-16"), true);
  assert.equal(overlapsDateRange({ startDate: "2026-08-17", endDate: null }, "2026-08-10", "2026-08-16"), false);
  assert.equal(overlapsDateRange({ startDate: "2026-08-01", endDate: "2026-08-09" }, "2026-08-10", "2026-08-16"), false);
});

test("calendar overlap does not truncate a 165-performance week", () => {
  const performances = Array.from({ length: 165 }, (_, index) => ({
    id: String(index),
    startDate: "2026-08-10",
    endDate: "2026-08-16",
  }));
  const matching = performances.filter((item) => overlapsDateRange(item, "2026-08-10", "2026-08-16"));
  assert.equal(matching.length, 165);
});
