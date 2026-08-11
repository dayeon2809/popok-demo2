import { z } from "zod";

// AI Parser가 submissions 원문(bio_short, additional_requests 등)을 구조화한 결과.
// submissions.parsed_profile (jsonb) 컬럼에 그대로 저장되며, 관리자가 검수/수정한 뒤
// "공개 승인" 시에만 artists 테이블로 upsert된다.

export interface ParsedArtist {
  name: string;
  name_en: string | null;
  genre: string;
  bio_short: string;
  summary: string;
}

export interface ParsedAffiliation {
  name: string;
  position: string | null;
}

export interface ParsedWork {
  title: string;
  organization: string | null;
  festival: string | null;
  role: string | null;
  year: number | null;
  type: "performance" | "broadcast" | "music_video" | string;
  description: string | null;
}

export interface ParsedAward {
  year: number | null;
  title: string;
  organization: string | null;
  result: string;
}

export interface ParsedCompetition {
  year: number | null;
  title: string;
  organization: string | null;
  result: string;
}

export interface ParsedLink {
  label: string | null;
  url: string;
}

export interface ParsedMedia {
  type: string | null;
  url: string;
  caption: string | null;
}

export interface ParsedArtistProfile {
  artist: ParsedArtist;
  affiliations: ParsedAffiliation[];
  current_activity: string[];
  works: ParsedWork[];
  awards: ParsedAward[];
  competitions: ParsedCompetition[];
  education: string[];
  media: ParsedMedia[];
  links: ParsedLink[];
  warnings: string[];
}

const nullableString = z.string().nullable();
// year는 POPOK 전역에서 숫자로 다룬다 (예: 2025). 문자열("2025")이나 "연도미상" 같은 텍스트는 받지 않는다.
const nullableYear = z.number().int().nullable();

export const parsedArtistSchema = z.object({
  name: z.string(),
  name_en: nullableString,
  genre: z.string(),
  bio_short: z.string(),
  summary: z.string(),
});

export const parsedAffiliationSchema = z.object({
  name: z.string(),
  position: nullableString,
});

export const parsedWorkSchema = z.object({
  title: z.string(),
  organization: nullableString,
  festival: nullableString,
  role: nullableString,
  year: nullableYear,
  type: z.string(),
  description: nullableString,
});

export const parsedAwardSchema = z.object({
  year: nullableYear,
  title: z.string(),
  organization: nullableString,
  result: z.string(),
});

export const parsedCompetitionSchema = z.object({
  year: nullableYear,
  title: z.string(),
  organization: nullableString,
  result: z.string(),
});

export const parsedLinkSchema = z.object({
  label: nullableString,
  url: z.string(),
});

export const parsedMediaSchema = z.object({
  type: nullableString,
  url: z.string(),
  caption: nullableString,
});

export const parsedArtistProfileSchema = z.object({
  artist: parsedArtistSchema,
  affiliations: z.array(parsedAffiliationSchema),
  current_activity: z.array(z.string()),
  works: z.array(parsedWorkSchema),
  awards: z.array(parsedAwardSchema),
  competitions: z.array(parsedCompetitionSchema),
  education: z.array(z.string()),
  media: z.array(parsedMediaSchema),
  links: z.array(parsedLinkSchema),
  warnings: z.array(z.string()),
});

export type ParserStatus = "not_parsed" | "parsing" | "parsed" | "reviewed" | "error";

export function emptyParsedProfile(seed?: { name?: string; genre?: string }): ParsedArtistProfile {
  return {
    artist: {
      name: seed?.name || "",
      name_en: null,
      genre: seed?.genre || "",
      bio_short: "",
      summary: "",
    },
    affiliations: [],
    current_activity: [],
    works: [],
    awards: [],
    competitions: [],
    education: [],
    media: [],
    links: [],
    warnings: [],
  };
}
