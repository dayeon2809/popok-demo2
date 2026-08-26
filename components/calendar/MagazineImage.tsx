"use client";

import { useState } from "react";

import { getListImageUrl } from "@/lib/imageUrls";

// Swaps to the section's letterform fallback on a broken/unreachable image
// (crawled poster URL, expired hotlink, etc.) instead of the bare broken-image icon.
//
// The src goes through the resize proxy: six magazine sections share this one
// component, and until they did, /performances alone shipped 2.42 MB of Storage
// originals per view — one poster was 1.71 MB. getListImageUrl leaves non-Supabase
// URLs (crawled posters, hotlinks) untouched, which is what the fallback above is for.
//
// No per-slot width. Every distinct w= is its own CDN cache entry, and each entry
// re-fetches the full original from Storage to fill — so extra widths cost egress
// rather than saving it. 600 is the proxy's ceiling and what the rest of the site asks for.
export default function MagazineImage({ src, alt, className, priority }: { src: string; alt: string; className?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img src={getListImageUrl(src)} alt={alt} className={className} loading={priority ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} />;
}
