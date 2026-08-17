import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PUBLIC_CARD_COLUMNS,
  PRIVATE_SUBMISSION_COLUMNS,
  toPublicCardRecord,
} from "../lib/publicCardRecord.ts";

// /p/[id] 는 service role 키로 submissions 를 읽고 그 행을 클라이언트 컴포넌트에
// 넘긴다. 클라이언트 컴포넌트의 props 는 화면에 그리지 않아도 RSC 페이로드에
// 직렬화되므로, 행 전체를 넘기면 신청자 email·claim_code·요청사항·심사 상태가
// /p/1, /p/2 … 를 훑는 것만으로 수집된다. 아래 테스트는 그 경로를 다시 열면
// (select 를 "*" 로 되돌리거나 좁히기 함수를 걷어내면) 실패한다.

const columns = PUBLIC_CARD_COLUMNS.split(",").map((c) => c.trim());

// 실제 신청 행의 모양 — 공개 필드와 비공개 필드가 한 행에 섞여 있다.
const submissionRow = {
  id: 42,
  name: "김무용",
  genre: "컨템포러리",
  instagram: "@kim",
  profile_image_url: "https://cdn.example.com/a.jpg",
  profile_image_urls: ["https://cdn.example.com/a.jpg", 7, null],
  motion_video_url: "https://youtube.com/watch?v=x",
  works: [
    { kind: "popok_registration_media", profile_image_url: "https://cdn.example.com/a.jpg", motion_video_url: null, internal_note: "심사 보류" },
    { kind: "something_else", secret: "밖으로 나가면 안 됨" },
  ],
  email: "kim@example.com",
  claim_code: "poc_deadbeef",
  additional_requests: "인스타 아이디를 바꿔주세요",
  status: "pending",
  owner_id: "00000000-0000-0000-0000-000000000000",
  public_slug: "kim-muyong",
  parsed_profile: { note: "AI 파싱 결과" },
};

test("select 컬럼 목록에 비공개 컬럼이 하나도 없다", () => {
  for (const forbidden of PRIVATE_SUBMISSION_COLUMNS) {
    assert.equal(
      columns.includes(forbidden),
      false,
      `${forbidden} 은 공개 카드 select 에 들어가면 안 된다`
    );
  }
  assert.equal(columns.includes("*"), false, 'select("*") 로 되돌리면 안 된다');
});

test("좁히기 함수가 비공개 필드를 결과에서 떨군다", () => {
  const result = toPublicCardRecord(submissionRow);
  assert.ok(result);
  for (const forbidden of PRIVATE_SUBMISSION_COLUMNS) {
    assert.equal(forbidden in result, false, `${forbidden} 이 결과에 남아 있다`);
  }
  // 직렬화된 페이로드 자체에도 값이 남지 않아야 한다 — 키만 지우고 중첩 객체에
  // 흘려보내는 실수를 잡기 위해 문자열로 확인한다.
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes("kim@example.com"), false);
  assert.equal(serialized.includes("poc_deadbeef"), false);
  assert.equal(serialized.includes("인스타 아이디를 바꿔주세요"), false);
  assert.equal(serialized.includes("밖으로 나가면 안 됨"), false);
  assert.equal(serialized.includes("심사 보류"), false);
});

test("카드가 그리는 필드는 그대로 살아 있다", () => {
  // 과하게 좁혀서 카드가 빈 화면이 되는 반대 방향의 회귀도 막는다.
  const result = toPublicCardRecord(submissionRow);
  assert.ok(result);
  assert.equal(result.id, 42);
  assert.equal(result.name, "김무용");
  assert.equal(result.genre, "컨템포러리");
  assert.equal(result.instagram, "@kim");
  assert.equal(result.profile_image_url, "https://cdn.example.com/a.jpg");
  assert.deepEqual(result.profile_image_urls, ["https://cdn.example.com/a.jpg"]);
  assert.equal(result.motion_video_url, "https://youtube.com/watch?v=x");
});

test("works 는 등록 미디어 항목의 이미지·영상만 남는다", () => {
  const result = toPublicCardRecord(submissionRow);
  assert.ok(result);
  assert.equal(result.works.length, 1);
  assert.deepEqual(Object.keys(result.works[0]).sort(), [
    "kind",
    "motion_video_url",
    "profile_image_url",
  ]);
  assert.equal(result.works[0].profile_image_url, "https://cdn.example.com/a.jpg");
  assert.equal(result.works[0].motion_video_url, null);
});

test("결과 키와 select 컬럼 목록이 어긋나지 않는다", () => {
  // 한쪽만 늘리면 화면이 조용히 깨지거나, 안 쓰는 컬럼을 계속 읽게 된다.
  const result = toPublicCardRecord(submissionRow);
  assert.ok(result);
  assert.deepEqual(Object.keys(result).sort(), [...columns].sort());
});

test("행이 없거나 모양이 이상하면 null 을 준다", () => {
  assert.equal(toPublicCardRecord(null), null);
  assert.equal(toPublicCardRecord(undefined), null);
  assert.equal(toPublicCardRecord("문자열"), null);
  assert.equal(toPublicCardRecord({ name: "id 없음" }), null);
});

test("works 가 배열이 아니어도 터지지 않는다", () => {
  const result = toPublicCardRecord({ id: 1, name: "a", works: { kind: "popok_registration_media" } });
  assert.ok(result);
  assert.deepEqual(result.works, []);
});

test("페이지가 select(\"*\") 로 되돌아가 있지 않다", () => {
  // 위 테스트들은 lib 안의 목록만 지킨다. 정작 유출은 페이지가 "*" 로 읽을 때
  // 일어나므로, 호출부가 목록을 실제로 쓰고 있는지 소스에서 확인한다.
  const source = readFileSync(new URL("../app/p/[id]/page.tsx", import.meta.url), "utf8");
  assert.match(source, /\.select\(PUBLIC_CARD_COLUMNS\)/);
  assert.equal(/\.select\(\s*["'`]\*["'`]\s*\)/.test(source), false, 'select("*") 가 다시 들어왔다');
  assert.match(source, /toPublicCardRecord\(/);
});
