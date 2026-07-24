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

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!accessToken) {
    devWarn("[getWeeklyStories] INSTAGRAM_ACCESS_TOKEN not set — '이주의 소식' section will be hidden.");
    return [];
  }

  try {
    // Fetch a larger pool than `limit` since the no-caption / no-image /
    // missing-caption / missing-image / required-hashtag / excluded-id filters may drop
    // some posts.
    const poolSize = Math.max(limit * 3, 12);
    const url = `${GRAPH_HOST}/${GRAPH_VERSION}/me/media?fields=${encodeURIComponent(FIELDS)}&access_token=${encodeURIComponent(accessToken)}&limit=${poolSize}`;

    // Keep the homepage reasonably fresh after #홈노출 is added while still
    // avoiding a Graph API request on every page view.
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      devError("[getWeeklyStories] Instagram API error", res.status, body);
      return [];
    }

    const json = await res.json();
    const rawMedia: RawInstagramMedia[] = Array.isArray(json?.data) ? json.data : [];

    const stories: InstagramStory[] = [];
    for (const media of rawMedia) {
      if (excludeIds.includes(media.id)) continue;
      if (!media.caption || !media.caption.trim()) continue;
      if (!captionHasHashtag(media.caption, requireHashtag)) continue;

      const imageUrl = pickImageUrl(media);
      if (!imageUrl) continue;

      const title = extractStoryTitle(media.caption);
      stories.push({
        id: media.id,
        title,
        excerpt: extractStoryExcerpt(media.caption, title),
        imageUrl,
        permalink: media.permalink,
        publishedAt: media.timestamp,
        mediaType: resolveMediaType(media),
        category: inferStoryCategory(media.caption),
      });

      if (stories.length >= limit) break;
    }

    return stories;
  } catch (err) {
    devError("[getWeeklyStories] Unexpected error:", err);
    return [];
  }
}
