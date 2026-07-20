"use client";

import React, { useEffect, useState } from "react";
import type { Company } from "@/types";
import DigitalCard from "./DigitalCard";
import PopokCard from "@/components/PopokCard";
import type { RepresentativeArtistResult } from "@/lib/companies";

interface CompanyCardStackProps {
  company: Company;
  viewCount?: number;
  representativeArtist?: RepresentativeArtistResult | null;
}

export default function CompanyCardStack({
  company,
  viewCount,
  representativeArtist,
}: CompanyCardStackProps) {
  const representative = representativeArtist?.artist || null;
  const showBackCard = Boolean(representative);

  const [activeCard, setActiveCard] = useState<"company" | "representative">("company");
  const [isCompanyFlipped, setIsCompanyFlipped] = useState(false);

  if (process.env.NODE_ENV !== "production") {
    console.log("[CompanyCardStack representative]", {
      companySlug: company.slug,
      artistId: representativeArtist?.artist?.id,
      artistName: representativeArtist?.artist?.name,
      hasRepresentative: showBackCard,
      activeCard,
    });
  }

  // Enforce company active state if representative is null
  useEffect(() => {
    if (!showBackCard) {
      setActiveCard("company");
    }
  }, [showBackCard]);

  const handleActivateRepresentative = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!showBackCard) return;
    setActiveCard("representative");
  };

  const handleActivateCompany = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveCard("company");
  };

  useEffect(() => {
    if (activeCard !== "representative") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveCard("company");
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeCard]);

  return (
    <div className={`company-card-stack-root ${showBackCard ? "has-representative" : ""}`}>
      <style jsx>{`
        .company-card-stack-root {
          position: relative;
          width: 100%;
          max-width: 310px;
          margin: 0 auto;
          overflow: visible;
        }
        .company-card-stack-root.has-representative {
          max-width: calc(310px + 20px);
        }

        .card-layer {
          width: 100%;
          max-width: 310px;
          transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms ease;
        }

        /* Company Card Layer */
        .company-layer {
          position: relative;
        }
        .company-layer.is-front {
          z-index: 3;
          transform: translate(0, 0) scale(1) rotate(0deg);
          opacity: 1;
        }
        .company-layer.is-back {
          z-index: 1;
          transform: translate(-14px, -10px) scale(0.96) rotate(-2deg);
          opacity: 0.85;
          cursor: pointer;
        }

        /* Representative Artist Layer */
        .artist-layer {
          position: absolute;
          top: 0;
          left: 0;
        }
        .artist-layer.is-back {
          z-index: 1;
          transform: translate(20px, 14px) scale(0.97) rotate(2deg);
          opacity: 0.95;
          cursor: pointer;
        }
        .artist-layer.is-front {
          z-index: 4;
          transform: translate(0, 0) scale(1) rotate(0deg);
          opacity: 1;
        }

        @media (max-width: 640px) {
          .artist-layer.is-back {
            transform: translate(12px, 10px) scale(0.97) rotate(1.5deg);
          }
          .company-layer.is-back {
            transform: translate(-10px, -8px) scale(0.96) rotate(-1.5deg);
          }
        }
      `}</style>

      {/* 1. Company Digital Card Layer */}
      <div
        className={`card-layer company-layer ${activeCard === "company" ? "is-front" : "is-back"}`}
        onClick={activeCard === "representative" ? handleActivateCompany : undefined}
      >
        <DigitalCard
          company={company}
          viewCount={viewCount}
          flipped={isCompanyFlipped}
          onFlipChange={setIsCompanyFlipped}
        />
      </div>

      {/* 2. Connected Representative Artist Card Layer (Only rendered if representative exists) */}
      {showBackCard && representative && (
        <div
          className={`card-layer artist-layer ${activeCard === "representative" ? "is-front" : "is-back"}`}
          onClick={activeCard === "company" ? handleActivateRepresentative : undefined}
        >
          <div style={{ position: "relative" }}>
            {/* Navigation Return Button when Representative Card is active */}
            {activeCard === "representative" && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <button
                  type="button"
                  onClick={handleActivateCompany}
                  style={{
                    background: "rgba(23, 20, 17, 0.88)",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "20px",
                    padding: "4px 12px",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  }}
                >
                  ← 단체 명함 보기
                </button>
              </div>
            )}

            {/* Reused actual PopokCard component */}
            <div
              onClick={(e) => {
                if (activeCard === "representative") {
                  e.stopPropagation();
                }
              }}
            >
              <PopokCard
                name={representative.name}
                nameEn={representative.name_en || undefined}
                genre={representative.genre ?? null}
                instagram={representative.instagram ?? null}
                id={String(representative.recordId || representative.id || "")}
                slug={representative.slug || representative.id}
                profileImage={representative.profile_image_url || (representative as any).profileImage || undefined}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
