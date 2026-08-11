import assert from "node:assert/strict";
import test from "node:test";

import { ARTIST_ROLES, getArtistRoleLabel, matchesArtistRole } from "../lib/artistRoles.ts";

test("producer and critic keep stable Korean values and localized English labels", () => {
  assert.equal(getArtistRoleLabel("기획자", "ko"), "기획자");
  assert.equal(getArtistRoleLabel("기획자", "en"), "Producer");
  assert.equal(getArtistRoleLabel("평론가", "ko"), "평론가");
  assert.equal(getArtistRoleLabel("평론가", "en"), "Critic");
});

test("new roles follow all existing artist roles in the shared ordering", () => {
  assert.deepEqual(ARTIST_ROLES.slice(-2).map((role) => role.value), ["기획자", "평론가"]);
});

test("role filtering is exact while tolerating surrounding whitespace", () => {
  assert.equal(matchesArtistRole("기획자", "기획자"), true);
  assert.equal(matchesArtistRole(" 평론가 ", "평론가"), true);
  assert.equal(matchesArtistRole("공연 기획자", "기획자"), false);
  assert.equal(matchesArtistRole("무용평론가", "평론가"), false);
});

test("unknown legacy role labels remain visible instead of becoming other", () => {
  assert.equal(getArtistRoleLabel("드라마투르그", "en"), "드라마투르그");
});
