"use client";

import { useState } from "react";

// Swaps to the section's letterform fallback on a broken/unreachable image
// (crawled poster URL, expired hotlink, etc.) instead of the bare broken-image icon.
export default function MagazineImage({ src, alt, className, priority }: { src: string; alt: string; className?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img src={src} alt={alt} className={className} loading={priority ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} />;
}
