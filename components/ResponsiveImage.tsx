"use client";

import Image, { type ImageLoader } from "next/image";
import type { CSSProperties } from "react";
import { getNextImageUrl, isSupabasePublicImageUrl } from "@/lib/imageUrls";

interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  style?: CSSProperties;
  maxWidth?: number;
  quality?: number;
  loading?: "lazy" | "eager";
  onError?: () => void;
}

export default function ResponsiveImage({
  src,
  alt,
  sizes,
  className,
  style,
  maxWidth = 600,
  quality = 80,
  loading = "lazy",
  onError,
}: ResponsiveImageProps) {
  const supabase = isSupabasePublicImageUrl(src);
  const local = src.startsWith("/") && !src.startsWith("//");

  if (!supabase && !local) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        sizes={sizes}
        onError={onError}
        style={{ width: "100%", height: "100%", objectFit: "cover", ...style }}
      />
    );
  }

  const loader: ImageLoader | undefined = supabase
    ? ({ src: imageSrc, width, quality: requestedQuality }) =>
        getNextImageUrl(imageSrc, width, requestedQuality || quality, maxWidth)
    : undefined;

  return (
    <Image
      loader={loader}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={quality}
      loading={loading}
      className={className}
      onError={onError}
      style={{ objectFit: "cover", ...style }}
    />
  );
}