"use client";

import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Company } from "@/types";
import DigitalCard from "./DigitalCard";
import PopokCard from "@/components/PopokCard";
import RepresentativePlaceholderCard from "./RepresentativePlaceholderCard";

export interface RepresentativeArtist {
  id: string;
  name: string;
  name_en?: string | null;
  profile_image_url?: string | null;
  slug?: string | null;
  instagram?: string | null;
  website?: string | null;
  email?: string | null;
  role?: string | null;
  genre?: string | null;
}

interface CompanyRepresentativeCardStackProps {
  company: Company;
  representative: RepresentativeArtist | null;
  viewCount?: number;
  connectedArtistCount?: number;
}

export default function CompanyRepresentativeCardStack({
  company,
  representative,
  viewCount,
  connectedArtistCount,
}: CompanyRepresentativeCardStackProps) {
  const [activeCard, setActiveCard] = useState<"company" | "representative">("company");
  const [isCompanyFlipped, setIsCompanyFlipped] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle ESC key to return to company card when representative card is active
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

  // Log warning in development when no representative is resolved
  useEffect(() => {
    if (!representative && process.env.NODE_ENV !== "production") {
      console.warn("[CompanyRepresentativeCardStack] No representative resolved", {
        companyId: company.id,
        companySlug: company.slug,
        connectedArtistCount,
      });
    }
  }, [representative, company.id, company.slug, connectedArtistCount]);

  // Animation values based on responsive breakpoint and strict specifications
  const backX = isMobile ? 7 : 12;
  const backY = isMobile ? 7 : 10;
  const backRotate = isMobile ? 0.8 : 1.5;
  const backScale = isMobile ? 0.99 : 0.985;

  // 1. Company Card Animation Configurations
  const companyAnimate = shouldReduceMotion
    ? {
        x: activeCard === "company" ? 0 : backX,
        y: activeCard === "company" ? 0 : backY,
        scale: activeCard === "company" ? 1 : backScale,
        rotate: activeCard === "company" ? 0 : backRotate,
        zIndex: activeCard === "company" ? 20 : 10,
        opacity: activeCard === "company" ? 1 : 0.85,
      }
    : {
        x: activeCard === "company" ? 0 : [0, -140, backX],
        y: activeCard === "company" ? 0 : [0, 0, backY],
        scale: activeCard === "company" ? 1 : [1, 0.95, backScale],
        rotate: activeCard === "company" ? 0 : [0, -2, backRotate],
        zIndex: activeCard === "company" ? 20 : 10,
        opacity: activeCard === "company" ? 1 : 0.85,
      };

  // Custom transitions to bypass Framer Motion's "spring with 3 keyframes" error
  const companyTransition = shouldReduceMotion
    ? { duration: 0.1 }
    : activeCard === "company"
    ? {
        // Coming to front (no keyframe array, safe to use spring)
        x: { type: "spring", stiffness: 260, damping: 24 },
        y: { type: "spring", stiffness: 260, damping: 24 },
        scale: { type: "spring", stiffness: 260, damping: 24 },
        rotate: { type: "spring", stiffness: 260, damping: 24 },
        zIndex: { duration: 0.01, delay: 0.2 },
        opacity: { duration: 0.2 },
      }
    : {
        // Going to back (uses keyframe array, MUST use tween)
        x: { type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.42 },
        y: { type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.42 },
        scale: { type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.42 },
        rotate: { type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.42 },
        zIndex: { duration: 0.01, delay: 0.2 },
        opacity: { duration: 0.2 },
      };

  // 2. Representative Card/Placeholder Animation Configurations
  const repAnimate = shouldReduceMotion
    ? {
        x: activeCard === "representative" ? 0 : backX,
        y: activeCard === "representative" ? 0 : backY,
        scale: activeCard === "representative" ? 1 : backScale,
        rotate: activeCard === "representative" ? 0 : backRotate,
        zIndex: activeCard === "representative" ? 20 : 10,
        opacity: activeCard === "representative" ? 1 : 0.85,
      }
    : {
        x: activeCard === "representative" ? 0 : [0, -140, backX],
        y: activeCard === "representative" ? 0 : [0, 0, backY],
        scale: activeCard === "representative" ? 1 : [1, 0.95, backScale],
        rotate: activeCard === "representative" ? 0 : [0, -2, backRotate],
        zIndex: activeCard === "representative" ? 20 : 10,
        opacity: activeCard === "representative" ? 1 : 0.85,
      };

  const repTransition = shouldReduceMotion
    ? { duration: 0.1 }
    : activeCard === "representative"
    ? {
        // Coming to front (no keyframe array, safe to use spring)
        x: { type: "spring", stiffness: 260, damping: 24 },
        y: { type: "spring", stiffness: 260, damping: 24 },
        scale: { type: "spring", stiffness: 260, damping: 24 },
        rotate: { type: "spring", stiffness: 260, damping: 24 },
        zIndex: { duration: 0.01, delay: 0.2 },
        opacity: { duration: 0.2 },
      }
    : {
        // Going to back (uses keyframe array, MUST use tween)
        x: { type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.42 },
        y: { type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.42 },
        scale: { type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.42 },
        rotate: { type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.42 },
        zIndex: { duration: 0.01, delay: 0.2 },
        opacity: { duration: 0.2 },
      };

  // Button text logic
  const toggleButtonText =
    activeCard === "company"
      ? representative
        ? "Artistic Director 보기 →"
        : "Artistic Director 확인 →"
      : "단체 카드 보기 ←";

  return (
    <div
      className="company-representative-card-stack"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: `calc(310px + ${backX}px)`,
        margin: "0 auto",
        overflow: "visible",
        paddingRight: `${backX}px`,
        paddingBottom: `${backY}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <style jsx global>{`
        .company-card-layer.is-back > div > div:nth-child(2),
        .representative-card-layer.is-back > div > div:nth-child(2) {
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>

      {/* 3D Stack container wrapper with preserved 3D context */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "310px",
          margin: 0,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Representative Card Label: fades in above card when active */}
        <div
          style={{
            position: "absolute",
            top: "-28px",
            left: "0",
            fontSize: "0.68rem",
            fontWeight: 900,
            color: "var(--navy)",
            letterSpacing: "0.08em",
            opacity: activeCard === "representative" ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
            zIndex: 30,
          }}
        >
          ARTISTIC DIRECTOR
        </div>

        {/* 1. Company Card Layer */}
        <motion.div
          className={`company-card-layer ${activeCard === "representative" ? "is-back" : "is-front"}`}
          animate={companyAnimate}
          transition={companyTransition}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "310px",
            transformStyle: "preserve-3d",
            pointerEvents: activeCard === "company" ? "auto" : "none",
          }}
        >
          <DigitalCard
            company={company}
            viewCount={viewCount}
            flipped={isCompanyFlipped}
            onFlipChange={setIsCompanyFlipped}
          />
        </motion.div>

        {/* 2. Representative Card/Placeholder Layer */}
        <motion.div
          className={`representative-card-layer ${activeCard === "company" ? "is-back" : "is-front"}`}
          animate={repAnimate}
          transition={repTransition}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            maxWidth: "310px",
            transformStyle: "preserve-3d",
            pointerEvents: activeCard === "representative" ? "auto" : "none",
          }}
        >
          {representative ? (
            <PopokCard
              name={representative.name}
              nameEn={representative.name_en || undefined}
              genre={representative.genre ?? null}
              instagram={representative.instagram ?? null}
              id={representative.id}
              slug={representative.slug || representative.id}
              profileImage={representative.profile_image_url || undefined}
            />
          ) : (
            <RepresentativePlaceholderCard />
          )}
        </motion.div>
      </div>

      {/* 3. Transition Button Container */}
      <div
        className="stack-toggle-container"
        style={{
          marginTop: "16px",
          display: "flex",
          justifyContent: "center",
          width: "100%",
          zIndex: 40,
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveCard(activeCard === "company" ? "representative" : "company");
          }}
          aria-label={
            activeCard === "company"
              ? "단체 대표 아티스트 카드 보기"
              : "단체 카드 보기"
          }
          style={{
            background: "rgba(23, 20, 17, 0.9)",
            color: "#FFFFFF",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            padding: "8px 16px",
            fontSize: "0.75rem",
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            transition: "all 0.2s ease",
            minHeight: "44px",
            minWidth: "120px",
            justifyContent: "center",
          }}
          className="stack-toggle-btn"
        >
          {toggleButtonText}
        </button>
      </div>
    </div>
  );
}
