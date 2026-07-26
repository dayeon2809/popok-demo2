// AI Work Organizer — server-only (feature/home-feed-v2's upload-first
// dashboard). Reuses the exact same OpenAI client/model as the rest of the
// project (lib/profileParser.ts's getClient()/MODEL — the one
// lib/companyAiDraft.ts and lib/aiDiscovery.ts already reuse) rather than
// creating a new client. No image analysis/vision call here — only the
// text the uploader already typed (or the bare filename, as a last resort)
// goes to the model; results are always a review-first suggestion, never
// auto-saved.

import OpenAI from "openai";
import { z } from "zod";
import { getClient, MODEL } from "@/lib/profileParser";

export interface OrganizeWorkInput {
  title?: string;
  description?: string;
  role?: string;
  year?: string;
  fileName?: string;
  artistGenre?: string;
  artistBioShort?: string;
}

const organizedWorkSchema = z.object({
  title: z.string().default(""),
  shortDescription: z.string().default(""),
  role: z.string().default(""),
  genre: z.string().default(""),
  keywords: z.array(z.string()).default([]),
  caption: z.string().default(""),
});

export type OrganizedWork = z.infer<typeof organizedWorkSchema>;

function extractJson(text: string): string {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  return t;
}

const SYSTEM_PROMPT = `당신은 POPOK(공연예술 아티스트 포트폴리오 플랫폼)에서 방금 사진을 업로드한 아티스트를 위해
작품 정보를 정리해주는 도우미입니다.

규칙:
1. 사용자가 제공한 정보(제목, 설명, 역할, 연도, 파일명, 아티스트 장르/소개)만 근거로 사용하세요.
2. 공연명, 장소, 단체명, 크레딧 등 사용자가 언급하지 않은 사실을 절대 새로 만들어내지 마세요.
3. 제공된 정보가 거의 없다면(예: 파일명뿐이라면) 짧고 일반적인 표현으로만 정리하고, 확실하지 않은 내용은 비워두세요.
4. shortDescription과 caption은 각각 1문장, 과장 없이 담백하게 작성하세요.
5. keywords는 최대 5개, 짧은 단어/구 형태로만 작성하세요.
6. 응답은 반드시 아래 JSON 스키마의 순수 JSON 객체만 반환하세요. 코드블록이나 설명 문장을 포함하지 마세요.

JSON 스키마:
{
  "title": "작품 제목 제안 (정보가 부족하면 빈 문자열)",
  "shortDescription": "작품 소개 한 문장",
  "role": "역할 정리 (예: 안무 및 출연)",
  "genre": "장르 또는 작업 성격 한 단어/구",
  "keywords": ["키워드"],
  "caption": "공개 페이지용 짧은 캡션 한 문장"
}`;

function buildUserPrompt(input: OrganizeWorkInput): string {
  return `업로드한 작업 정보:
제목: ${input.title?.trim() || "(입력 없음)"}
한 줄 설명: ${input.description?.trim() || "(입력 없음)"}
역할: ${input.role?.trim() || "(입력 없음)"}
연도: ${input.year?.trim() || "(입력 없음)"}
파일명: ${input.fileName?.trim() || "(없음)"}

아티스트 정보 (참고용, 작품 자체의 사실로 옮겨쓰지 마세요):
장르: ${input.artistGenre?.trim() || "(미상)"}
소개: ${input.artistBioShort?.trim() || "(없음)"}`;
}

export interface OrganizeWorkResult {
  success: boolean;
  data?: OrganizedWork;
  error?: string;
}

export async function organizeWorkWithAI(input: OrganizeWorkInput): Promise<OrganizeWorkResult> {
  if (!input.title?.trim() && !input.description?.trim() && !input.fileName?.trim()) {
    return { success: false, error: "정리할 내용이 없어요. 제목이나 간단한 설명을 먼저 입력해 주세요." };
  }

  let client: OpenAI;
  try {
    client = getClient();
  } catch (err: any) {
    return { success: false, error: err?.message || "AI 클라이언트를 사용할 수 없습니다." };
  }

  let raw: string;
  try {
    const completion = await client.chat.completions.create(
      {
        model: MODEL,
        response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 400,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input) },
        ],
      },
      { timeout: 20000 }
    );
    raw = completion.choices[0]?.message?.content || "";
  } catch (err: any) {
    return { success: false, error: `AI 호출 실패: ${err?.message || String(err)}` };
  }

  if (!raw.trim()) {
    return { success: false, error: "AI 응답이 비어 있습니다." };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(extractJson(raw));
  } catch {
    return { success: false, error: "AI 응답이 유효한 JSON이 아닙니다." };
  }

  const validated = organizedWorkSchema.safeParse(parsedJson);
  if (!validated.success) {
    return { success: false, error: "AI 응답이 예상한 형식과 다릅니다." };
  }

  return { success: true, data: validated.data };
}
