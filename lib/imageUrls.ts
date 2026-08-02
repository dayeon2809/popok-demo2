const SUPABASE_PUBLIC_MARKER = "/storage/v1/object/public/";
const IMAGE_WIDTHS = [32, 48, 64, 96, 128, 256, 384, 600] as const;

export function isSupabasePublicImageUrl(src: string): boolean {
  return /^https?:\/\//i.test(src) && src.includes(SUPABASE_PUBLIC_MARKER);
}

function selectWidth(requestedWidth: number, maxWidth = 600): number {
  const capped = Math.max(1, Math.min(maxWidth, Math.round(requestedWidth)));
  return IMAGE_WIDTHS.find((width) => width >= capped) || 600;
}

export function getNextImageUrl(src: string, width: number, quality = 80, maxWidth = 600): string {
  if (!isSupabasePublicImageUrl(src)) return src;
  const optimizedWidth = selectWidth(width, maxWidth);
  return `/api/image?url=${encodeURIComponent(src)}&w=${optimizedWidth}&q=${Math.min(80, quality)}`;
}

export function getListImageUrl(src: string, width = 600): string {
  return getNextImageUrl(src, width, 80, 600);
}