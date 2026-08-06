import test from "node:test";
import assert from "node:assert/strict";
import { mergeLinks, mergeWorks } from "../lib/mergeCompanyArrays.ts";

test("같은 작품을 반복 병합해도 중복되지 않고 빈 필드만 보완한다", () => {
  const existing = [{ title: "신선 (神仙)", year: "2022", description: "" }];
  const incoming = [{ title: "〈신선 (神仙)〉", year: "2022", description: "작품 설명" }];
  const twice = mergeWorks(mergeWorks(existing, incoming), incoming);
  assert.equal(twice.length, 1);
  assert.equal(twice[0].description, "작품 설명");
});

test("추적 파라미터만 다른 같은 기사 URL은 중복되지 않고 작품 연결을 보완한다", () => {
  const existing = [{ title: "더프리뷰 기사", url: "https://www.thepreview.co.kr/news/1?utm_source=test", work: "" }];
  const incoming = [{ title: "더프리뷰 기사", url: "https://thepreview.co.kr/news/1", work: "솔직히" }];
  const merged = mergeLinks(existing, incoming);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].work, "솔직히");
});

test("기존 데이터에 이미 생긴 작품 중복도 다음 병합에서 정리한다", () => {
  const duplicated = [
    { title: "옛날 옛적에", year: "2016", description: "" },
    { title: "〈옛날 옛적에〉", year: "2016", description: "작품 설명" },
  ];
  const merged = mergeWorks(duplicated, []);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].description, "작품 설명");
});
