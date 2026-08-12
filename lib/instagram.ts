// Server-only. Fetches @popok.official's latest feed via the official
// Instagram API (Graph API — Instagram API with Instagram Login, for a
// Business/Creator account), normalizes it into InstagramStory[] for the
// homepage's "이주의 소식" section, and never throws — every failure mode
// (missing env var, API error, network error) resolves to an empty array
// so the homepage never breaks because of this section.
//
// Requires only INSTAGRAM_ACCESS_TOKEN — calls the `me/media` endpoint
// rather than `{user-id}/media`, so no separate INSTAGRAM_USER_ID lookup is
// needed. There is no existing Instagram Graph API integration anywhere
// else in this repo to reuse; app/api/instagram/preview/route.ts is an
// unrelated, unused OG-tag HTML scraper, not this API, and is left untouched.

export interface InstagramStory {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  permalink: string;
  publishedAt: string;
  mediaType: "IMAGE" | "CAROUSEL_ALBUM" | "VIDEO" | "REELS";
  category: string;
}

interface RawInstagramChild {
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
}

interface RawInstagramMedia {
  id: string;
  caption?: string;
  media_type?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_product_type?: string; // "FEED" | "REELS" | "STORY" — only meaningful when media_type is VIDEO
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  children?: { data: RawInstagramChild[] };
}

// Single source of truth for @popok.official's public profile URL — shared
// by the homepage content section's "더 보기" CTA and the footer's social link.
export const POPOK_INSTAGRAM_PROFILE_URL = "https://www.instagram.com/popok.official/";

const GRAPH_HOST = "https://graph.instagram.com";
const GRAPH_VERSION = "v23.0";
const FIELDS = "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}";

function devWarn(...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") console.warn(...args);
}
function devError(...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") console.error(...args);
}

export function isInstagramConfigured(): boolean {
  return !!process.env.INSTAGRAM_ACCESS_TOKEN;
}

// ── Caption parsing (kept separate from the fetch/normalize logic below so
// it's independently testable and re-usable if the UI ever needs it) ──────
function stripHashtags(caption: string): string {
  return caption.replace(/#\S+/g, "").replace(/\s{2,}/g, " ").trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export function extractStoryTitle(caption: string | null | undefined): string {
  const stripped = stripHashtags(caption || "");
  if (!stripped) return "POPOK 소식";
  const firstLine = stripped.split("\n").map((l) => l.trim()).find(Boolean) || stripped;
  const sentenceMatch = firstLine.match(/^(.{1,60}?[.!?])(\s|$)/);
  const candidate = sentenceMatch ? sentenceMatch[1] : firstLine;
  return truncate(candidate, 60);
}

export function extractStoryExcerpt(caption: string | null | undefined, title: string): string {
  const stripped = stripHashtags(caption || "");
  const bareTitle = title.replace(/…$/, "");
  const rest = stripped.startsWith(bareTitle) ? stripped.slice(bareTitle.length).trim() : stripped;
  return truncate(rest || stripped, 120);
}

const CATEGORY_RULES: Array<{ tags: string[]; label: string }> = [
  { tags: ["퐄터뷰"], label: "퐄터뷰" },
  { tags: ["포퐄공연", "공연소개"], label: "공연 소개" },
  { tags: ["포퐄아티스트"], label: "아티스트" },
  { tags: ["포퐄단체"], label: "단체" },
];

export function inferStoryCategory(caption: string | null | undefined): string {
  const c = caption || "";
  for (const rule of CATEGORY_RULES) {
    if (rule.tags.some((tag) => c.includes(`#${tag}`))) return rule.label;
  }
  return "POPOK 소식";
}

export function captionHasHashtag(caption: string | null | undefined, tag: string): boolean {
  return (caption || "").includes(`#${tag}`);
}

// ── Company↔Instagram tag matching ─────────────────────────────────────
// Convention: POPOK posts a company's dedicated hashtag ("#<이름>포퐄") on any
// post about that company, e.g. "공원" → "#공원포퐄". Pure/testable so the
// tag format and matching logic can change without touching the fetch code.

/**
 * Builds a company's dedicated Instagram tag: strip whitespace and any
 * character that isn't a letter/number/underscore (Instagram hashtags can't
 * contain punctuation or symbols, and stray punctuation would also break
 * exact-tag comparison), then wrap as "#<name>포퐄". Returns "" if nothing
 * taggable remains (e.g. empty/punctuation-only input).
 */
export function createCompanyInstagramTag(companyName: string | null | undefined): string {
  const sanitized = (companyName || "")
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}_]/gu, "");
  if (!sanitized) return "";
  return `#${sanitized}포퐄`;
}

/** All hashtags (with leading "#") appearing in a caption, in order. */
export function extractHashtags(caption: string | null | undefined): string[] {
  if (!caption) return [];
  return caption.match(/#[\p{L}\p{N}_]+/gu) || [];
}

/**
 * True only if `caption` contains the company's exact dedicated tag as a
 * standalone hashtag (case-insensitive) — e.g. "#공원포퐄" matches but
 * "#공원포퐄프로젝트" does not, since it's parsed as one longer, different
 * hashtag rather than a substring of it.
 */
export function hasCompanyInstagramTag(caption: string | null | undefined, companyName: string | null | undefined): boolean {
  const tag = createCompanyInstagramTag(companyName);
  if (!tag) return false;
  const target = tag.toLowerCase();
  return extractHashtags(caption).some((h) => h.toLowerCase() === target);
}

function pickImageUrl(media: RawInstagramMedia): string | null {
  if (media.media_type === "IMAGE") return media.media_url || null;
  if (media.media_type === "VIDEO") return media.thumbnail_url || media.media_url || null;
  if (media.media_type === "CAROUSEL_ALBUM") {
    const firstImageChild = media.children?.data?.find((c) => c.media_type === "IMAGE");
    return firstImageChild?.media_url || media.children?.data?.[0]?.thumbnail_url || media.media_url || null;
  }
  return null;
}

function resolveMediaType(media: RawInstagramMedia): InstagramStory["mediaType"] {
  if (media.media_type === "VIDEO") {
    return media.media_product_type === "REELS" ? "REELS" : "VIDEO";
  }
  return (media.media_type as "IMAGE" | "CAROUSEL_ALBUM" | undefined) || "IMAGE";
}

// Shared by getWeeklyStories/getCompanyStories: fetches a pool of the
// account's latest raw media, or null if the integration isn't configured.
// Never throws — an API/network failure resolves to an empty pool instead.
async function fetchMediaPool(poolSize: number, logLabel: string): Promise<RawInstagramMedia[]> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) {
    devWarn(`[${logLabel}] INSTAGRAM_ACCESS_TOKEN not set.`);
    return [];
  }

  try {
    const url = `${GRAPH_HOST}/${GRAPH_VERSION}/me/media?fields=${encodeURIComponent(FIELDS)}&access_token=${encodeURIComponent(accessToken)}&limit=${poolSize}`;

    // Keep results reasonably fresh while still avoiding a Graph API request
    // on every page view.
    const res = await fetch(url, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      devError(`[${logLabel}] Instagram API error`, res.status, body);
      return [];
    }

    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch (err) {
    devError(`[${logLabel}] Unexpected error:`, err);
    return [];
  }
}

function toStory(media: RawInstagramMedia, imageUrl: string): InstagramStory {
  const title = extractStoryTitle(media.caption);
  return {
    id: media.id,
    title,
    excerpt: extractStoryExcerpt(media.caption, title),
    imageUrl,
    permalink: media.permalink,
    publishedAt: media.timestamp,
    mediaType: resolveMediaType(media),
    category: inferStoryCategory(media.caption),
  };
}

interface GetWeeklyStoriesOptions {
  limit?: number;
  excludeIds?: string[];
  /** Only posts whose caption includes this hashtag are shown — lets the
   *  Instagram account be run freely while the homepage stays curated. */
  requireHashtag?: string;
}

/**
 * Latest @popok.official posts, normalized for the homepage. Always resolves
 * (never throws): missing env var, a non-2xx API response, or a network
 * error all just yield an empty array, logged only in development.
 */
export async function getWeeklyStories(options: GetWeeklyStoriesOptions = {}): Promise<InstagramStory[]> {
  const { limit = 6, excludeIds = [], requireHashtag = "홈노출" } = options;

  // Fetch a larger pool than `limit` since the no-caption / no-image /
  // required-hashtag / excluded-id filters may drop some posts.
  const poolSize = Math.max(limit * 3, 12);
  const rawMedia = await fetchMediaPool(poolSize, "getWeeklyStories");

  const stories: InstagramStory[] = [];
  for (const media of rawMedia) {
    if (excludeIds.includes(media.id)) continue;
    if (!media.caption || !media.caption.trim()) continue;
    if (!captionHasHashtag(media.caption, requireHashtag)) continue;

    const imageUrl = pickImageUrl(media);
    if (!imageUrl) continue;

    stories.push(toStory(media, imageUrl));
    if (stories.length >= limit) break;
  }

  return stories;
}

interface GetCompanyStoriesOptions {
  limit?: number;
}

/**
 * @popok.official posts tagged with this company's dedicated Instagram tag
 * (see createCompanyInstagramTag — "#<단체명>포퐄", e.g. "#공원포퐄" for
 * "공원") — shown at the bottom of the company's detail page. Scans a wider
 * pool than getWeeklyStories since a specific tag match is much rarer than
 * the curated homepage hashtag, and is not restricted to #홈노출 since this
 * isn't the homepage feed. Always resolves; never throws.
 */
export async function getCompanyStories(companyName: string | null | undefined, options: GetCompanyStoriesOptions = {}): Promise<InstagramStory[]> {
  if (!createCompanyInstagramTag(companyName)) return [];

  const { limit = 6 } = options;
  const rawMedia = await fetchMediaPool(50, "getCompanyStories");

  const stories: InstagramStory[] = [];
  for (const media of rawMedia) {
    if (!hasCompanyInstagramTag(media.caption, companyName)) continue;

    const imageUrl = pickImageUrl(media);
    if (!imageUrl) continue;

    stories.push(toStory(media, imageUrl));
    if (stories.length >= limit) break;
  }

  return stories;
}
