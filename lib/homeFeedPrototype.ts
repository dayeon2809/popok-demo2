// V2 Home visual feed — PROTOTYPE ONLY (feature/home-feed-v2).
//
// Pure, client-safe functions that reshape data the Home page already
// fetches (getPublishedArtists/getUpcomingPerformances/getPublishedCompanies
// — see app/page.tsx) into a flat list of image cards for the Pinterest-style
// masonry feed. No new Supabase queries, no new API routes, no DB changes —
// every image URL here already exists on the Artist/Company/Performance
// objects the Home page was already loading.
//
// Real items are built from (in priority order): artist work images, artist
// profile images, company work images, then company representative/profile
// images (normalizeWorks — same helper the profile editors and detail pages
// use). Performance posters and Instagram/"홈노출" posts are deliberately
// excluded — a performance's images only exist as its poster (no gallery
// concept in the schema) and read as ads/listings rather than an artist's
// own work, and Instagram posts are a different account's curated marketing
// feed, not an artist/company's own portfolio content. When there isn't
// enough real content to fill out a dense grid, `mock` prototype-only filler
// images are appended — see PLACEHOLDER_FEED_ITEMS below. Every filler item
// is tagged `source: "placeholder"` and `prototypeOnly: true` so it can never
// be mistaken for real artist/company data by anything reading this list.

import type { Artist, Company } from "@/types";
import { normalizeWorks } from "@/lib/works";
import { getCompanyDetailHref } from "@/lib/companyRoute";

export type FeedItemKind =
  | "artist-work"
  | "artist-profile"
  | "artist-video"
  | "company-work"
  | "company-image"
  | "company-video"
  | "placeholder";

export interface FeedItem {
  id: string;
  src: string;
  /** null = not clickable (used only for placeholder filler). */
  href: string | null;
  /** Shown only in the desktop hover overlay — never rendered at rest. */
  name: string | null;
  kind: FeedItemKind;
  source: "real" | "placeholder";
  /** Present only for "artist-video"/"company-video" — `src` is the poster image for those. */
  videoUrl?: string;
}

/** Motion-profile video for an artist/company, in priority order — same field my-popok's motion video editor writes to. */
function getMotionVideoUrl(entity: { motion_video_url?: string | null; motionProfile?: { type: string; src: string } | null; youtube_url?: string | null }): string | null {
  if (entity.motion_video_url) return entity.motion_video_url;
  if (entity.motionProfile?.type === "video" && entity.motionProfile.src) return entity.motionProfile.src;
  if (entity.youtube_url) return entity.youtube_url;
  return null;
}

function pushUnique(list: FeedItem[], seen: Set<string>, item: FeedItem) {
  if (!item.src || seen.has(item.src)) return;
  seen.add(item.src);
  list.push(item);
}

/** Real artist-derived cards: each work's images, then the profile photo(s). */
function artistFeedItems(artists: Artist[], seen: Set<string>): FeedItem[] {
  const items: FeedItem[] = [];
  for (const artist of artists) {
    const href = `/artists/${encodeURIComponent(artist.slug || artist.id)}`;
    const works = normalizeWorks(artist.works);
    const itemCountBeforeThisArtist = items.length;
    for (const work of works) {
      for (const img of work.images) {
        pushUnique(items, seen, {
          id: `artist-work-${artist.id}-${work.id}-${img}`,
          src: img,
          href,
          name: artist.name,
          kind: "artist-work",
          source: "real",
        });
      }
    }

    const profileImages = [artist.profile_image_url, artist.profileImage, ...(artist.profile_image_urls || [])]
      .filter((u): u is string => Boolean(u && u.trim()));
    for (const img of profileImages) {
      pushUnique(items, seen, {
        id: `artist-profile-${artist.id}-${img}`,
        src: img,
        href,
        name: artist.name,
        kind: "artist-profile",
        source: "real",
      });
    }

    // An artist with no work images and no profile photo would otherwise be
    // completely invisible in the feed — give them a deterministic generated
    // avatar (same dicebear convention used by RelatedArtists/ArtistsClient)
    // instead of just dropping them. Pushed directly (not via pushUnique/
    // seen) since two same-named photo-less artists would otherwise generate
    // the same seed and the second one would get silently skipped.
    if (items.length === itemCountBeforeThisArtist) {
      items.push({
        id: `artist-fallback-${artist.id}`,
        src: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(artist.name || artist.id)}`,
        href,
        name: artist.name,
        kind: "artist-profile",
        source: "real",
      });
    }

    const videoUrl = getMotionVideoUrl(artist);
    if (videoUrl) {
      items.push({
        id: `artist-video-${artist.id}`,
        src: profileImages[0] || "",
        videoUrl,
        href,
        name: artist.name,
        kind: "artist-video",
        source: "real",
      });
    }
  }
  return items;
}

/** Real company-derived cards: each work's images, then representative/profile images. */
function companyFeedItems(companies: Company[], seen: Set<string>): FeedItem[] {
  const items: FeedItem[] = [];
  for (const company of companies) {
    const href = getCompanyDetailHref(company.slug || company.id);
    const works = normalizeWorks(company.works);
    const itemCountBeforeThisCompany = items.length;
    for (const work of works) {
      for (const img of work.images) {
        pushUnique(items, seen, {
          id: `company-work-${company.id}-${work.id}-${img}`,
          src: img,
          href,
          name: company.name,
          kind: "company-work",
          source: "real",
        });
      }
    }

    const images = [
      ...(company.representative_images || []),
      company.profile_image_url,
      ...(company.profile_image_urls || []),
    ].filter((u): u is string => Boolean(u && u.trim()));
    for (const img of images) {
      pushUnique(items, seen, {
        id: `company-image-${company.id}-${img}`,
        src: img,
        href,
        name: company.name,
        kind: "company-image",
        source: "real",
      });
    }

    // Same fallback as artistFeedItems above — a company with no work images
    // and no representative/profile photo would otherwise never appear.
    if (items.length === itemCountBeforeThisCompany) {
      items.push({
        id: `company-fallback-${company.id}`,
        src: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(company.name || company.id)}`,
        href,
        name: company.name,
        kind: "company-image",
        source: "real",
      });
    }

    const videoUrl = getMotionVideoUrl(company);
    if (videoUrl) {
      items.push({
        id: `company-video-${company.id}`,
        src: images[0] || "",
        videoUrl,
        href,
        name: company.name,
        kind: "company-video",
        source: "real",
      });
    }
  }
  return items;
}

/**
 * Deterministic round-robin interleave across the source buckets, so
 * artist/company content mixes naturally without relying on Math.random()
 * (which would produce a different order on the server render vs. the
 * client hydration pass and trigger a hydration mismatch).
 */
function interleave(buckets: FeedItem[][]): FeedItem[] {
  const result: FeedItem[] = [];
  const maxLen = Math.max(0, ...buckets.map((b) => b.length));
  for (let i = 0; i < maxLen; i++) {
    for (const bucket of buckets) {
      if (bucket[i]) result.push(bucket[i]);
    }
  }
  return result;
}

/** Real feed items only — no placeholder filler. Deterministic across server/client renders. */
export function buildRealFeedItems(artists: Artist[], companies: Company[]): FeedItem[] {
  const seen = new Set<string>();
  return interleave([artistFeedItems(artists, seen), companyFeedItems(companies, seen)]);
}

// ── Prototype-only placeholder filler ──────────────────────────────────────
// Used only to fill out the visual density of the masonry grid when real
// content is sparse. Abstract stage-light/curtain mood graphics (not
// photographs of real people or venues), on-brand navy/lime, mixed aspect
// ratios per the "don't crop every image to the same shape" requirement.
// Never uploaded anywhere — static files under public/, referenced by path.
const PLACEHOLDER_DIR = "/images/home-feed-placeholder";

export const PLACEHOLDER_FEED_ITEMS: FeedItem[] = [
  { id: "mock-spotlight-portrait", src: `${PLACEHOLDER_DIR}/mock-spotlight-portrait.svg`, href: null, name: null, kind: "placeholder", source: "placeholder" },
  { id: "mock-curtain-square", src: `${PLACEHOLDER_DIR}/mock-curtain-square.svg`, href: null, name: null, kind: "placeholder", source: "placeholder" },
  { id: "mock-stage-landscape", src: `${PLACEHOLDER_DIR}/mock-stage-landscape.svg`, href: null, name: null, kind: "placeholder", source: "placeholder" },
  { id: "mock-silhouette-tall", src: `${PLACEHOLDER_DIR}/mock-silhouette-tall.svg`, href: null, name: null, kind: "placeholder", source: "placeholder" },
  { id: "mock-rehearsal-wide", src: `${PLACEHOLDER_DIR}/mock-rehearsal-wide.svg`, href: null, name: null, kind: "placeholder", source: "placeholder" },
  { id: "mock-poster-portrait", src: `${PLACEHOLDER_DIR}/mock-poster-portrait.svg`, href: null, name: null, kind: "placeholder", source: "placeholder" },
];

/**
 * Pads `real` up to `targetCount` by cycling through PLACEHOLDER_FEED_ITEMS
 * (never Math.random — must stay deterministic, see interleave() above).
 * Each cycle gets a unique id suffix so React keys never collide.
 * prototypeOnly=true flags every appended item for the mock/placeholder ID
 * requirement — real items never carry this flag.
 */
export function padWithPlaceholders(real: FeedItem[], targetCount: number): (FeedItem & { prototypeOnly?: boolean })[] {
  if (real.length >= targetCount || PLACEHOLDER_FEED_ITEMS.length === 0) return real;
  const padded: (FeedItem & { prototypeOnly?: boolean })[] = [...real];
  let cycle = 0;
  while (padded.length < targetCount) {
    const base = PLACEHOLDER_FEED_ITEMS[padded.length % PLACEHOLDER_FEED_ITEMS.length];
    padded.push({ ...base, id: `${base.id}-${cycle}`, prototypeOnly: true });
    if ((padded.length - real.length) % PLACEHOLDER_FEED_ITEMS.length === 0) cycle++;
  }
  return padded;
}
