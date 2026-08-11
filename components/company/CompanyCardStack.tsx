"use client";

import React from "react";
import type { Company } from "@/types";
import type { RepresentativeArtistResult } from "@/lib/companies";
import CompanyRepresentativeCardStack from "./CompanyRepresentativeCardStack";

interface CompanyCardStackProps {
  company: Company;
  viewCount?: number;
  representativeArtist?: RepresentativeArtistResult | null;
  connectedArtistCount?: number;
}

export default function CompanyCardStack({
  company,
  viewCount,
  representativeArtist,
  connectedArtistCount,
}: CompanyCardStackProps) {
  // Adapter maps representativeArtist.artist to representative
  const artist = representativeArtist?.artist;
  const representative = artist
    ? {
        id: String(artist.recordId || artist.id || ""),
        name: artist.name || "",
        name_en: artist.name_en || null,
        profile_image_url: artist.profile_image_url || (artist as any).profileImage || null,
        slug: artist.slug || artist.id || null,
        instagram: artist.instagram || null,
        website: artist.website || null,
        email: (artist as any).email || null,
        role: artist.role || representativeArtist.role || null,
        genre: artist.genre || null,
      }
    : null;

  return (
    <CompanyRepresentativeCardStack
      company={company}
      representative={representative}
      viewCount={viewCount}
      connectedArtistCount={connectedArtistCount}
    />
  );
}
