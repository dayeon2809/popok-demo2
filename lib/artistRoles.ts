export const ARTIST_ROLES = [
  { value: "무용수", ko: "무용수", en: "Dancer" },
  { value: "안무가", ko: "안무가", en: "Choreographer" },
  { value: "배우", ko: "배우", en: "Actor" },
  { value: "단원", ko: "단원", en: "Company Member" },
  { value: "예술감독", ko: "예술감독", en: "Artistic Director" },
  { value: "작곡가", ko: "작곡가", en: "Composer" },
  { value: "지휘자", ko: "지휘자", en: "Conductor" },
  { value: "연주자", ko: "연주자", en: "Instrumentalist" },
  { value: "성악가", ko: "성악가", en: "Vocalist" },
  { value: "기획자", ko: "기획자", en: "Producer" },
  { value: "평론가", ko: "평론가", en: "Critic" },
] as const;

export type ArtistRoleValue = (typeof ARTIST_ROLES)[number]["value"];
export type ArtistRoleLocale = "ko" | "en";

export function getArtistRoleLabel(role: string | null | undefined, locale: ArtistRoleLocale): string {
  if (!role) return "";
  const normalized = role.trim();
  const option = ARTIST_ROLES.find((item) => item.value === normalized);
  return option ? option[locale] : normalized;
}

export function matchesArtistRole(role: string | null | undefined, expected: ArtistRoleValue): boolean {
  return role?.trim() === expected;
}
