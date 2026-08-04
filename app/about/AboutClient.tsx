"use client";

import AboutHero from "@/components/about/AboutHero";
import OriginStorySection from "@/components/about/OriginStorySection";
import HowWeWorkSection from "@/components/about/HowWeWorkSection";
import RoadmapSection from "@/components/about/RoadmapSection";
import AboutPremiumSection from "@/components/about/AboutPremiumSection";
import TeamSection from "@/components/about/TeamSection";
import FAQSection from "@/components/FAQSection";

export default function AboutClient() {
  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh", overflowX: "hidden" }}>
      <AboutHero />
      <OriginStorySection />
      <HowWeWorkSection />
      <RoadmapSection />
      <AboutPremiumSection />
      <TeamSection />
      <FAQSection />
    </div>
  );
}
