"use client";

import React, { useEffect, useState } from "react";
import type { Company } from "@/types";
import DigitalCard from "./DigitalCard";
import CompanyRepresentativeCard, {
  hasRepresentativeCardData,
  type RepresentativeArtist,
} from "./CompanyRepresentativeCard";

interface CompanyCardStackProps {
  company: Company;
  viewCount?: number;
  artists: any[];
}

// Priority for resolving "who represents this company": an explicit,
// currently-active primary artist_companies relation. There is no
// representative_artist_id / owner_id-as-artist column in the schema, and
// is_primary is only unique per-artist (not per-company), so if a company
// somehow has more than one is_primary && is_current relation, we
// deterministically take the first and do not attempt to guess further.
function resolveRepresentative(artists: any[]): RepresentativeArtist | null {
  if (!Array.isArray(artists)) return null;
  return artists.find((a) => a && a.is_primary && a.is_current) || null;
}

export default function CompanyCardStack({ company, viewCount, artists = [] }: CompanyCardStackProps) {
  const representative = resolveRepresentative(artists);
  const showBackCard = hasRepresentativeCardData(company, representative);

  const [isCompanyFlipped, setIsCompanyFlipped] = useState(false);
  const [isRepresentativeActive, setIsRepresentativeActive] = useState(false);

  const handleRepresentativeActivate = () => {
    // Representative card can only come forward once the company card has
    // been flipped to its back face — matches the intended reveal order.
    if (!isCompanyFlipped || !representative) return;
    setIsRepresentativeActive(true);
  };

  const handleRepresentativeClose = () => {
    setIsRepresentativeActive(false);
  };

  useEffect(() => {
    if (!isRepresentativeActive) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsRepresentativeActive(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isRepresentativeActive]);

  const stackClassName = [
    "company-card-stack",
    showBackCard && "has-back",
    isRepresentativeActive && "is-representative-active",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={stackClassName}>
      <style jsx>{`
        .company-card-stack {
          position: relative;
          width: 100%;
          max-width: 310px;
          margin: 0 auto;
          --stack-offset-x: 24px;
          --stack-offset-y: 18px;
          --stack-rotate: 1.5deg;
        }
        .company-card-stack.has-back {
          max-width: calc(310px + 24px);
        }
        .company-card-stack-front {
          position: relative;
          z-index: 2;
          width: 100%;
        }
        .company-card-stack.has-back .company-card-stack-front {
          width: calc(100% - var(--stack-offset-x));
        }
        .company-card-stack.is-representative-active .company-card-stack-front {
          pointer-events: none;
        }
        .company-card-stack-back {
          position: absolute;
          top: 0;
          left: 0;
          width: calc(100% - var(--stack-offset-x));
          z-index: 1;
          transform: translate(var(--stack-offset-x), var(--stack-offset-y)) rotate(var(--stack-rotate));
          transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .company-card-stack.is-representative-active .company-card-stack-back {
          z-index: 4;
          transform: translate(0, 0) rotate(0deg);
        }
        @media (max-width: 640px) {
          .company-card-stack {
            --stack-offset-x: 12px;
            --stack-offset-y: 10px;
            --stack-rotate: 1deg;
          }
          .company-card-stack.has-back {
            max-width: calc(310px + 12px);
          }
        }
        @media (max-width: 380px) {
          .company-card-stack {
            --stack-offset-x: 8px;
            --stack-offset-y: 8px;
            --stack-rotate: 0deg;
          }
          .company-card-stack.has-back {
            max-width: calc(310px + 8px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .company-card-stack-back {
            transition: none;
          }
        }
      `}</style>

      {showBackCard && (
        <div className="company-card-stack-back">
          <CompanyRepresentativeCard
            company={company}
            representative={representative}
            isCompanyFlipped={isCompanyFlipped}
            isActive={isRepresentativeActive}
            onActivate={handleRepresentativeActivate}
            onClose={handleRepresentativeClose}
          />
        </div>
      )}

      <div className="company-card-stack-front" inert={isRepresentativeActive}>
        <DigitalCard
          company={company}
          viewCount={viewCount}
          flipped={isCompanyFlipped}
          onFlipChange={setIsCompanyFlipped}
        />
      </div>
    </div>
  );
}
