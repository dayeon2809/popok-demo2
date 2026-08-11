import test from "node:test";
import assert from "node:assert/strict";
import { buildPerformanceShelves, curateProfiles, selectMagazineCover } from "../lib/calendarMagazine.ts";
import type { Artist, Company, Performance } from "../types/index.ts";

const reference = new Date("2026-08-11T03:00:00Z");
const performance = (overrides: Partial<Performance>): Performance => ({
  id: "base", title: "Base", status: "published", startDate: "2026-08-12", endDate: "2026-08-13", relatedArtists: [], ...overrides,
});

test("cover selection prioritizes featured, then POPOK-linked, then nearest", () => {
  const nearest = performance({ id: "nearest", startDate: "2026-08-11" });
  const linked = performance({ id: "linked", startDate: "2026-08-15", companyId: "company-1" });
  const featured = performance({ id: "featured", startDate: "2026-08-20", featured: true });
  assert.equal(selectMagazineCover([nearest, linked, featured], reference)?.id, "featured");
  assert.equal(selectMagazineCover([nearest, linked], reference)?.id, "linked");
  assert.equal(selectMagazineCover([nearest], reference)?.id, "nearest");
});

test("performance shelves omit ended performances and empty categories", () => {
  const shelves = buildPerformanceShelves([
    performance({ id: "today", startDate: "2026-08-10", endDate: "2026-08-11" }),
    performance({ id: "ended", startDate: "2026-08-01", endDate: "2026-08-02" }),
  ], reference);
  assert.ok(shelves.some((shelf) => shelf.key === "today" && shelf.items[0]?.id === "today"));
  assert.ok(shelves.every((shelf) => shelf.items.every((item) => item.id !== "ended")));
  assert.ok(shelves.every((shelf) => shelf.items.length > 0));
});

test("profile curation interleaves artists and companies without duplicates", () => {
  const artists = [{ id: "a1", name: "Artist One", status: "published", updatedAt: "2026-08-10", view_count: 10 }] as Artist[];
  const companies = [{ id: "c1", name: "Company One", status: "published", updatedAt: "2026-08-09", view_count: 20 }] as Company[];
  const result = curateProfiles(artists, companies, [], 8);
  assert.deepEqual(result.map((item) => item.kind), ["artist", "company"]);
  assert.equal(new Set(result.map((item) => item.key)).size, result.length);
});
