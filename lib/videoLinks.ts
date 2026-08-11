import { isYouTubeUrl } from "./youtube";

export function extractVimeoVideoId(input?: string | null): string | null {
  if (!input) return null;
  const cleaned = input.trim().replace(/^\[|\]$/g, "").replace(/[()]/g, "");

  try {
    const url = new URL(cleaned);
    const host = url.hostname.replace(/^www\./, "");
    if (!host.includes("vimeo.com")) return null;

    const parts = url.pathname.split("/").filter(Boolean);
    const numericPart = [...parts].reverse().find((part) => /^\d+$/.test(part));
    return numericPart || null;
  } catch {
    return null;
  }
}

export function isVimeoUrl(input?: string | null) {
  return Boolean(extractVimeoVideoId(input));
}

export function isSupportedMotionVideoUrl(input?: string | null) {
  return isYouTubeUrl(input) || isVimeoUrl(input);
}

export function getVimeoEmbedUrl(input?: string | null, autoplay = true) {
  const videoId = extractVimeoVideoId(input);
  if (!videoId) return null;

  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    muted: "1",
    loop: "1",
    background: autoplay ? "1" : "0",
    byline: "0",
    portrait: "0",
    title: "0",
    playsinline: "1",
  });

  return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
}
