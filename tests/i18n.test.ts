import test from "node:test";
import assert from "node:assert/strict";
import { localeFromPathname, localizePath, localizedValue, localizedWork, stripLocalePrefix } from "../lib/i18n/locale.ts";

test("Korean URLs stay unchanged and English URLs use /en", () => {
  assert.equal(localizePath("/artists/kim", "ko"), "/artists/kim");
  assert.equal(localizePath("/artists/kim", "en"), "/en/artists/kim");
  assert.equal(localizePath("/en/companies/gongwon", "ko"), "/companies/gongwon");
  assert.equal(stripLocalePrefix("/en"), "/");
  assert.equal(localeFromPathname("/en/calendar"), "en");
});

test("English fields fall back for empty and whitespace-only values", () => {
  assert.equal(localizedValue({ bio: "한국어 소개", bio_en: "   " }, "bio", "bio_en", "en"), "한국어 소개");
  assert.equal(localizedValue({ bio: "한국어 소개", bio_en: "English bio" }, "bio", "bio_en", "en"), "English bio");
  assert.equal(localizedWork({ title: "작품", title_en: "" }, "en").title, "작품");
});
