"use client";

import RepresentativeGallery from "@/components/RepresentativeGallery";

interface CompanyGalleryProps {
  images: string[] | null | undefined;
}

export default function CompanyGallery({ images }: CompanyGalleryProps) {
  return <RepresentativeGallery images={images} />;
}
