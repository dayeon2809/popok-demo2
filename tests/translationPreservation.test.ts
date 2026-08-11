import test from "node:test";
import assert from "node:assert/strict";
import { cleanWorksForPayload } from "../lib/works.ts";
import { normalizeArtistAwards } from "../lib/artist-profile.ts";
import { normalizeCompanyAwards, normalizeCompanyHistory } from "../lib/company.ts";
import { localizedParallelStrings } from "../lib/i18n/locale.ts";

test("normalize → save → reload preserves nested English keys", () => {
  const works = cleanWorksForPayload([{ id: "w1", title: "작품", credits: [{ role: "안무", role_en: "Choreography", names: ["홍길동"] }] }]);
  assert.equal(works[0].credits[0].role_en, "Choreography");
  assert.equal(normalizeArtistAwards([{ title: "상", result: "대상", result_en: "Grand Prize" }])[0].result_en, "Grand Prize");
  assert.equal(normalizeCompanyAwards([{ title: "상", result: "대상", result_en: "Grand Prize" }])[0].result_en, "Grand Prize");
  assert.equal(normalizeCompanyHistory([{ year: "2024", event: "창단", description_en: "Founded" }])[0].description_en, "Founded");
});

test("parallel English arrays preserve index alignment and Korean fallback", () => {
  const ko = ["첫 활동", "둘째 활동", "Third activity"];
  const en = ["First activity", null, null];
  assert.deepEqual(localizedParallelStrings(ko, en, "en"), ["First activity", "둘째 활동", "Third activity"]);
  assert.deepEqual(localizedParallelStrings(ko, en, "ko"), ko);
});
