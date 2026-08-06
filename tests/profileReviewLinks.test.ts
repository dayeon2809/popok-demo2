import assert from "node:assert/strict";
import test from "node:test";
import { mapProfileSourceUrlsToReviewLinks } from "../lib/profileReviewLinks.ts";

test("작품 내부 reviewLinks를 언론 보도로 올리고 작품명을 연결한다", () => {
  const result = mapProfileSourceUrlsToReviewLinks({
    works: [{ title: "옛날 옛적에", year: 2016, reviewLinks: [{ title: "춤웹진 리뷰 - 고블린파티 〈옛날 옛적에〉", url: "http://koreadance.kr/review/303" }] }],
  });
  assert.deepEqual(result.review_links, [{ title: "춤웹진 리뷰 - 고블린파티 〈옛날 옛적에〉", publication: "춤웹진 리뷰 - 고블린파티 〈옛날 옛적에〉", work: "옛날 옛적에", url: "http://koreadance.kr/review/303", year: "2016" }]);
});

test("maps work.source to the actual review_links schema", () => {
  const result = mapProfileSourceUrlsToReviewLinks({ works: [{ title: "노동 (勞動)", year: 2022, source: "https://thepreview.co.kr/article/1" }] });
  assert.deepEqual(result.review_links, [{ title: "thepreview.co.kr", publication: "thepreview.co.kr", work: "노동 (勞動)", url: "https://thepreview.co.kr/article/1", year: "2022" }]);
});

test("maps every URL in work.sources", () => {
  const result = mapProfileSourceUrlsToReviewLinks({ works: [{ title: "작품 A", sources: ["https://example.com/one", "https://example.org/two"] }] });
  assert.deepEqual(result.review_links.map((item: any) => item.url), ["https://example.com/one", "https://example.org/two"]);
});

test("recognizes [publication] URL", () => {
  const result = mapProfileSourceUrlsToReviewLinks({ works: [{ title: "작품 A", source: "[더프리뷰] https://thepreview.co.kr/a" }] });
  assert.equal(result.review_links[0].title, "더프리뷰");
  assert.equal(result.review_links[0].publication, "더프리뷰");
});

test("recognizes markdown [publication](URL)", () => {
  const result = mapProfileSourceUrlsToReviewLinks({ works: [{ title: "작품 A", article: "[서울문화투데이](https://sctoday.co.kr/a)" }] });
  assert.equal(result.review_links[0].title, "서울문화투데이");
  assert.equal(result.review_links[0].url, "https://sctoday.co.kr/a");
});

test("connects award.source to one unambiguous normalized work title", () => {
  const result = mapProfileSourceUrlsToReviewLinks({
    works: [{ title: "서양극장 속 한옥 (초연)" }],
    awards: [{ year: 2024, title: "포르쉐 프런티어상", result: "수상작 <서양극장 속 한옥>", source: "https://seoulartsawards.com/winner" }],
  });
  assert.equal(result.review_links[0].work, "서양극장 속 한옥 (초연)");
  assert.equal(result.review_links[0].title, "포르쉐 프런티어상");
});

test("deduplicates the same URL across work and award sources", () => {
  const url = "https://example.com/same";
  const result = mapProfileSourceUrlsToReviewLinks({ works: [{ title: "작품 A", source: url }], awards: [{ title: "작품상", result: "수상작 <작품 A>", source: url }] });
  assert.equal(result.review_links.length, 1);
});

test("never treats affiliation URLs as work review links", () => {
  const result = mapProfileSourceUrlsToReviewLinks({ works: [{ title: "작품 A" }], affiliations: [{ name: "소속 단체", source: "https://company.example.com" }] });
  assert.deepEqual(result.review_links, []);
});

test("removes press source URLs from external links while preserving social links", () => {
  const pressUrl = "https://thepreview.co.kr/article";
  const result = mapProfileSourceUrlsToReviewLinks({
    works: [{ title: "작품 A", source: pressUrl }],
    links: [
      { label: "잘못 분류된 기사", url: pressUrl },
      { label: "Instagram", url: "https://instagram.com/artist" },
      { label: "LinkedIn", url: "https://linkedin.com/in/artist" },
    ],
  });

  assert.deepEqual(result.links, [
    { label: "Instagram", url: "https://instagram.com/artist" },
    { label: "LinkedIn", url: "https://linkedin.com/in/artist" },
  ]);
  assert.equal(result.review_links[0].url, pressUrl);
});
test("moves a press link returned only in links into review_links", () => {
  const result = mapProfileSourceUrlsToReviewLinks({
    works: [{ title: "노동 (勞動)" }],
    links: [
      { label: "thepreview", url: "https://www.thepreview.co.kr/article/123" },
      { label: "공식 홈페이지", url: "https://artist.example.com" },
      { label: "Instagram", url: "https://instagram.com/artist" },
    ],
  });

  assert.deepEqual(result.links, [
    { label: "공식 홈페이지", url: "https://artist.example.com" },
    { label: "Instagram", url: "https://instagram.com/artist" },
  ]);
  assert.equal(result.review_links[0].publication, "thepreview");
  assert.equal(result.review_links[0].url, "https://www.thepreview.co.kr/article/123");
});
test("does not guess when a base award title matches multiple work variants", () => {
  const result = mapProfileSourceUrlsToReviewLinks({
    works: [{ title: "서양극장 속 한옥 (초연)" }, { title: "서양극장 속 한옥 (확장/재공연판)" }],
    awards: [{ title: "작품상", result: "수상작 <서양극장 속 한옥>", source: "https://example.com/award" }],
  });
  assert.deepEqual(result.review_links, []);
});
test("maps Korean article, review, and source keys into review_links", () => {
  const result = mapProfileSourceUrlsToReviewLinks({
    works: [{
      title: "작품 A",
      "\uAE30\uC0AC": "https://news.example.com/article",
      "\uB9AC\uBDF0": "https://review.example.com/work-a",
      "\uCD9C\uCC98": "https://press.example.com/work-a",
    }],
  });
  assert.deepEqual(result.review_links.map((item: any) => item.url), [
    "https://news.example.com/article",
    "https://review.example.com/work-a",
    "https://press.example.com/work-a",
  ]);
});

test("removes an existing external link after the same URL is classified as press", () => {
  const pressUrl = "https://news.example.com/profile";
  const result = mapProfileSourceUrlsToReviewLinks({
    links: [
      { label: "기사", url: pressUrl },
      { label: "Instagram", url: "https://instagram.com/artist" },
    ],
    review_links: [{ title: "프로필 기사", publication: "News", work: "", url: pressUrl }],
  });
  assert.deepEqual(result.links, [{ label: "Instagram", url: "https://instagram.com/artist" }]);
  assert.equal(result.review_links[0].url, pressUrl);
});
