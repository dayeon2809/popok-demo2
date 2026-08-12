import type { Opportunity, OpportunityViewerProfile } from "./types";

export type RegionGroup = "seoul" | "capital" | "chungcheong" | "jeolla" | "gyeongsang" | "gangwon" | "jeju" | "nationwide" | "overseas" | "other";

const REGION_PATTERNS: Array<[RegionGroup, RegExp]> = [
  ["nationwide", /전국|지역.?무관|온라인/],
  ["overseas", /해외|국외|international/i],
  ["seoul", /서울/],
  ["capital", /경기|인천|수도권/],
  ["chungcheong", /충북|충남|충청|대전|세종/],
  ["jeolla", /전북|전남|전라|광주/],
  ["gyeongsang", /경북|경남|경상|부산|대구|울산/],
  ["gangwon", /강원/],
  ["jeju", /제주/],
];

export function normalizeRegion(value?: string | null): RegionGroup {
  if (!value) return "other";
  return REGION_PATTERNS.find(([, pattern]) => pattern.test(value))?.[0] ?? "other";
}

const GENRE_ALIASES: Record<string, RegExp> = {
  dance: /dance|무용|발레|안무/i,
  music: /music|음악|연주|성악|국악/i,
  theatre_musical: /theatre|theater|연극|뮤지컬|배우/i,
  traditional: /traditional|전통|국악/i,
  interdisciplinary: /interdisciplinary|다원|융복합/i,
};

export function matchesProfileGenre(profileGenre: string | null | undefined, opportunityGenres: string[] = []) {
  if (!profileGenre || opportunityGenres.length === 0 || opportunityGenres.includes("all")) return false;
  return opportunityGenres.some((genre) => GENRE_ALIASES[genre]?.test(profileGenre) || profileGenre.toLowerCase().includes(genre));
}

export function recommendationScore(item: Opportunity, profile: OpportunityViewerProfile | null, now = new Date()) {
  if (!profile) return null;
  let score = 0;
  let signals = 0;
  if (profile.genre && item.artGenres?.length) { signals++; if (matchesProfileGenre(profile.genre, item.artGenres)) score += 35; }
  if (profile.role && item.opportunityType) {
    signals++;
    const role = profile.role.toLowerCase();
    const roleMatch = item.opportunityType === "audition" ? /배우|무용수|연주|성악|performer|actor|dancer|musician/.test(role)
      : item.opportunityType === "job" ? /기획|제작|행정|매니저|director|producer|manager/.test(role)
      : item.opportunityType === "education" ? /학생|신진|예비|student|emerging/.test(role)
      : ["grant", "open_call", "residency", "space"].includes(item.opportunityType);
    if (roleMatch) score += 25;
  }
  if (profile.region && item.location) { signals++; const a = normalizeRegion(profile.region); const b = normalizeRegion(item.location); if (a === b || b === "nationwide") score += 20; }
  if (item.targetAudience?.length && profile.careerItemCount >= 0) {
    signals++;
    const audience = item.targetAudience.join(" ");
    const isEmerging = /신진|청년|예비|학생/.test(audience);
    const isExperienced = /경력|전문|기성/.test(audience);
    if ((!isEmerging && !isExperienced) || (isEmerging && profile.careerItemCount <= 5) || (isExperienced && profile.careerItemCount >= 3)) score += 10;
  }
  if (item.deadline) { signals++; const days = Math.ceil((new Date(`${item.deadline}T23:59:59+09:00`).getTime() - now.getTime()) / 86400000); if (days > 7) score += 10; }
  return signals === 0 ? null : score;
}
