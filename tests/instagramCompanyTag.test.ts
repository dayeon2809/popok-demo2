import test from "node:test";
import assert from "node:assert/strict";
import {
  createCompanyInstagramTag,
  extractHashtags,
  hasCompanyInstagramTag,
} from "../lib/instagram.ts";

test("createCompanyInstagramTag strips whitespace and appends 포퐄", () => {
  assert.equal(createCompanyInstagramTag("공원"), "#공원포퐄");
  assert.equal(createCompanyInstagramTag("해니쉬 발레"), "#해니쉬발레포퐄");
  assert.equal(createCompanyInstagramTag("여니스트 컴퍼니"), "#여니스트컴퍼니포퐄");
  assert.equal(createCompanyInstagramTag("Project A"), "#ProjectA포퐄");
});

test("createCompanyInstagramTag strips punctuation/symbols that would break hashtag matching", () => {
  assert.equal(createCompanyInstagramTag("공원!"), "#공원포퐄");
  assert.equal(createCompanyInstagramTag("LDP (Laboratory Dance Project)"), "#LDPLaboratoryDanceProject포퐄");
});

test("createCompanyInstagramTag returns empty string for empty/punctuation-only input", () => {
  assert.equal(createCompanyInstagramTag(""), "");
  assert.equal(createCompanyInstagramTag(null), "");
  assert.equal(createCompanyInstagramTag("!!!"), "");
});

test("extractHashtags pulls every #tag token out of a caption", () => {
  assert.deepEqual(extractHashtags("공원 대표 인터뷰 #공원포퐄 #퐄터뷰"), ["#공원포퐄", "#퐄터뷰"]);
  assert.deepEqual(extractHashtags("no hashtags here"), []);
  assert.deepEqual(extractHashtags(null), []);
  assert.deepEqual(extractHashtags(""), []);
});

test("hasCompanyInstagramTag: matches when the exact dedicated tag is present", () => {
  assert.equal(hasCompanyInstagramTag("오늘의 인터뷰! #공원포퐄", "공원"), true);
});

test("hasCompanyInstagramTag: does not match on a plain-sentence mention of the company name", () => {
  assert.equal(hasCompanyInstagramTag("오늘은 공원에서 산책했어요", "공원"), false);
});

test("hasCompanyInstagramTag: matches company names with internal spaces", () => {
  assert.equal(hasCompanyInstagramTag("이번 시즌 신작 소식 #해니쉬발레포퐄", "해니쉬 발레"), true);
});

test("hasCompanyInstagramTag: does not match a longer, different hashtag as a substring", () => {
  assert.equal(hasCompanyInstagramTag("특별 소식 #공원포퐄프로젝트", "공원"), false);
});

test("hasCompanyInstagramTag: is case-insensitive for latin company names", () => {
  assert.equal(hasCompanyInstagramTag("새 프로젝트 공개 #projecta포퐄", "Project A"), true);
});

test("hasCompanyInstagramTag: null/empty caption never matches, no throw", () => {
  assert.equal(hasCompanyInstagramTag(null, "공원"), false);
  assert.equal(hasCompanyInstagramTag("", "공원"), false);
  assert.equal(hasCompanyInstagramTag(undefined, "공원"), false);
});

test("hasCompanyInstagramTag: empty/blank company name never matches", () => {
  assert.equal(hasCompanyInstagramTag("#공원포퐄", ""), false);
  assert.equal(hasCompanyInstagramTag("#공원포퐄", null), false);
});
