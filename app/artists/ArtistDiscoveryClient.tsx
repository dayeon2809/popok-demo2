"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ArtistCard from "@/components/ArtistCard";
import DiscoveryCard from "@/components/discovery/DiscoveryCard";
import DiscoveryGrid from "@/components/discovery/DiscoveryGrid";
import DiscoveryLayout from "@/components/discovery/DiscoveryLayout";
import KeywordSelector, { type KeywordGroup } from "@/components/discovery/KeywordSelector";
import { EmptyState } from "@/components/ui/States";
import type { Artist } from "@/types";

const ARTIST_KEYWORDS: readonly KeywordGroup[] = [
  { id: "mood", label: "분위기", options: [
    { id: "experimental", label: "실험적", terms: ["실험", "experimental", "다원", "융복합"] },
    { id: "minimal", label: "미니멀", terms: ["미니멀", "minimal", "절제", "고요"] },
    { id: "powerful", label: "강렬한", terms: ["강렬", "에너지", "역동", "powerful"] },
  ]},
  { id: "method", label: "작업 방식", options: [
    { id: "audience", label: "관객 참여", terms: ["관객 참여", "관객참여", "인터랙티브", "참여형"] },
    { id: "body-centered", label: "신체 중심", terms: ["몸", "신체", "움직임", "안무"] },
    { id: "technology", label: "기술 결합", terms: ["기술", "디지털", "미디어", "technology", "ai"] },
  ]},
  { id: "genre", label: "장르", options: [
    { id: "contemporary", label: "현대무용", terms: ["현대무용", "현대 무용", "contemporary"] },
    { id: "ballet", label: "발레", terms: ["발레", "ballet"] },
    { id: "performance", label: "퍼포먼스", terms: ["퍼포먼스", "performance", "다원예술"] },
  ]},
  { id: "subject", label: "주제", options: [
    { id: "body", label: "몸", terms: ["몸", "신체"] },
    { id: "ai", label: "AI", terms: ["ai", "인공지능", "기술"] },
    { id: "memory", label: "기억", terms: ["기억", "회상", "역사"] },
    { id: "society", label: "사회", terms: ["사회", "공동체", "정치", "연대"] },
  ]},
];

function artistSearchText(artist: Artist) {
  return JSON.stringify([artist.field, artist.genre, artist.bio, artist.bio_short, artist.aiSummary,
    artist.tags, artist.works, artist.portfolio_works, artist.current_activity]).toLocaleLowerCase("ko-KR");
}

export default function ArtistDiscoveryClient({ artists }: { artists: Artist[] }) {
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const options = useMemo(() => ARTIST_KEYWORDS.flatMap((group) => group.options), []);
  const visibleArtists = useMemo(() => {
    if (!appliedIds.length) return artists;
    const selected = options.filter((option) => appliedIds.includes(option.id));
    return artists.filter((artist) => {
      const text = artistSearchText(artist);
      return selected.some((option) => option.terms?.some((term) => text.includes(term.toLocaleLowerCase("ko-KR"))));
    });
  }, [appliedIds, artists, options]);
  const toggle = (id: string) => setDraftIds((current) =>
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return (
    <DiscoveryLayout active="artists" eyebrow="POPOK ARTIST DISCOVERY" title="당신의 감각과 만나는 아티스트"
      description="검색어 대신 분위기, 작업 방식, 장르와 주제를 골라 새로운 작업 세계를 발견해 보세요.">
      <KeywordSelector groups={ARTIST_KEYWORDS} selectedIds={draftIds} onToggle={toggle}
        onExplore={() => setAppliedIds(draftIds)} actionLabel="아티스트 탐색" />
      <section className="discovery-results" aria-labelledby="artist-results-title">
        <div className="discovery-section-heading">
          <div><span className="mono">{appliedIds.length ? "DISCOVERY RESULT" : "ALL ARTISTS"}</span>
            <h2 id="artist-results-title">{appliedIds.length ? "선택한 키워드의 아티스트" : "전체 아티스트"}</h2></div>
          <p>{visibleArtists.length}명의 아티스트</p>
        </div>
        {visibleArtists.length ? <DiscoveryGrid ariaLabel="아티스트 탐색 결과">
          {visibleArtists.map((artist) => <DiscoveryCard key={artist.id}>
            <Link href={`/artists/${encodeURIComponent(artist.slug || artist.id)}`} className="discovery-card-link">
              <ArtistCard artist={artist} />
            </Link>
          </DiscoveryCard>)}
        </DiscoveryGrid> : <EmptyState message="선택한 키워드와 일치하는 아티스트가 아직 없습니다." />}
      </section>
    </DiscoveryLayout>
  );
}
