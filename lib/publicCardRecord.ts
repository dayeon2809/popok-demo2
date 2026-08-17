// /p/[id] 공개 카드가 submissions 행에서 밖으로 내보내도 되는 것만 남기는 곳.
//
// submissions 한 행에는 카드에 그리는 이름·장르·이미지와 함께 email,
// additional_requests(신청 시 남긴 요청사항), status(심사 상태), claim_code 가
// 들어 있다. 페이지는 이 행을 ClientCard("use client")에 통째로 넘기는데,
// 클라이언트 컴포넌트의 props 는 화면에 그리지 않아도 RSC 페이로드로 직렬화되어
// 브라우저까지 그대로 간다. id 가 순차 정수라 /p/1, /p/2 를 훑으면 신청자 명단이
// 통째로 나온다 — 그래서 "안 그리니까 괜찮다"가 성립하지 않는다.
//
// 아래 목록은 app/p/[id]/client-card.tsx 의 Props.record 가 실제로 읽는 필드와
// 1:1 로 맞춘 것이다. 카드에 새 필드를 그리려면 여기부터 늘려야 한다.

/** /p/[id] 조회에 쓸 select 컬럼 목록. `*` 를 다시 쓰지 않기 위한 단일 출처. */
export const PUBLIC_CARD_COLUMNS =
  "id, name, genre, instagram, profile_image_url, profile_image_urls, motion_video_url, works";

/** 밖으로 나가면 안 되는 컬럼. 테스트가 이 목록으로 PUBLIC_CARD_COLUMNS 를 검사한다. */
export const PRIVATE_SUBMISSION_COLUMNS = [
  "email",
  "claim_code",
  "additional_requests",
  "status",
  "owner_id",
  "parsed_profile",
  "public_slug",
] as const;

export interface PublicCardRegistrationMedia {
  kind: "popok_registration_media";
  profile_image_url: string | null;
  motion_video_url: string | null;
}

export interface PublicCardRecord {
  id: number;
  name: string;
  genre: string | null;
  instagram: string | null;
  profile_image_url: string | null;
  profile_image_urls: string[] | null;
  motion_video_url: string | null;
  works: PublicCardRegistrationMedia[];
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

// works 는 jsonb 이고 /api/popok-submit 이 클라이언트가 보낸 body.works 를 배열이기만
// 하면 그대로 저장한다. 카드가 읽는 것은 popok_registration_media 항목의 이미지·영상뿐이라
// 그 셋만 남긴다 — 임의의 객체가 페이로드를 타고 나가지 않도록.
function pickRegistrationMedia(works: unknown): PublicCardRegistrationMedia[] {
  if (!Array.isArray(works)) return [];
  return works
    .filter((item) => item && typeof item === "object" && item.kind === "popok_registration_media")
    .map((item) => ({
      kind: "popok_registration_media" as const,
      profile_image_url: asString(item.profile_image_url),
      motion_video_url: asString(item.motion_video_url),
    }));
}

/**
 * DB 행을 공개 카드용 객체로 좁힌다.
 *
 * select 를 컬럼 목록으로 바꾼 것만으로도 여분의 컬럼은 오지 않지만, 나중에 누가
 * select 를 되돌리거나 다른 경로로 행을 넘겨도 여기서 한 번 더 걸리도록 둔다.
 */
export function toPublicCardRecord(row: unknown): PublicCardRecord | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const id = Number(r.id);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    name: asString(r.name) ?? "",
    genre: asString(r.genre),
    instagram: asString(r.instagram),
    profile_image_url: asString(r.profile_image_url),
    profile_image_urls: Array.isArray(r.profile_image_urls)
      ? r.profile_image_urls.filter((url): url is string => typeof url === "string")
      : null,
    motion_video_url: asString(r.motion_video_url),
    works: pickRegistrationMedia(r.works),
  };
}
