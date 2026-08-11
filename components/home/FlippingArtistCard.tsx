"use client";

import PopokCard from "@/components/PopokCard";
import { useAutoFlip } from "@/lib/useAutoFlip";

interface FlippingArtistCardProps {
  name: string;
  nameEn?: string;
  genre: string | null;
  instagram: string | null;
  id: string;
  slug?: string;
  profileImage?: string;
}

// Mirrors components/home/FlippingCompanyCard.tsx — same useAutoFlip behavior,
// just wrapping PopokCard instead of DigitalCard, for the home artist carousel.
export default function FlippingArtistCard(props: FlippingArtistCardProps) {
  const { flipped, onFlipChange } = useAutoFlip();
  return <PopokCard {...props} flipped={flipped} onFlipChange={onFlipChange} />;
}
