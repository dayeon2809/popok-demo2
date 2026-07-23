"use client";

import DigitalCard from "@/components/company/DigitalCard";
import { useAutoFlip } from "@/lib/useAutoFlip";
import type { Company } from "@/types";

// Home-carousel wrapper around the company page's real flip card (DigitalCard),
// matching how the artist carousel shows a real, flippable PopokCard rather
// than a flat list-style tile. useAutoFlip adds a periodic auto-flip on top
// of DigitalCard's existing click-to-flip.
export default function FlippingCompanyCard({ company }: { company: Company }) {
  const { flipped, onFlipChange } = useAutoFlip();

  return (
    <div style={{ marginBottom: "-40px" }}>
      <DigitalCard company={company} flipped={flipped} onFlipChange={onFlipChange} />
    </div>
  );
}
