// AI Artist Discovery — server-only MVP (feature/home-feed-v2).
//
// Reuses the project's existing OpenAI client/model (lib/profileParser.ts's
// getClient()/MODEL — the same one lib/companyAiDraft.ts already reuses) and
// the existing public-artist reader (getPublishedArtists()) instead of
// standing up a new client, a new env var, or a new DB query. No pgvector,
// no embeddings table, no Edge Function, no schema change — the whole
// pipeline is: read public artists already in Postgres -> reduce to a small
// keyword-scored candidate pool -> hand only that pool's public fields to
// the model -> validate its JSON reply against the pool -> re-merge with
// real DB data before returning anything to the client.
//
// The model never sees: email, phone, owner_id, claim_code, admin notes, or
// any non-published artist — mapArtistRowToArtist() (lib/artists.ts) never
// even puts those fields on the Artist objects this module reads from, and
// getPublishedArtists() already filters to status="published" server-side.

import OpenAI from "openai";
import { z } from "zod";
import { getClient, MODEL } from "@/lib/profileParser";
import { getPublishedArtists } from "@/lib/artists";
import { normalizeWorks } from "@/lib/works";
import { normalizeArtistCurrentActivity } from "@/lib/artist-profile";
import type { Artist } from "@/types";

export type DiscoveryMode = "discover" | "similar" | "collaborator";

const CANDIDATE_POOL_TARGET = 26;
const MIN_KEYWORD_MATCHES_BEFORE_BACKFILL = 12;
const BIO_MAX_CHARS = 160;
const WORK_DESC_MAX_CHARS = 180;
const WORKS_PER_ARTIST = 4;

// ── Candidate shape sent to the model — an intentional allowlist, not a
// blocklist: only these fields ever leave this module for the prompt. ──────
interface CandidateWork {
  id: string;
  title: string;
  year: string;
  role: string;
  description: string;
  /** Never included in the prompt text (see poolText below) — kept only for the response UI. */
  image: string;
}

interface Candidate {
  artistId: string; // Artist.recordId (real DB uuid) — never Artist.id (slug)
  href: string;
  name: string;
  nameEn: string;
  genre: string;
  role: string;
  cityOrRegion: string;
  bioShort: string;
  currentActivity: string[];
  companyName: string;
  image: string;
  works: CandidateWork[];
  searchBlob: string; // lowercased, for server-side keyword scoring only — never sent to the model
}

function truncate(text: string, max: number): string {
  const trimmed = (text || "").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function buildCandidate(artist: Artist): Candidate | null {
  if (!artist.recordId) return null;

  const normalizedWorks = normalizeWorks(artist.works);
  const works: CandidateWork[] = normalizedWorks.slice(0, WORKS_PER_ARTIST).map((w, idx) => ({
    id: w.id || `w${idx}`,
    title: truncate(w.title, 80),
    year: w.year || "",
    role: truncate(w.role || "", 40),
    description: truncate(w.description, WORK_DESC_MAX_CHARS),
    image: w.image_url || "",
  }));

  const currentActivity = normalizeArtistCurrentActivity(artist.current_activity).slice(0, 3).map((t) => truncate(t, 80));
  const bioShort = truncate(artist.bio_short || artist.aiSummary || "", BIO_MAX_CHARS);
  const workImage = normalizedWorks.find((w) => w.image_url)?.image_url || "";
  const image = artist.profile_image_url || artist.profileImage || workImage || "";

  const searchParts = [
    artist.name,
    artist.name_en,
    artist.genre,
    artist.field,
    artist.role,
    artist.city_or_region,
    artist.company,
    bioShort,
    currentActivity.join(" "),
    works.map((w) => `${w.title} ${w.role} ${w.description}`).join(" "),
  ];

  return {
    artistId: artist.recordId,
    href: `/artists/${encodeURIComponent(artist.slug || artist.id)}`,
    name: artist.name,
    nameEn: artist.name_en || "",
    genre: artist.genre || "",
    role: artist.role || "",
    cityOrRegion: artist.city_or_region || "",
    bioShort,
    currentActivity,
    companyName: artist.company || "",
    image,
    works,
    searchBlob: searchParts.filter(Boolean).join(" ").toLowerCase(),
  };
}

// ── Query -> keyword extraction (no embeddings — plain tokenization) ──────
const STOPWORDS = new Set([
  "그리고", "그런", "하는", "있는", "위한", "에서", "으로", "하고", "것을", "것은",
  "찾아줘", "찾고", "싶어", "보여줘", "찾아", "있어요", "해줘", "하는데", "같은",
  "사람", "작업을", "아티스트를", "안무가를", "무용수를", "퍼포머를", "경험이",
  "이런", "그런", "저런", "합니다", "있습니다", "해주세요", "찾습니다", "하나요",
]);

function extractKeywords(text: string): string[] {
  const tokens = (text || "")
    .toLowerCase()
    .split(/[\s,./!?"'()\[\]{}~·:;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
  return Array.from(new Set(tokens));
}

function scoreCandidate(candidate: Candidate, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  let score = 0;
  for (const kw of keywords) {
    if (candidate.searchBlob.includes(kw)) score += 1;
  }
  return score;
}

/**
 * Reduces the full published-artist list to a small pool (~20-30) before
 * anything is sent to the model. Keyword matches rank first; if too few
 * candidates actually match (common for mood/style queries with no literal
 * keyword overlap — there's no vector search here, just substring scoring),
 * the pool is backfilled with the most recently updated remaining artists so
 * the model still has enough real material to reason over. Always excludes
 * `excludeArtistId` (the artist the viewer is already looking at).
 */
function selectCandidatePool(
  candidates: Candidate[],
  keywords: string[],
  excludeArtistId: string | null,
  poolSize = CANDIDATE_POOL_TARGET
): Candidate[] {
  const eligible = candidates.filter((c) => c.artistId !== excludeArtistId);

  const scored = eligible
    .map((c) => ({ c, score: scoreCandidate(c, keywords) }))
    .sort((a, b) => b.score - a.score);

  const matched = scored.filter((s) => s.score > 0).map((s) => s.c);

  if (matched.length >= MIN_KEYWORD_MATCHES_BEFORE_BACKFILL || matched.length >= poolSize) {
    return matched.slice(0, poolSize);
  }

  const matchedIds = new Set(matched.map((c) => c.artistId));
  const backfill = eligible
    .filter((c) => !matchedIds.has(c.artistId))
    .slice(0, poolSize - matched.length);

  return [...matched, ...backfill].slice(0, poolSize);
}

// ── Model I/O ───────────────────────────────────────────────────────────
const aiResultSchema = z.object({
  artistId: z.string(),
  reason: z.string().default(""),
  matchedWorkIds: z.array(z.string()).default([]),
  matchedKeywords: z.array(z.string()).default([]),
});

const aiResponseSchema = z.object({
  summary: z.string().default(""),
  results: z.array(aiResultSchema).default([]),
  suggestedQueries: z.array(z.string()).default([]),
});

export type AiDiscoveryResult = z.infer<typeof aiResultSchema>;

function extractJson(text: string): string {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  return t;
}

const MODE_INSTRUCTIONS: Record<DiscoveryMode, string> = {
  discover: "사용자의 자연어 요청과 가장 관련 있는 아티스트를 후보 목록에서 골라주세요.",
  similar:
    "기준 아티스트(context artist)와 작업 스타일, 장르, 분위기, 작업 방식이 비슷한 다른 아티스트를 후보 목록에서 골라주세요. 기준 아티스트 본인은 절대 결과에 포함하지 마세요.",
  collaborator:
    "기준 아티스트(context artist)와 상호보완적인 역할이나 작업 경험을 가진 협업 대상을 후보 목록에서 찾아주세요. 후보 목록 안에 사용자가 요청한 역할(예: 영상 아티스트, 미디어 아티스트 등)에 맞는 사람이 없다면 억지로 비슷한 사람을 끼워 맞추지 말고 results를 빈 배열로 반환하세요.",
};

function buildMessages(
  pool: Candidate[],
  query: string,
  contextCandidate: Candidate | null,
  mode: DiscoveryMode,
  limit: number
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const systemPrompt = `당신은 POPOK(공연예술 아티스트 포트폴리오 플랫폼)의 방문자를 위한 아티스트 탐색 도우미입니다.

규칙:
1. 반드시 아래 "후보 목록"에 있는 artistId만 결과에 사용하세요. 목록에 없는 사람, 작품, 단체를 절대 새로 만들어내지 마세요.
2. 각 결과의 reason은 한국어로 1~2문장, 후보의 실제 정보(장르, 작품 설명, 역할, 현재 활동 등)에 근거해서만 작성하세요. 근거 없는 미사여구나 추측성 평가는 쓰지 마세요.
3. matchedWorkIds는 반드시 해당 아티스트의 works 목록에 있는 id만 사용하세요. 관련 작품이 없으면 빈 배열로 두세요.
4. matchedKeywords는 최대 5개, 짧은 단어/구 형태로만 작성하세요.
5. 사용자의 요청과 실제로 관련 있는 후보가 없으면 results를 빈 배열로 반환하세요. 억지로 채우지 마세요.
6. results는 최대 ${limit}개까지만 반환하세요.
7. ${MODE_INSTRUCTIONS[mode]}
8. 응답은 반드시 아래 JSON 스키마 형태의 순수 JSON 객체만 반환하세요. 코드블록이나 설명 문장을 포함하지 마세요.

JSON 스키마:
{
  "summary": "검색 결과에 대한 한 줄 요약 (한국어, 1문장)",
  "results": [
    { "artistId": "후보 목록의 artistId", "reason": "1~2문장", "matchedWorkIds": ["후보의 work id"], "matchedKeywords": ["키워드"] }
  ],
  "suggestedQueries": ["사용자가 이어서 시도해볼 만한 다른 자연어 질문 2~3개"]
}`;

  const poolText = pool
    .map((c) => {
      const worksText = c.works
        .map((w) => `    - work(id=${w.id}) ${w.title} (${w.year || "연도미상"}) / 역할: ${w.role || "미상"} / ${w.description || "설명 없음"}`)
        .join("\n");
      return `- artistId: ${c.artistId}
  이름: ${c.name}${c.nameEn ? ` (${c.nameEn})` : ""}
  장르/역할: ${[c.genre, c.role].filter(Boolean).join(" · ") || "미상"}
  지역: ${c.cityOrRegion || "미상"}
  소속: ${c.companyName || "없음"}
  소개: ${c.bioShort || "없음"}
  현재 활동: ${c.currentActivity.join("; ") || "없음"}
  작품:
${worksText || "    - 등록된 작품 없음"}`;
    })
    .join("\n\n");

  const contextText = contextCandidate
    ? `\n\n기준 아티스트(context, 결과에서 반드시 제외):\n이름: ${contextCandidate.name} / 장르: ${contextCandidate.genre || "미상"} / 소개: ${contextCandidate.bioShort || "없음"} / 대표 작품: ${contextCandidate.works.map((w) => w.title).join(", ") || "없음"}`
    : "";

  const userPrompt = `사용자 요청: "${query}"${contextText}

후보 목록 (이 목록 밖의 사람/작품/단체는 절대 언급하지 마세요):
${poolText}`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

// ── Short-lived in-memory cache — best-effort only, never assumed to
// survive across serverless instances/cold starts (see section 25). ───────
interface CacheEntry {
  expires: number;
  payload: DiscoveryResponse;
}
const CACHE_TTL_MS = 2 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

function cacheKey(query: string, contextArtistId: string | null, mode: DiscoveryMode, limit: number): string {
  return `${mode}::${contextArtistId || ""}::${limit}::${query.trim().toLowerCase()}`;
}

export interface DiscoveryResultView {
  artistId: string;
  slug: string;
  href: string;
  name: string;
  nameEn: string;
  genre: string;
  image: string;
  reason: string;
  matchedKeywords: string[];
  matchedWorks: { id: string; title: string; image: string }[];
}

export interface DiscoveryResponse {
  summary: string;
  results: DiscoveryResultView[];
  suggestedQueries: string[];
  usedFallback: boolean;
}

const NO_MATCH_SUMMARY = "현재 POPOK에 등록된 작업 안에서는 정확히 일치하는 결과를 찾지 못했어요.";
const DEFAULT_SUGGESTIONS = ["조건을 조금 줄여서 다시 찾아보기", "장르보다 작업 분위기로 찾아보기", "특정 기술 대신 협업 경험으로 찾아보기"];

export interface RunDiscoveryInput {
  query: string;
  contextArtistId: string | null;
  limit: number;
  mode: DiscoveryMode;
}

export async function runAiDiscovery({ query, contextArtistId, limit, mode }: RunDiscoveryInput): Promise<DiscoveryResponse> {
  const key = cacheKey(query, contextArtistId, mode, limit);
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.payload;

  const artists = await getPublishedArtists();
  const candidates = artists.map(buildCandidate).filter((c): c is Candidate => c !== null);

  if (candidates.length === 0) {
    const empty: DiscoveryResponse = { summary: NO_MATCH_SUMMARY, results: [], suggestedQueries: DEFAULT_SUGGESTIONS, usedFallback: false };
    return empty;
  }

  const contextCandidate = contextArtistId ? candidates.find((c) => c.artistId === contextArtistId) || null : null;
  const effectiveExcludeId = contextCandidate?.artistId || null;

  const keywordSource = [query, contextCandidate?.bioShort, contextCandidate?.genre].filter(Boolean).join(" ");
  const keywords = extractKeywords(keywordSource);
  const pool = selectCandidatePool(candidates, keywords, effectiveExcludeId);

  if (pool.length === 0) {
    const empty: DiscoveryResponse = { summary: NO_MATCH_SUMMARY, results: [], suggestedQueries: DEFAULT_SUGGESTIONS, usedFallback: false };
    cache.set(key, { expires: Date.now() + CACHE_TTL_MS, payload: empty });
    return empty;
  }

  const poolById = new Map(pool.map((c) => [c.artistId, c]));

  let client: OpenAI;
  try {
    client = getClient();
  } catch (err: any) {
    console.error("[aiDiscovery] OpenAI client unavailable:", err?.message || err);
    return { summary: NO_MATCH_SUMMARY, results: [], suggestedQueries: DEFAULT_SUGGESTIONS, usedFallback: true };
  }

  let raw: string;
  try {
    const completion = await client.chat.completions.create(
      {
        model: MODEL,
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 900,
        messages: buildMessages(pool, query, contextCandidate, mode, limit),
      },
      { timeout: 20000 }
    );
    raw = completion.choices[0]?.message?.content || "";
  } catch (err: any) {
    console.error("[aiDiscovery] OpenAI call failed:", err?.message || err);
    return { summary: NO_MATCH_SUMMARY, results: [], suggestedQueries: DEFAULT_SUGGESTIONS, usedFallback: true };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(extractJson(raw));
  } catch {
    console.error("[aiDiscovery] Non-JSON AI response:", raw.slice(0, 300));
    return { summary: NO_MATCH_SUMMARY, results: [], suggestedQueries: DEFAULT_SUGGESTIONS, usedFallback: true };
  }

  const validated = aiResponseSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error("[aiDiscovery] AI response failed schema validation:", validated.error.issues);
    return { summary: NO_MATCH_SUMMARY, results: [], suggestedQueries: DEFAULT_SUGGESTIONS, usedFallback: true };
  }

  // Re-merge with real candidate data — never trust the model's own text for
  // name/image/etc.; only `reason`/`matchedKeywords` (its own commentary) and
  // the id references (validated against the pool) survive from its reply.
  const safeLimit = Math.min(Math.max(limit, 1), 12);
  const results: DiscoveryResultView[] = [];
  for (const item of validated.data.results) {
    const candidate = poolById.get(item.artistId);
    if (!candidate) continue; // drops any invented id
    if (results.length >= safeLimit) break;

    const workById = new Map(candidate.works.map((w) => [w.id, w]));
    const matchedWorks = item.matchedWorkIds
      .map((id) => workById.get(id))
      .filter((w): w is CandidateWork => Boolean(w))
      .slice(0, 3)
      .map((w) => ({ id: w.id, title: w.title, image: w.image }));

    results.push({
      artistId: candidate.artistId,
      slug: candidate.href.split("/").pop() || candidate.artistId,
      href: candidate.href,
      name: candidate.name,
      nameEn: candidate.nameEn,
      genre: candidate.genre,
      image: candidate.image,
      reason: truncate(item.reason, 240),
      matchedKeywords: item.matchedKeywords.slice(0, 5).map((k) => truncate(k, 24)),
      matchedWorks,
    });
  }

  const payload: DiscoveryResponse = {
    summary: results.length > 0 ? truncate(validated.data.summary, 200) || "요청과 관련된 아티스트를 찾았어요." : NO_MATCH_SUMMARY,
    results,
    suggestedQueries: (results.length > 0 ? validated.data.suggestedQueries : DEFAULT_SUGGESTIONS).slice(0, 3).map((q) => truncate(q, 60)),
    usedFallback: false,
  };

  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, payload });
  return payload;
}
