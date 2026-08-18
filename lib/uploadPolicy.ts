// /api/upload 이 무엇을, 어디에, 얼마나 받아 주는지 한곳에 모은 규칙.
//
// 이 엔드포인트는 service role 키로 Storage 에 쓴다. 즉 Supabase 쪽 정책이
// 막아 주지 않으므로, 여기서 거르지 않으면 그대로 통과한다. 예전에는
//   - 인증이 전혀 없었고
//   - bucket 을 폼 필드로 받아 그대로 썼으며(비공개 버킷도 지정 가능)
//   - path 도 폼 필드였고
//   - MIME 을 보지 않았고
//   - 이미지 경로에는 용량 상한이 없었다
// 아무나 우리 Storage 를 채울 수 있었다는 뜻이고, 그건 유출이자 요금이다.
//
// 규칙을 라우트가 아니라 여기에 둔 이유는 DB·네트워크 없이 테스트할 수 있게
// 하기 위해서다. tests/uploadPolicy.test.ts 참조.

/** 이미지가 갈 수 있는 유일한 버킷. 폼이 보내는 bucket 값은 이것과 같을 때만 통과한다. */
export const IMAGE_BUCKET = "artist-media";

/** 이력서 전용 비공개 버킷 — 공개 URL 이 생기지 않는다. */
export const ORG_RESUME_BUCKET = "org-applications";

export const IMAGE_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const RESUME_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// SVG 는 일부러 뺐다 — 공개 버킷에 올라간 SVG 는 스크립트를 품은 문서로 열릴 수 있다.
export const IMAGE_EXTENSION_FOR_MIME: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
};

// 호출부가 실제로 쓰는 경로의 첫 칸들. app/my-popok, components/company/CompanyCmsEditor,
// app/admin/(protected)/{companies,performances}, app/organizations/apply 와 기본값(submissions).
export const ALLOWED_PATH_ROOTS = [
  "submissions",
  "artists",
  "companies",
  "performances",
  "organizations",
] as const;

// 로그인하지 않은 사람에게도 열어 두는 경로. 단체 신청 폼(/organizations/apply)은
// 계정 없이 쓰는 화면이라 로고 업로드까지 막으면 신청 자체가 불가능해진다.
export const ANONYMOUS_PATH_PREFIXES = ["organizations/logos"] as const;

export const MAX_PATH_SEGMENTS = 4;

/** Storage 키에 남길 문자만 남긴다. 사용자 입력이 경로에 섞여 들어와도 안전하도록. */
export function sanitizeStoragePath(input: string): string {
  return input
    .toLowerCase()
    .split("/")
    .map((segment) =>
      segment
        .replace(/[^a-z0-9\-_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
    )
    .filter(Boolean)
    .join("/");
}

/**
 * 파일 앞머리를 보고 진짜 이미지인지 확인한다.
 *
 * file.type 은 브라우저가 보내는 값이라 얼마든지 속일 수 있다. 여기서 걸러야
 * "image/webp 라고 적힌 HTML" 같은 것이 공개 버킷에 들어가지 않는다.
 */
export function sniffImageMime(bytes: Uint8Array): string | null {
  const startsWith = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  const ascii = (offset: number, text: string) =>
    [...text].every((ch, i) => bytes[offset + i] === ch.charCodeAt(0));

  if (startsWith(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (ascii(0, "GIF87a") || ascii(0, "GIF89a")) return "image/gif";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "image/webp";
  // ISO-BMFF 계열: 4~7바이트가 "ftyp", 그다음 브랜드로 avif/heic 를 가른다.
  if (ascii(4, "ftyp")) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (brand === "avif" || brand === "avis") return "image/avif";
    if (brand.startsWith("hei") || brand.startsWith("mif") || brand.startsWith("msf")) return "image/heic";
  }
  return null;
}

export interface ImageUploadRequest {
  bucket: string;
  path: string;
  declaredMime: string;
  size: number;
  head: Uint8Array;
  isAuthenticated: boolean;
}

export type ImageUploadDecision =
  | { ok: true; bucket: string; pathPrefix: string; extension: string; contentType: string }
  | { ok: false; status: number; error: string };

function isAnonymousAllowed(pathPrefix: string): boolean {
  return ANONYMOUS_PATH_PREFIXES.some(
    (allowed) => pathPrefix === allowed || pathPrefix.startsWith(`${allowed}/`)
  );
}

/** 이미지 업로드 한 건을 받아도 되는지 판단한다. 통과하면 저장에 쓸 값들을 돌려준다. */
export function decideImageUpload(req: ImageUploadRequest): ImageUploadDecision {
  if (req.bucket !== IMAGE_BUCKET) {
    return { ok: false, status: 400, error: "허용되지 않은 저장 위치입니다." };
  }

  const pathPrefix = sanitizeStoragePath(req.path) || "submissions";
  const segments = pathPrefix.split("/");
  if (segments.length > MAX_PATH_SEGMENTS) {
    return { ok: false, status: 400, error: "허용되지 않은 저장 위치입니다." };
  }
  if (!(ALLOWED_PATH_ROOTS as readonly string[]).includes(segments[0])) {
    return { ok: false, status: 400, error: "허용되지 않은 저장 위치입니다." };
  }

  // 로그인 없이 열어 둔 경로는 단체 신청 로고뿐이다. 나머지는 로그인 또는
  // 관리자 세션이 있어야 한다 — 예전에는 이 확인이 아예 없었다.
  if (!req.isAuthenticated && !isAnonymousAllowed(pathPrefix)) {
    return { ok: false, status: 401, error: "로그인이 필요합니다." };
  }

  if (!Number.isFinite(req.size) || req.size <= 0) {
    return { ok: false, status: 400, error: "빈 파일은 업로드할 수 없습니다." };
  }
  if (req.size > IMAGE_MAX_FILE_SIZE) {
    return { ok: false, status: 413, error: "이미지 크기는 10MB를 초과할 수 없습니다." };
  }

  const declared = req.declaredMime.split(";")[0].trim().toLowerCase();
  if (!IMAGE_EXTENSION_FOR_MIME[declared]) {
    return { ok: false, status: 415, error: "JPG, PNG, WebP, GIF, AVIF, HEIC 이미지만 업로드할 수 있습니다." };
  }

  const sniffed = sniffImageMime(req.head);
  if (!sniffed) {
    return { ok: false, status: 415, error: "이미지 파일이 아닙니다." };
  }

  // 확장자와 Content-Type 은 신고값이 아니라 실제 내용으로 정한다.
  const extension = IMAGE_EXTENSION_FOR_MIME[sniffed] ?? IMAGE_EXTENSION_FOR_MIME[declared];
  return { ok: true, bucket: IMAGE_BUCKET, pathPrefix, extension, contentType: sniffed };
}
