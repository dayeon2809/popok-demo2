import { z } from "zod";
import { getClient, MODEL, normalizeYear } from "./profileParser";
import { PROFILE_SUMMARY_PROMPT } from "./prompts/profileSummaryPrompt";
import type { OrganizationApplicationForAi } from "./companies";

// Fallback for ai_draft_source_summary's file_name when a stored *_file_name
// column is unexpectedly empty but the storage path is known.
function basename(path?: string | null): string | undefined {
  if (!path) return undefined;
  const parts = path.split("/");
  return parts[parts.length - 1] || undefined;
}

// ── Zod schema for the admin-only "AI로 신청 자료 구조화" draft assistant ──

const workSchema = z.object({
  title: z.string().default(""),
  title_en: z.string().optional().default(""),
  year: z.string().optional().default(""),
  description: z.string().optional().default(""),
  role: z.string().optional().default(""),
  venue: z.string().optional().default(""),
  image_url: z.string().optional().default(""),
  video_url: z.string().optional().default(""),
  external_url: z.string().optional().default(""),
  artist_names: z.array(z.string()).optional().default([]),
});

const awardSchema = z.object({
  year: z.string().optional().default(""),
  title: z.string().optional().default(""),
  result: z.string().optional().default(""),
  organization: z.string().optional().default(""),
});

const linkSchema = z.object({
  label: z.string().default(""),
  url: z.string().default(""),
});

const reviewSearchHintSchema = z.object({
  company_name: z.string().optional().default(""),
  work_title: z.string().optional().default(""),
  artist_names: z.array(z.string()).optional().default([]),
  year: z.string().optional().default(""),
  confidence: z.number().min(0).max(1).optional(),
});

const needsReviewSchema = z.object({
  field: z.string().default(""),
  reason: z.string().default(""),
  source_excerpt: z.string().optional().default(""),
  // Optional/best-effort tag pointing back at which [라벨] source section
  // (see the enum list in COMPANY_STRUCTURE_SYSTEM_PROMPT below) this item
  // came from. Left as a free string, not a zod enum, so an AI response
  // using an unlisted value doesn't fail the whole draft's validation.
  source_type: z.string().optional().default(""),
});

// Distinct from needsReview: needsReview is "the material conflicts or is
// ambiguous, an admin must judge" — missingInformation is "the material
// simply doesn't contain this at all, someone needs to go get it". See the
// prompt section below for the exact rule given to the AI.
const missingInformationSchema = z.object({
  field: z.string().default(""),
  message: z.string().default(""),
  importance: z.enum(["required", "recommended", "optional"]).default("recommended"),
});

export const companyAiDraftSchema = z.object({
  name: z.string().optional().default(""),
  name_en: z.string().optional().default(""),
  genre: z.string().optional().default(""),
  category: z.string().optional().default(""),
  city_or_region: z.string().optional().default(""),
  bio_short: z.string().optional().default(""),
  bio: z.string().optional().default(""),
  current_activity: z.array(z.string()).default([]),
  works: z.array(workSchema).default([]),
  awards: z.array(awardSchema).default([]),
  links: z.array(linkSchema).default([]),
  reviewSearchHints: z.array(reviewSearchHintSchema).default([]),
  needsReview: z.array(needsReviewSchema).default([]),
  missingInformation: z.array(missingInformationSchema).default([]),
});

export type CompanyAiDraft = z.infer<typeof companyAiDraftSchema>;

// current_activity/works/awards/links reuse the SAME strict "don't invent
// facts" + review-flagging principle as lib/profileParser.ts's personal
// resume pipeline, extended with company-specific distinctions (works vs.
// education vs. awards vs. current activity) and the reviewSearchHints /
// needsReview fields this tool adds on top. PROFILE_SUMMARY_PROMPT is
// appended as-is since it already has tuned bio/bio_short rules for both
// individuals and organizations — not rewritten here.
export const COMPANY_STRUCTURE_SYSTEM_PROMPT = `당신은 공연예술 단체의 이력서와 활동 자료를
POPOK 단체 포트폴리오 스키마로 구조화하는
관리자용 편집 보조 도구입니다.

제공된 자료에서 확인 가능한 사실만 추출하세요.
없는 사실을 추측하거나 외부 지식으로 보완하지 마세요.
문서에 없는 작품, 연도, 수상, 인물, URL을 생성하지 마세요.

작품, 공연 참여, 교육, 수상, 현재 활동을 서로 구분하세요.
동일 항목을 중복 생성하지 마세요.

모호하거나 충돌하는 정보는 임의로 결정하지 말고
needsReview 배열에 이유와 근거를 남기세요.

needsReview와 missingInformation은 서로 다른 역할입니다.
- needsReview: 자료 안에 정보가 있지만 서로 충돌하거나 모호해서
  관리자의 판단이 필요한 경우
- missingInformation: 자료 어디에도 해당 정보가 아예 없어서
  추가로 받아야 하는 경우
확인할 수 없는 사실을 임의로 채워 넣지 말고 missingInformation에 기록하세요.
같은 누락 내용을 중복 생성하지 마세요.
공개 프로필 품질에 실질적으로 영향을 주는 항목 중심으로 최대 10개까지만
권장하고, 사소한 필드를 전부 나열하지 마세요. 대표 이미지처럼 문서에서
추출할 수 없는 항목(예: profile_image_url)도 안내할 수 있습니다.
importance는 "required"(공개에 필수) / "recommended"(있으면 훨씬 좋음) /
"optional"(부가 정보) 중 하나로 판단하세요.
missingInformation은 참고용 안내일 뿐이며, 어떤 company 필드에도 자동으로
반영되지 않습니다.

사용자 메시지는 여러 [라벨] 구간으로 자료 출처가 구분되어 있습니다.
가능하다면 needsReview 각 항목의 source_type에 해당 정보의 출처를
다음 중 하나로 표기하세요. 출처가 불명확하면 빈 문자열로 두어도 됩니다.
- application_portfolio_text ([사용자 직접 입력 이력])
- application_resume ([최초 첨부 이력서])
- admin_source_text ([관리자 보충 자료])
- admin_source_file ([관리자 최신 첨부 파일])
- existing_company_data ([참고용 기존 입력값])

리뷰나 기사 URL은 생성하지 마세요.
다음 단계의 리뷰 검색을 위해
단체명, 작품명, 참여 아티스트명, 연도만
reviewSearchHints에 기록하세요.

반드시 지정된 JSON 스키마로만 응답하세요.

[세부 추출 규칙]
- name / name_en: 문서에 실제로 명시된 경우만 사용합니다. 영문명이 없으면 임의로 번역하지 말고 빈 문자열로 둡니다.
- genre / category: 문서상 명확한 활동 장르를 기준으로 분류하고, 모호하면 빈 값으로 두고 needsReview에 기록합니다.
- city_or_region: 실제 활동 지역이나 소재지가 명시된 경우만 사용하고, 연락처 주소나 공연장 위치를 단체 활동 지역으로 오인하지 않습니다.
- current_activity: 현재 진행 중이라고 확인되는 작업만 포함하고, 과거 활동을 현재 활동으로 분류하지 않습니다.
- works: 실제 작품명 또는 프로젝트명이 확인된 경우만 생성합니다. 교육, 수상, 단순 행사 참여는 작품으로 분류하지 않고, 동일 작품의 재공연을 무조건 중복 작품으로 생성하지 않습니다. 연도를 알 수 없으면 비우고, artist_names에는 해당 작품 참여자로 문서에서 확인된 인물만 포함합니다.
- awards: 실제 수상·선정·공식 결과만 포함하고, 단순 지원사업 참여나 공연 참가를 수상으로 분류하지 않습니다.
- links: 신청서나 문서에 실제 URL이 있을 때만 생성하고, URL을 추측하거나 검색으로 만들어내지 않습니다.
- 첨부 이력서에서 유의미한 텍스트를 추출하지 못했다고 안내받으면, 그 사실을 needsReview에 반드시 기록하고 신청서 정보와 기존 입력값만으로 판단하세요.

${PROFILE_SUMMARY_PROMPT}

출력 JSON 스키마:
{
  "name": "",
  "name_en": "",
  "genre": "",
  "category": "",
  "city_or_region": "",
  "bio_short": "",
  "bio": "",
  "current_activity": [],
  "works": [
    { "title": "", "title_en": "", "year": "", "description": "", "role": "", "venue": "", "image_url": "", "video_url": "", "external_url": "", "artist_names": [] }
  ],
  "awards": [
    { "year": "", "title": "", "result": "", "organization": "" }
  ],
  "links": [
    { "label": "", "url": "" }
  ],
  "reviewSearchHints": [
    { "company_name": "", "work_title": "", "artist_names": [], "year": "", "confidence": 0.5 }
  ],
  "needsReview": [
    { "field": "", "reason": "", "source_excerpt": "", "source_type": "" }
  ],
  "missingInformation": [
    { "field": "", "message": "", "importance": "recommended" }
  ]
}`;

const MAX_INPUT_LENGTH = 50000; // total combined user message cap, per policy

export interface ExistingCompanyForAi {
  name?: string | null;
  name_en?: string | null;
  genre?: string | null;
  category?: string | null;
  city_or_region?: string | null;
  bio_short?: string | null;
  bio?: string | null;
  current_activity?: string[];
  works?: any[];
  awards?: any[];
  links?: any[];
}

/** One extracted-text material plus whatever it takes to describe its state
 * to the AI (present but unreadable vs. simply not provided). */
export interface CompanySourceMaterial {
  text: string;
  insufficient: boolean;
}

/** File metadata for [관리자 최신 첨부 파일], kept separate from the
 * extracted CompanySourceMaterial text so ai_draft_source_summary can report
 * on the file even when extraction produced nothing. */
export interface CompanySourceFileMeta {
  filePath: string | null;
  fileName: string | null;
  fileSize: number | null;
  /** Only ever set from companies.source_file_uploaded_at (never fabricated) — see [[add_company_source_materials]]. */
  uploadedAt: string | null;
}

export interface StructureCompanyInput {
  application: OrganizationApplicationForAi | null;
  existingCompany: ExistingCompanyForAi;
  /** [최초 첨부 이력서] — extracted from organization_applications.resume_file_path */
  applicationResume: CompanySourceMaterial;
  /** [관리자 보충 자료] — companies.source_text, entered directly, no extraction needed */
  adminSourceText: string;
  /** [관리자 최신 첨부 파일] — extracted from companies.source_file_path */
  adminSourceFile: CompanySourceMaterial;
  adminSourceFileMeta: CompanySourceFileMeta;
  /** True when adminSourceFile's extracted text is identical to applicationResume's
   * (e.g. the admin re-uploaded the same document) — the duplicate is dropped
   * from the prompt rather than sent twice. */
  adminFileDuplicatesApplicationResume: boolean;
}

export type SourceType =
  | "application_portfolio_text"
  | "application_resume"
  | "admin_source_text"
  | "admin_source_file"
  | "existing_company_data";

export type SourceStatus = "used" | "missing" | "empty" | "extraction_failed" | "skipped_duplicate";

export interface SourceSummaryEntry {
  source_type: SourceType;
  status: SourceStatus;
  file_name?: string;
  file_size?: number;
  uploaded_at?: string;
  extracted_text_length?: number;
  included_text_length?: number;
  error?: string;
}

export interface AiDraftSourceSummary {
  analyzed_at: string;
  total_input_chars: number;
  truncated: boolean;
  model?: string;
  sources: SourceSummaryEntry[];
}

export interface StructureCompanyResult {
  draft: CompanyAiDraft;
  sourceSummary: AiDraftSourceSummary;
}

export async function structureCompanyDataWithAI(input: StructureCompanyInput): Promise<StructureCompanyResult> {
  const {
    application,
    existingCompany,
    applicationResume,
    adminSourceText,
    adminSourceFile,
    adminSourceFileMeta,
    adminFileDuplicatesApplicationResume,
  } = input;
  const client = getClient();

  // userSections is the actual prompt content, joined with "\n" exactly as
  // before. runningLength mirrors what that join produces (each pushed
  // element ends up preceded by exactly one "\n", except the very first) so
  // pendingOffset() below reports each element's real start index in the
  // final joined string — used only to compute how much of a truncated
  // source's text actually made it into the prompt (ai_draft_source_summary).
  const userSections: string[] = [];
  let runningLength = 0;
  const push = (text: string) => {
    if (userSections.length > 0) runningLength += 1; // the "\n" join() will insert before this element
    userSections.push(text);
    runningLength += text.length;
  };
  const pendingOffset = () => (userSections.length > 0 ? runningLength + 1 : runningLength);

  push("[단체 신청서 정보]");
  if (application) {
    push(`단체명: ${application.org_name}`);
    push(`대표자: ${application.contact_name}`);
    push(`이메일: ${application.email}`);
    push(`연락처: ${application.phone}`);
    push(`인스타그램: ${application.instagram}`);
  } else {
    push("(연결된 신청서 없음 — 기존 입력값과 관리자 보충 자료만 참고)");
  }

  const sources: SourceSummaryEntry[] = [];

  // [사용자 직접 입력 이력]
  push("\n[사용자 직접 입력 이력]");
  {
    const raw = application?.portfolio_text?.trim() ? application.portfolio_text : "";
    const offset = pendingOffset();
    push(raw || "사용자가 직접 입력한 이력 텍스트가 없습니다.");
    sources.push({
      source_type: "application_portfolio_text",
      status: !application ? "missing" : raw ? "used" : "empty",
      extracted_text_length: raw.length,
      included_text_length: raw.length,
      ...(({ __offset: offset } as any)),
    });
  }

  // [최초 첨부 이력서]
  push("\n[최초 첨부 이력서]");
  {
    const raw = applicationResume.text.trim() ? applicationResume.text : "";
    const offset = pendingOffset();
    let status: SourceStatus;
    if (!application?.resume_file_path) {
      push("첨부된 이력서가 없습니다.");
      status = "missing";
    } else if (raw) {
      push(raw);
      status = "used";
    } else {
      push("첨부된 이력서에서 유의미한 텍스트를 추출하지 못했습니다. 이 사실을 needsReview에 기록하세요.");
      status = "extraction_failed";
    }
    sources.push({
      source_type: "application_resume",
      status,
      file_name: application?.resume_file_name || basename(application?.resume_file_path),
      uploaded_at: application?.resume_file_path ? application.created_at : undefined,
      extracted_text_length: raw.length,
      included_text_length: raw.length,
      ...(({ __offset: offset } as any)),
    });
  }

  // [관리자 보충 자료]
  push("\n[관리자 보충 자료]");
  {
    const raw = adminSourceText.trim() ? adminSourceText : "";
    const offset = pendingOffset();
    push(raw || "관리자가 입력한 보충 자료가 없습니다.");
    sources.push({
      source_type: "admin_source_text",
      status: raw ? "used" : "empty",
      extracted_text_length: raw.length,
      included_text_length: raw.length,
      ...(({ __offset: offset } as any)),
    });
  }

  // [관리자 최신 첨부 파일]
  push("\n[관리자 최신 첨부 파일]");
  {
    const raw = adminSourceFile.text.trim() ? adminSourceFile.text : "";
    const offset = pendingOffset();
    let status: SourceStatus;
    if (!adminSourceFileMeta.filePath) {
      push("관리자가 추가한 최신 첨부 파일이 없습니다.");
      status = "missing";
    } else if (adminFileDuplicatesApplicationResume) {
      push("최초 첨부 이력서와 동일한 파일입니다 — 위 [최초 첨부 이력서] 내용을 참고하세요.");
      status = "skipped_duplicate";
    } else if (raw) {
      push(raw);
      status = "used";
    } else {
      push("첨부된 파일에서 유의미한 텍스트를 추출하지 못했습니다. 이 사실을 needsReview에 기록하세요.");
      status = "extraction_failed";
    }
    sources.push({
      source_type: "admin_source_file",
      status,
      file_name: adminSourceFileMeta.fileName || basename(adminSourceFileMeta.filePath),
      file_size: adminSourceFileMeta.fileSize ?? undefined,
      uploaded_at: adminSourceFileMeta.uploadedAt || undefined,
      extracted_text_length: raw.length,
      // A duplicate contributes zero characters to the actual prompt — the
      // model is pointed back at [최초 첨부 이력서] instead of re-reading it.
      included_text_length: status === "skipped_duplicate" ? 0 : raw.length,
      ...(({ __offset: offset } as any)),
    });
  }

  push("\n[참고용 기존 입력값 — 자동 반영 금지, 판단 참고만]");
  {
    const raw = JSON.stringify(
      {
        name: existingCompany.name || "",
        name_en: existingCompany.name_en || "",
        genre: existingCompany.genre || "",
        category: existingCompany.category || "",
        city_or_region: existingCompany.city_or_region || "",
        bio_short: existingCompany.bio_short || "",
        bio: existingCompany.bio || "",
        current_activity: existingCompany.current_activity || [],
        works: existingCompany.works || [],
        awards: existingCompany.awards || [],
        links: existingCompany.links || [],
      },
      null,
      2
    );
    const offset = pendingOffset();
    push(raw);
    sources.push({
      source_type: "existing_company_data",
      status: "used",
      extracted_text_length: raw.length,
      included_text_length: raw.length,
      ...(({ __offset: offset } as any)),
    });
  }

  const combinedFull = userSections.join("\n");
  const truncated = combinedFull.length > MAX_INPUT_LENGTH;
  const combinedUserMessage = truncated ? combinedFull.slice(0, MAX_INPUT_LENGTH) : combinedFull;

  // Clip each source's included_text_length against the truncation cutoff,
  // now that the actual cutoff is known. __offset was stashed on each entry
  // above purely to make this computation possible; strip it back off
  // before returning (it's not part of the public SourceSummaryEntry shape).
  for (const entry of sources) {
    const offset = (entry as any).__offset as number;
    delete (entry as any).__offset;
    if (truncated) {
      const remaining = MAX_INPUT_LENGTH - offset;
      entry.included_text_length = Math.max(0, Math.min(entry.included_text_length || 0, remaining));
    }
  }

  const sourceSummary: AiDraftSourceSummary = {
    analyzed_at: new Date().toISOString(),
    total_input_chars: combinedFull.length,
    truncated,
    model: MODEL,
    sources,
  };

  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: COMPANY_STRUCTURE_SYSTEM_PROMPT },
      { role: "user", content: combinedUserMessage },
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

  if (Array.isArray(rawParsed.works)) {
    rawParsed.works = rawParsed.works.map((w: any) => ({ ...w, year: normalizeYear(w.year) }));
  }
  if (Array.isArray(rawParsed.awards)) {
    rawParsed.awards = rawParsed.awards.map((a: any) => ({ ...a, year: normalizeYear(a.year) }));
  }
  if (Array.isArray(rawParsed.reviewSearchHints)) {
    rawParsed.reviewSearchHints = rawParsed.reviewSearchHints.map((h: any) => ({ ...h, year: normalizeYear(h.year) }));
  }

  const validated = companyAiDraftSchema.safeParse(rawParsed);
  if (!validated.success) {
    console.error("[structureCompanyDataWithAI] Zod validation failed:", validated.error.format());
    // Fallback: salvage whatever arrays/strings are present rather than
    // throwing, matching lib/profileParser.ts's parseProfileTextWithAI().
    const draft: CompanyAiDraft = {
      name: rawParsed?.name || "",
      name_en: rawParsed?.name_en || "",
      genre: rawParsed?.genre || "",
      category: rawParsed?.category || "",
      city_or_region: rawParsed?.city_or_region || "",
      bio_short: rawParsed?.bio_short || "",
      bio: rawParsed?.bio || "",
      current_activity: Array.isArray(rawParsed?.current_activity) ? rawParsed.current_activity : [],
      works: Array.isArray(rawParsed?.works) ? rawParsed.works : [],
      awards: Array.isArray(rawParsed?.awards) ? rawParsed.awards : [],
      links: Array.isArray(rawParsed?.links) ? rawParsed.links : [],
      reviewSearchHints: Array.isArray(rawParsed?.reviewSearchHints) ? rawParsed.reviewSearchHints : [],
      needsReview: Array.isArray(rawParsed?.needsReview) ? rawParsed.needsReview : [],
      missingInformation: Array.isArray(rawParsed?.missingInformation) ? rawParsed.missingInformation : [],
    };
    return { draft, sourceSummary };
  }

  return { draft: validated.data, sourceSummary };
}
