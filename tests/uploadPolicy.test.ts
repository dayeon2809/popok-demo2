import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  decideImageUpload,
  sanitizeStoragePath,
  sniffImageMime,
  IMAGE_MAX_FILE_SIZE,
} from "../lib/uploadPolicy.ts";

// /api/upload 은 service role 키로 Storage 에 쓴다. Supabase 쪽 정책이 걸러 주지
// 않으므로 이 판단 함수가 유일한 문이다. 예전에는 인증도, 버킷·경로·형식·용량
// 제한도 없어서 누구나 우리 버킷에 아무 파일이나 넣을 수 있었다.

const bytesOf = (...values: number[]) => new Uint8Array(values);
const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

const PNG = bytesOf(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0, 0, 0, 0);
const JPEG = bytesOf(0xff, 0xd8, 0xff, 0xe0, 0, 16, ...ascii("JFIF"), 0, 1, 1, 0, 0, 0);
const GIF = bytesOf(...ascii("GIF89a"), 1, 0, 1, 0, 0, 0, 0, 0, 0, 0);
const WEBP = bytesOf(...ascii("RIFF"), 26, 0, 0, 0, ...ascii("WEBP"), ...ascii("VP8 "));
const AVIF = bytesOf(0, 0, 0, 32, ...ascii("ftyp"), ...ascii("avif"), 0, 0, 0, 0);
const HTML = bytesOf(...ascii("<!doctype html><h1>"));
const SVG = bytesOf(...ascii("<svg xmlns='http:"));

const base = {
  bucket: "artist-media",
  path: "artists/media",
  declaredMime: "image/webp",
  size: 100_000,
  head: WEBP,
  isAuthenticated: true,
};

test("정상적인 로그인 업로드는 통과한다", () => {
  const decision = decideImageUpload(base);
  assert.equal(decision.ok, true);
  assert.equal(decision.bucket, "artist-media");
  assert.equal(decision.pathPrefix, "artists/media");
  assert.equal(decision.extension, "webp");
  assert.equal(decision.contentType, "image/webp");
});

test("artist-media 가 아닌 버킷은 거부한다", () => {
  // 예전에는 bucket 이 폼 필드 그대로였다 — 이력서가 들어 있는 비공개
  // org-applications 버킷에도 아무나 쓸 수 있었다는 뜻이다.
  for (const bucket of ["org-applications", "avatars", ""]) {
    const decision = decideImageUpload({ ...base, bucket });
    assert.equal(decision.ok, false, `${bucket} 이 통과했다`);
    assert.equal(decision.status, 400);
  }
});

test("허용 목록 밖의 경로는 거부한다", () => {
  for (const path of ["secrets", "org-applications/resumes", "../../etc/passwd", "a/b/c/d/e"]) {
    const decision = decideImageUpload({ ...base, path });
    assert.equal(decision.ok, false, `${path} 가 통과했다`);
  }
});

test("호출부가 실제로 쓰는 경로는 전부 통과한다", () => {
  // app/my-popok, components/company/CompanyCmsEditor,
  // app/admin/(protected)/{companies,performances}, 그리고 기본값.
  for (const path of [
    "artists/media",
    "companies/logo",
    "companies/slider",
    "companies/works",
    "companies/17/representative",
    "performances/42",
    "organizations/logos",
    "submissions",
  ]) {
    const decision = decideImageUpload({ ...base, path });
    assert.equal(decision.ok, true, `${path} 가 막혔다 — 화면이 깨진다`);
  }
});

test("로그인하지 않으면 단체 신청 로고 말고는 막힌다", () => {
  const anon = { ...base, isAuthenticated: false };
  // /organizations/apply 는 계정 없이 쓰는 신청 폼이라 여기만 열어 둔다.
  assert.equal(decideImageUpload({ ...anon, path: "organizations/logos" }).ok, true);

  for (const path of ["artists/media", "companies/works", "performances/1", "submissions", "organizations"]) {
    const decision = decideImageUpload({ ...anon, path });
    assert.equal(decision.ok, false, `비로그인이 ${path} 에 쓸 수 있다`);
    assert.equal(decision.status, 401);
  }
});

test("용량 상한이 있다", () => {
  assert.equal(decideImageUpload({ ...base, size: IMAGE_MAX_FILE_SIZE }).ok, true);
  const tooBig = decideImageUpload({ ...base, size: IMAGE_MAX_FILE_SIZE + 1 });
  assert.equal(tooBig.ok, false);
  assert.equal(tooBig.status, 413);
  assert.equal(decideImageUpload({ ...base, size: 0 }).ok, false);
});

test("이미지가 아닌 형식은 신고값 단계에서 막힌다", () => {
  for (const mime of ["image/svg+xml", "application/pdf", "text/html", ""]) {
    const decision = decideImageUpload({ ...base, declaredMime: mime, head: SVG });
    assert.equal(decision.ok, false, `${mime} 가 통과했다`);
    assert.equal(decision.status, 415);
  }
});

test("확장자·Content-Type 을 속인 파일은 내용을 보고 막는다", () => {
  // file.type 은 브라우저가 보내는 값이라 얼마든지 위조된다. HTML 을
  // image/webp 라고 신고해도 공개 버킷에 들어가면 안 된다.
  const decision = decideImageUpload({ ...base, declaredMime: "image/webp", head: HTML });
  assert.equal(decision.ok, false);
  assert.equal(decision.status, 415);
});

test("Content-Type 은 신고값이 아니라 실제 내용으로 정해진다", () => {
  // jpg 라고 신고했지만 내용은 PNG — 저장은 PNG 로 한다.
  const decision = decideImageUpload({ ...base, declaredMime: "image/jpeg", head: PNG });
  assert.equal(decision.ok, true);
  assert.equal(decision.contentType, "image/png");
  assert.equal(decision.extension, "png");
});

test("브라우저가 실제로 만드는 형식들을 알아본다", () => {
  // 압축 helper 는 image/webp 를 만들고, 압축을 건너뛴 원본은 jpeg/png/gif/avif 로 온다.
  assert.equal(sniffImageMime(WEBP), "image/webp");
  assert.equal(sniffImageMime(JPEG), "image/jpeg");
  assert.equal(sniffImageMime(PNG), "image/png");
  assert.equal(sniffImageMime(GIF), "image/gif");
  assert.equal(sniffImageMime(AVIF), "image/avif");
  assert.equal(sniffImageMime(HTML), null);
  assert.equal(sniffImageMime(SVG), null);
  assert.equal(sniffImageMime(new Uint8Array()), null);
});

test("경로 정리는 상위 디렉터리 이동과 이상한 문자를 없앤다", () => {
  assert.equal(sanitizeStoragePath("../../secrets"), "secrets");
  assert.equal(sanitizeStoragePath("Companies/../Works"), "companies/works");
  assert.equal(sanitizeStoragePath("artists//media/"), "artists/media");
  assert.equal(sanitizeStoragePath("한글 경로"), "");
});

test("라우트가 판단 함수를 실제로 부르고 있다", () => {
  // 규칙 모듈만 지켜 봐야 라우트가 옛 코드로 돌아가면 소용이 없다.
  const source = readFileSync(new URL("../app/api/upload/route.ts", import.meta.url), "utf8");
  assert.match(source, /decideImageUpload\(/);
  assert.match(source, /checkRateLimit\(/);
  assert.match(source, /isAuthenticatedRequest\(\)/);
  assert.match(source, /contentType: decision\.contentType/);
  assert.equal(/upsert:\s*true/.test(source), false, "임의 덮어쓰기가 다시 켜졌다");
  assert.equal(/\.from\(bucket\)/.test(source), false, "폼이 보낸 bucket 을 그대로 쓰고 있다");
});
