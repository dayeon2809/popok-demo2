import OpenAI from "openai";
import { z } from "zod";
import { PROFILE_EXTRACTION_PROMPT } from "@/lib/prompts/profileExtractionPrompt";
import { PROFILE_SUMMARY_PROMPT } from "@/lib/prompts/profileSummaryPrompt";
import { WORK_DESCRIPTION_PROMPT } from "@/lib/prompts/workDescriptionPrompt";

// Zod validation schema matching the POPOK parsed profile structure
export const parsedProfileSchema = z.object({
  artist: z.object({
    name: z.string().default(""),
    name_en: z.string().default(""),
    genre: z.string().default(""),
    role: z.string().default(""),
    bio_short: z.string().default(""),
    bio: z.string().default(""),
  }),
  affiliations: z.array(z.object({
    name: z.string().default(""),
    position: z.string().nullable().default(null)
  })).default([]),
  current_activity: z.array(z.string()).default([]),
  works: z.array(z.object({
    title: z.string().default(""),
    year: z.string().default(""),
    role: z.string().default(""),
    description: z.string().default(""),
    image_url: z.string().optional().default(""),
    video_url: z.string().optional().default(""),
  })).default([]),
  awards: z.array(z.object({
    year: z.string().default(""),
    title: z.string().default(""),
    organization: z.string().nullable().default(null),
    result: z.string().default(""),
  })).default([]),
  competitions: z.array(z.object({
    year: z.string().default(""),
    title: z.string().default(""),
    organization: z.string().nullable().default(null),
    result: z.string().default(""),
  })).default([]),
  education: z.array(z.string()).default([]),
  links: z.array(z.object({
    label: z.string().nullable().default(null),
    url: z.string().default("")
  })).default([])
});

export type ParsedProfile = z.infer<typeof parsedProfileSchema>;

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY가 서버 환경변수에 설정되어 있지 않습니다.");
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

/**
 * Safely converts any numeric or formatted year value to a clean string format.
 * Examples: 2026 -> "2026", "2026년" -> "2026", null -> "".
 */
export function normalizeYear(val: any): string {
  if (val === undefined || val === null) return "";
  const str = String(val).trim();
  const match = str.match(/\d+/);
  if (match) return match[0];
  return str;
}

const SYSTEM_PROMPT = `당신은 아티스트의 이력(PDF, DOCX, TXT, 또는 자유 텍스트)을 구조화된 프로필 JSON 데이터로 정리하는 전문 어시스턴트입니다.

공통 규칙:
1. 절대로 임의의 사실을 추측하거나 지어내지 마세요. 본문에 나와 있지 않은 내용은 결과에 추가하지 않습니다.
2. 근거가 없는 정보는 null, 빈 배열 [], 또는 빈 문자열 ""로 반환해야 합니다. 특히 bio_short, bio, works[].description은 근거가 부족하면 반드시 빈 문자열 ""로 반환하고, 절대 일반적이고 상투적인 문장으로 채우지 마세요.
3. 연도(year)는 항상 문자열(string)로 반환합니다. (예: "2025", "2024", "연도미상", ""). 숫자로 반환해서는 안 됩니다.
4. 수상 실적은 awards에, 콩쿠르나 공모전 등의 본선/결선 진출 이력은 competitions에 분류해 주세요.
5. affiliations에는 소속(단체, 컴퍼니 등)을 넣고, current_activity에는 현재 재직 중이거나 상시 활동 중인 텍스트 목록을 넣어주세요.
6. education에는 학력 정보를 텍스트 목록으로 정리해 주세요 (예: ["OO대학교 무용과 졸업", "OO예술고등학교 졸업"]).
7. links에는 인스타그램, 유튜브, 포트폴리오 사이트 등 추출할 수 있는 외부 웹링크를 객체 형태로 분류해 주세요 (label과 url 포함).
8. 응답은 아래 명시된 JSON 형식만 반환해야 하며, 코드블록이나 별도의 설명 텍스트를 포함해서는 안 됩니다.
${PROFILE_EXTRACTION_PROMPT}
${PROFILE_SUMMARY_PROMPT}
${WORK_DESCRIPTION_PROMPT}

출력 JSON 스키마:
{
  "artist": {
    "name": "",
    "name_en": "",
    "genre": "",
    "role": "",
    "bio_short": "",
    "bio": ""
  },
  "affiliations": [
    { "name": "", "position": null }
  ],
  "current_activity": [],
  "works": [
    { "title": "", "year": "", "role": "", "description": "", "image_url": "", "video_url": "" }
  ],
  "awards": [
    { "year": "", "title": "", "organization": null, "result": "" }
  ],
  "competitions": [
    { "year": "", "title": "", "organization": null, "result": "" }
  ],
  "education": [],
  "links": [
    { "label": null, "url": "" }
  ]
}`;

export async function parseProfileTextWithAI(text: string): Promise<ParsedProfile> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `다음 원문 이력 정보를 구조화된 JSON 프로필로 파싱해 주세요:\n\n${text}` },
    ],
  });

  const content = response.choices[0]?.message?.content || "";
  if (!content.trim()) {
    throw new Error("AI가 빈 응답을 반환했습니다.");
  }

  let rawParsed: any;
  try {
    rawParsed = JSON.parse(content);
  } catch (e) {
    throw new Error("AI 응답이 유효한 JSON이 아닙니다.");
  }

  // Pre-normalize year fields before Zod validation to guarantee string types
  if (rawParsed.works && Array.isArray(rawParsed.works)) {
    rawParsed.works = rawParsed.works.map((w: any) => ({
      ...w,
      year: normalizeYear(w.year),
      image_url: w.image_url || "",
      video_url: w.video_url || ""
    }));
  }
  if (rawParsed.awards && Array.isArray(rawParsed.awards)) {
    rawParsed.awards = rawParsed.awards.map((a: any) => ({
      ...a,
      year: normalizeYear(a.year)
    }));
  }
  if (rawParsed.competitions && Array.isArray(rawParsed.competitions)) {
    rawParsed.competitions = rawParsed.competitions.map((c: any) => ({
      ...c,
      year: normalizeYear(c.year)
    }));
  }

  // Validate utilizing Zod schema
  const validated = parsedProfileSchema.safeParse(rawParsed);
  if (!validated.success) {
    console.error("Zod Schema Validation Failed. Details:", validated.error.format());
    // Attempt fallback parsing to salvage data instead of crashing outright
    return {
      artist: {
        name: rawParsed?.artist?.name || "",
        name_en: rawParsed?.artist?.name_en || "",
        genre: rawParsed?.artist?.genre || "",
        role: rawParsed?.artist?.role || "",
        bio_short: rawParsed?.artist?.bio_short || "",
        bio: rawParsed?.artist?.bio || "",
      },
      affiliations: Array.isArray(rawParsed?.affiliations) ? rawParsed.affiliations : [],
      current_activity: Array.isArray(rawParsed?.current_activity) ? rawParsed.current_activity : [],
      works: Array.isArray(rawParsed?.works) ? rawParsed.works : [],
      awards: Array.isArray(rawParsed?.awards) ? rawParsed.awards : [],
      competitions: Array.isArray(rawParsed?.competitions) ? rawParsed.competitions : [],
      education: Array.isArray(rawParsed?.education) ? rawParsed.education : [],
      links: Array.isArray(rawParsed?.links) ? rawParsed.links : [],
    };
  }

  return validated.data;
}
