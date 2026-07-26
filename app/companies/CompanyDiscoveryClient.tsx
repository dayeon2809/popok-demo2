"use client";

import { useMemo, useState } from "react";
import CompanyCard from "@/components/CompanyCard";
import DiscoveryCard from "@/components/discovery/DiscoveryCard";
import DiscoveryGrid from "@/components/discovery/DiscoveryGrid";
import DiscoveryLayout from "@/components/discovery/DiscoveryLayout";
import KeywordSelector, { type KeywordGroup } from "@/components/discovery/KeywordSelector";
import { EmptyState } from "@/components/ui/States";
import { COMPANY_RECOMMENDATION_QUESTIONS, getFallbackCompanies, recommendCompanies } from "@/lib/companyRecommendation";
import type { Company } from "@/types";

const COMPANY_KEYWORDS: readonly KeywordGroup[] = COMPANY_RECOMMENDATION_QUESTIONS.map((question) => ({
  id: question.id,
  label: question.id === "field" ? "분야" : question.id === "mood" ? "분위기" : question.id === "format" ? "작업 방식" : "주제",
  options: question.options,
}));

export default function CompanyDiscoveryClient({ companies }: { companies: Company[] }) {
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const recommendations = useMemo(() => appliedIds.length ? recommendCompanies(companies, appliedIds, 3) : [],
    [appliedIds, companies]);
  const recommendedCompanies = recommendations.length ? recommendations.map((result) => result.company)
    : appliedIds.length ? getFallbackCompanies(companies, 3) : [];
  const toggle = (id: string) => setDraftIds((current) =>
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return (
    <DiscoveryLayout active="companies" eyebrow="POPOK COMPANY DISCOVERY" title="함께하고 싶은 단체를 발견하세요"
      description="관심 분야와 작업 성향을 고르면 기존 POPOK 추천 로직이 공개 단체 정보에서 어울리는 팀을 찾아드려요.">
      <KeywordSelector groups={COMPANY_KEYWORDS} selectedIds={draftIds} onToggle={toggle}
        onExplore={() => setAppliedIds(draftIds)} actionLabel="나에게 맞는 단체 찾기" />

      {appliedIds.length > 0 && <section className="discovery-results discovery-recommendations" aria-labelledby="company-recommendations-title">
        <div className="discovery-section-heading">
          <div><span className="mono">POPOK MATCH</span><h2 id="company-recommendations-title">
            {recommendations.length ? "나와 잘맞는 추천 단체" : "POPOK 추천 단체"}</h2></div>
          <button type="button" className="discovery-reset" onClick={() => { setDraftIds([]); setAppliedIds([]); }}>다시 선택하기</button>
        </div>
        {!recommendations.length && <p className="discovery-fallback">정확히 일치하는 정보가 부족해 완성도 높은 공개 단체를 보여드려요.</p>}
        <DiscoveryGrid ariaLabel="추천 단체">
          {recommendedCompanies.map((company, index) => {
            const recommendation = recommendations[index];
            return <DiscoveryCard key={company.id}>
              <div className="discovery-match-meta">
                <strong>추천 {index + 1}위</strong>
                {recommendation && <span>적합도 {recommendation.percentage}%</span>}
                {recommendation?.reasons[0] && <p>{recommendation.reasons[0]}</p>}
              </div>
              <CompanyCard company={company} />
            </DiscoveryCard>;
          })}
        </DiscoveryGrid>
      </section>}

      <section className="discovery-results" aria-labelledby="all-companies-title">
        <div className="discovery-section-heading">
          <div><span className="mono">ALL COMPANIES</span><h2 id="all-companies-title">전체 단체</h2></div>
          <p>{companies.length}개 단체</p>
        </div>
        {companies.length ? <DiscoveryGrid ariaLabel="전체 단체">
          {companies.map((company) => <DiscoveryCard key={company.id}><CompanyCard company={company} /></DiscoveryCard>)}
        </DiscoveryGrid> : <EmptyState message="공개된 단체가 아직 없습니다." />}
      </section>
    </DiscoveryLayout>
  );
}
