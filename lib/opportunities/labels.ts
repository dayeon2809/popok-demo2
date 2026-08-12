// Display-only label maps for the public Opportunities pages. Purely
// presentational — no effect on filtering, status, or ingestion logic.
import type { OpportunityType, ArtGenre } from "./domain";

type Locale = "ko" | "en";

const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, Record<Locale, string>> = {
  grant: { ko: "지원사업", en: "Grant" },
  open_call: { ko: "공모", en: "Open Call" },
  audition: { ko: "오디션", en: "Audition" },
  job: { ko: "채용", en: "Job" },
  education: { ko: "교육", en: "Education" },
  residency: { ko: "레지던시", en: "Residency" },
  space: { ko: "공간 지원", en: "Space" },
  event: { ko: "행사", en: "Event" },
  other: { ko: "기타", en: "Other" },
};

const ART_GENRE_LABELS: Record<ArtGenre, Record<Locale, string>> = {
  dance: { ko: "무용", en: "Dance" },
  music: { ko: "음악", en: "Music" },
  theatre_musical: { ko: "연극·뮤지컬", en: "Theatre & Musical" },
  traditional: { ko: "전통예술", en: "Traditional Arts" },
  visual: { ko: "시각예술", en: "Visual Arts" },
  interdisciplinary: { ko: "다원예술", en: "Interdisciplinary" },
  culture_planning: { ko: "문화기획", en: "Culture Planning" },
  all: { ko: "전체 분야", en: "All Genres" },
};

export function getOpportunityTypeLabel(type: string, locale: Locale = "ko"): string {
  return OPPORTUNITY_TYPE_LABELS[type as OpportunityType]?.[locale] ?? type;
}

export function getArtGenreLabel(genre: string, locale: Locale = "ko"): string {
  return ART_GENRE_LABELS[genre as ArtGenre]?.[locale] ?? genre;
}
