"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/useLanguage";
import { localizePath } from "@/lib/i18n/locale";

interface OpportunitiesSectionProps {
  total?: number;
  auditions?: number;
  collaborations?: number;
  grants?: number;
}

export default function OpportunitiesSection({
  total = 0,
  auditions = 0,
  collaborations = 0,
  grants = 0,
}: OpportunitiesSectionProps) {
  const { language } = useLanguage();
  const en = language === "en";

  return (
    <section className="home-opportunity-section" aria-labelledby="home-opportunity-title">
      <div className="home-opportunity-card">
        <div className="home-opportunity-copy">
          <p className="home-opportunity-eyebrow">POPOK OPPORTUNITIES</p>
          <h2 id="home-opportunity-title">
            {en ? "Opportunities open today" : "오늘 만날 수 있는 기회"}
          </h2>
          <p className="home-opportunity-breakdown">
            {en
              ? `${total} open · ${auditions} auditions · ${collaborations} collaborations · ${grants} grants`
              : `현재 ${total}개 · 오디션 ${auditions} · 협업 ${collaborations} · 지원사업 ${grants}`}
          </p>
        </div>
        <Link href={localizePath("/opportunities", language)} className="home-opportunity-link">
          {en ? "View all opportunities" : "기회 전체보기"}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
