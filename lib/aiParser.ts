import OpenAI from "openai";
import { parsedArtistProfileSchema, type ParsedArtistProfile } from "./parsedProfile";

// AI Parser — submissions 원문(이름/장르/bio_short/additional_requests)을
// 구조화된 ParsedArtistProfile JSON으로 정리한다. 서버에서만 호출되며,
// 결과는 관리자 검수를 거치기 전까지 submissions.parsed_profile에만 저장되고
// artists 테이블에는 절대 직접 반영되지 않는다.

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY가 설정되지 않았습니다. .env.local에 추가해주세요.");
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

const SYSTEM_PROMPT = `당신은 무용/공연예술 아티스트의 등록 신청서 원문을 구조화된 프로필로 정리하는 어시스턴트입니다.

반드시 지켜야 할 규칙:
1. 사실을 추측하지 않습니다. 원문에 없는 내용은 만들어내지 않습니다.
2. 연도(year)는 항상 숫자로 반환합니다 (예: 2025). "2025년", "2025"처럼 문자열이나 "연도미상" 같은 텍스트로 넣지 마세요. 연도를 알 수 없으면 null을 사용합니다.
3. 기관명, 작품명, 축제명, 수상명을 임의로 바꾸지 않습니다. 원문 표기를 그대로 사용합니다.
4. 오탈자로 보이는 내용도 확실하지 않으면 원문을 유지합니다.
5. 공연 및 작품은 works에 넣습니다.
6. 수상은 awards에 넣습니다.
7. 본선, 파이널, 결선 등 진출 이력은 competitions에 넣습니다.
8. 소속(단체, 컴퍼니, 랩 등)은 affiliations에 넣습니다.
9. 현재 재직, 출강, 활동 중인 내용은 current_activity에 문자열 배열로 넣습니다.
10. 교육 이력(학교, 전공, 졸업 등)은 education에 문자열 배열로 넣습니다.
11. 방송 출연은 works에 넣되 type을 "broadcast"로 설정합니다.
12. 뮤직비디오 참여는 works에 넣되 type을 "music_video"로 설정합니다. 그 외 공연/작품은 "performance"를 사용합니다.
13. 소개글(artist.summary)은 과장 없이 2~3문단으로 정리합니다.
14. 마케팅 문구, 홍보 문구, 예술관에 대한 추측을 추가하지 않습니다.
15. 확신하기 어려운 내용은 임의로 분류하지 말고 warnings 배열에 문자열로 남깁니다.
16. 응답은 아래 JSON 스키마를 따르는 유효한 JSON 객체만 반환합니다. 코드블록(백틱)이나 설명 문장을 절대 포함하지 마세요.

JSON 스키마 (모든 필드 필수, 값이 없으면 빈 문자열 / 빈 배열 / null 사용):
{
  "artist": { "name": "", "name_en": null, "genre": "", "bio_short": "", "summary": "" },
  "affiliations": [{ "name": "", "position": null }],
  "current_activity": [],
  "works": [{ "title": "", "organization": null, "festival": null, "role": null, "year": null, "type": "performance", "description": null }],
  "awards": [{ "year": null, "title": "", "organization": null, "result": "" }],
  "competitions": [{ "year": null, "title": "", "organization": null, "result": "" }],
  "education": [],
  "media": [{ "type": null, "url": "", "caption": null }],
  "links": [{ "label": null, "url": "" }],
  "warnings": []
}

주의: "media"와 "links"의 각 항목은 반드시 위 예시처럼 객체({...})여야 합니다. 문자열(url만 있는 텍스트)로 넣지 마세요.
관련 정보가 전혀 없으면 media/links는 빈 배열 []로 둡니다.
주의: works/awards/competitions의 "year"는 반드시 숫자(예: 2025)이거나 null이어야 합니다. 따옴표로 감싼 "2025" 형태는 금지입니다.`;

export interface ParseInput {
  name: string;
  genre?: string | null;
  instagram?: string | null;
  bioShort?: string | null;
  additionalRequests?: string | null;
}

export interface ParseResult {
  success: boolean;
  profile?: ParsedArtistProfile;
  rawText?: string;
  error?: string;
}

function extractJson(text: string): string {
  let t = text.trim();
  const fenceMatch = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) t = fenceMatch[1].trim();
  return t;
}

export async function parseSubmissionWithAI(input: ParseInput): Promise<ParseResult> {
  let client: OpenAI;
  try {
    client = getClient();
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }

  const userText = `다음은 아티스트가 직접 제출한 등록 신청서 원문입니다. 위 규칙에 따라 구조화해주세요.

이름: ${input.name || "(미상)"}
장르: ${input.genre || "(미상)"}
인스타그램: ${input.instagram || "(없음)"}

--- 자기소개 / 이력 (bio_short) ---
${input.bioShort?.trim() || "(내용 없음)"}

--- 추가 요청사항 (additional_requests) ---
${input.additionalRequests?.trim() || "(내용 없음)"}`;

  let response: OpenAI.Chat.Completions.ChatCompletion;
  try {
    response = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userText },
      ],
    });
  } catch (err: any) {
    return { success: false, error: `AI 호출 실패: ${err?.message || String(err)}` };
  }

  const rawText = response.choices[0]?.message?.content || "";

  if (!rawText.trim()) {
    return { success: false, error: "AI 응답이 비어 있습니다.", rawText };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(extractJson(rawText));
  } catch {
    return { success: false, error: "AI 응답이 유효한 JSON이 아닙니다.", rawText };
  }

  const validated = parsedArtistProfileSchema.safeParse(parsedJson);
  if (!validated.success) {
    const detail = validated.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    return { success: false, error: `AI 응답이 스키마와 일치하지 않습니다: ${detail}`, rawText };
  }

  return { success: true, profile: validated.data as ParsedArtistProfile, rawText };
}
