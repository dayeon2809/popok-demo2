import { extractYouTubeVideoId } from "./youtube";
import { extractVimeoVideoId } from "./videoLinks";

/**
 * Returns a clean YouTube embed URL from any supported format (Shorts, standard, youtu.be).
 */
export function getYouTubeEmbedUrl(url?: string | null): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Normalizes and compares two video URLs (by ID if YouTube/Vimeo, otherwise string match).
 */
export function isSameVideoUrl(urlA?: string | null, urlB?: string | null): boolean {
  if (!urlA || !urlB) return false;
  const cleanA = urlA.trim();
  const cleanB = urlB.trim();
  if (cleanA === cleanB) return true;

  const ytA = extractYouTubeVideoId(cleanA);
  const ytB = extractYouTubeVideoId(cleanB);
  if (ytA && ytB && ytA === ytB) return true;

  const vimA = extractVimeoVideoId(cleanA);
  const vimB = extractVimeoVideoId(cleanB);
  if (vimA && vimB && vimA === vimB) return true;

  return false;
}

/**
 * Checks if the URL points directly to an MP4/MOV/WebM/OGG file.
 */
export function isDirectVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|mov|webm|ogg)($|\?)/i.test(url.trim());
}
