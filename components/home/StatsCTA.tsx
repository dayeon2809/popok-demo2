"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/useLanguage";
import { localizePath } from "@/lib/i18n/locale";

interface StatsCTAProps {
  artistCount: number;
  companyCount: number;
  performanceCount: number;
  opportunityCount: number;
}

export default function StatsCTA({ artistCount, companyCount, performanceCount, opportunityCount }: StatsCTAProps) {
  const { language } = useLanguage();
  const en = language === "en";
  const activityCount = performanceCount + opportunityCount;

  return (
    <section className="home-community-cta" aria-labelledby="home-community-title">
      <div className="home-community-card">
        <div className="home-community-intro">
          <p className="home-community-eyebrow">GROWING WITH POPOK</p>
          <h2 id="home-community-title" className="display">
            {en ? "POPOK, right now" : "지금, POPOK에는"}
          </h2>
        </div>
        <dl className="home-community-stats">
          <div>
            <dt>{en ? "Registered artists" : "등록 예술가"}</dt>
            <dd><strong>{artistCount.toLocaleString()}</strong><span>{en ? " artists" : "명"}</span></dd>
          </div>
          <div>
            <dt>{en ? "Organizations" : "단체"}</dt>
            <dd><strong>{companyCount.toLocaleString()}</strong><span>{en ? " organizations" : "개"}</span></dd>
          </div>
          <div>
            <dt>{en ? "Performances & opportunities" : "공연 및 기회"}</dt>
            <dd><strong>{activityCount.toLocaleString()}</strong><span>{en ? " listings" : "개"}</span></dd>
          </div>
        </dl>
        <div className="home-community-footnote">
          <p>
            {en
              ? "Artists are documenting their work and meeting their next stage on POPOK."
              : "예술가들이 자신의 활동을 기록하고 다음 무대를 만나고 있어요."}
          </p>
          <Link href={localizePath("/artists", language)} className="home-community-link">
            {en ? "View artists" : "아티스트 보기"}<span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
