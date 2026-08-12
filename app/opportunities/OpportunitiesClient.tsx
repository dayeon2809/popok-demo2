"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { analytics } from "@/lib/analytics";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import type { CollaborationPost, Opportunity, OpportunityCategory } from "@/lib/opportunities/types";
import styles from "./opportunities.module.css";

type FilterKey = "all" | "actor" | "music" | "dance" | "grant" | "international";
const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" }, { key: "actor", label: "배우" }, { key: "music", label: "음악" },
  { key: "dance", label: "무용" }, { key: "grant", label: "지원사업" }, { key: "international", label: "해외" },
];
const quickCategories: { key: FilterKey; title: string; description: string; mark: string }[] = [
  { key: "actor", title: "배우 오디션", description: "연극 · 영화 · 뮤지컬", mark: "ACT" },
  { key: "music", title: "음악 모집", description: "보컬 · 세션 · 밴드", mark: "MUS" },
  { key: "dance", title: "무용 프로젝트", description: "무용수 · 안무 · 워크숍", mark: "DAN" },
  { key: "grant", title: "지원사업", description: "창작지원 · 레지던시", mark: "SUP" },
];
const collaborationPosts: CollaborationPost[] = [];

function matchesFilter(item: Opportunity, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "grant") return item.category === "grant" || item.category === "residency";
  if (filter === "dance") return item.artGenres?.includes("dance") ?? false;
  if (filter === "music") return item.artGenres?.includes("music") ?? false;
  if (filter === "actor") return item.artGenres?.includes("theatre_musical") ?? false;
  return item.category === filter;
}

export function getDeadlineState(deadline?: string, now = new Date()) {
  if (!deadline) return { label: "상시 모집", expired: false };
  const [year, month, day] = deadline.split("-").map(Number);
  const endDay = Date.UTC(year, month - 1, day);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((endDay - today) / 86400000);
  if (days < 0) return { label: "마감", expired: true };
  if (days === 0) return { label: "D-day", expired: false };
  return { label: `D-${days}`, expired: false };
}

export default function OpportunitiesClient({ initialOpportunities }: { initialOpportunities: Opportunity[]; locale?: "ko" | "en" }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    analytics.opportunitiesPageView();
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const visible = useMemo(() => initialOpportunities.filter((item) => { const deadline=getDeadlineState(item.deadline); return matchesFilter(item, filter) && (!search || `${item.title} ${item.organization}`.toLocaleLowerCase("ko-KR").includes(search.toLocaleLowerCase("ko-KR"))) && (region==="all" || item.location===region) && (statusFilter==="all" || (statusFilter==="open"&&!deadline.expired) || (statusFilter==="closed"&&deadline.expired)); }), [filter, initialOpportunities, search, region, statusFilter]);
  const opportunityStats = { total: initialOpportunities.length, audition: initialOpportunities.filter((item) => item.category === "actor").length, collaboration: initialOpportunities.filter((item) => item.category === "collaboration").length, grant: initialOpportunities.filter((item) => item.category === "grant" || item.category === "residency").length };

  const selectFilter = (next: FilterKey) => {
    setFilter(next);
    analytics.opportunityFilterClick(next);
    document.getElementById("opportunity-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleSave = (id: string) => {
    analytics.opportunitySaveClick(id);
    if (!userId) {
      router.push(`/auth?redirect=${encodeURIComponent("/opportunities")}`);
      return;
    }
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openOpportunity = (item: Opportunity) => {
    analytics.opportunityCardClick(item.id);
    if (item.sourceUrl?.startsWith("/")) {
      router.push(item.sourceUrl);
    } else if (item.sourceUrl) {
      analytics.opportunityExternalLinkClick(item.id);
      window.open(item.sourceUrl, "_blank", "noopener,noreferrer");
    } else if (item.isInternal && item.authorId) {
      router.push(`/artists/${item.authorId}`);
    } else {
      setNotice("아직 연결된 원문 공고가 없습니다. 곧 업데이트할게요.");
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>POPOK OPPORTUNITIES</p>
            <h1>당신의 다음 무대를<br />오늘 발견하세요.</h1>
            <p className={styles.heroDescription}>배우 오디션, 음악 협업, 무용 프로젝트, 지원사업까지.<br />공연예술인에게 필요한 기회를 한곳에서 만나보세요.</p>
            <div className={styles.heroActions}>
              <a href="#opportunity-list" className={styles.primaryButton}>오늘의 공고 보기</a>
              <button type="button" className={styles.secondaryButton} disabled title="공고 등록 기능은 준비 중입니다.">공고 등록하기 · 준비 중</button>
            </div>
          </div>
          <div className={styles.statCard} aria-label="오늘 새로 올라온 기회 통계, mock 데이터">
            <span>오늘 새로 올라온 기회</span><strong>{opportunityStats.total}</strong>
            <p>오디션 {opportunityStats.audition} · 협업 {opportunityStats.collaboration} · 지원사업 {opportunityStats.grant}</p>
            <small>현재 예시 데이터로 제공됩니다.</small>
          </div>
        </div>
      </section>

      <div className={styles.content}>
        <section aria-labelledby="quick-title" className={styles.section}>
          <div className={styles.sectionHeading}><div><p>QUICK FIND</p><h2 id="quick-title">분야별로 빠르게 찾기</h2></div></div>
          <div className={styles.quickGrid}>
            {quickCategories.map((item) => (
              <button key={item.key} type="button" onClick={() => selectFilter(item.key)} className={styles.quickCard} aria-label={`${item.title} 필터 적용`}>
                <span className={styles.quickMark}>{item.mark}</span><span><strong>{item.title}</strong><small>{item.description}</small></span><b aria-hidden="true">→</b>
              </button>
            ))}
          </div>
        </section>

        <section id="opportunity-list" aria-labelledby="list-title" className={styles.section}>
          <div className={styles.sectionHeading}><div><p>OPEN CALLS</p><h2 id="list-title">지금 열려 있는 기회</h2></div><span>{visible.length}개의 공고</span></div>
          <div className={styles.filters} role="group" aria-label="기회 카테고리 필터">
            {filters.map((item) => <button key={item.key} type="button" onClick={() => selectFilter(item.key)} className={filter === item.key ? styles.activeFilter : ""} aria-pressed={filter === item.key}>{item.label}</button>)}
          </div>
          <div className={styles.filters} aria-label="기회 검색 및 추가 필터"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="제목·기관 검색" aria-label="제목 또는 기관 검색" /><select value={region} onChange={(e)=>setRegion(e.target.value)} aria-label="지역 필터"><option value="all">전체 지역</option>{[...new Set(initialOpportunities.map((item)=>item.location).filter(Boolean))].map((value)=><option key={value} value={value}>{value}</option>)}</select><select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} aria-label="상태 필터"><option value="all">전체 상태</option><option value="open">접수 중·예정</option><option value="closed">마감</option></select></div>
          {visible.length ? <div className={styles.cardGrid}>
            {visible.map((item) => {
              const deadline = getDeadlineState(item.deadline);
              return <article key={item.id} className={styles.opportunityCard}>
                <div className={styles.cardTop}><span className={styles.typeBadge}>{item.typeLabel}</span><button type="button" className={styles.saveButton} onClick={() => toggleSave(item.id)} aria-label={`${item.title} ${saved.has(item.id) ? "저장 취소" : "저장"}`} aria-pressed={saved.has(item.id)}>{saved.has(item.id) ? "★ 저장됨" : "☆ 저장"}</button></div>
                <h3>{item.title}</h3><p className={styles.organization}>{item.organization}</p>{item.summary && <p className={styles.summary}>{item.summary}</p>}
                <dl className={styles.meta}><div><dt>지역</dt><dd>{item.location ?? "협의"}</dd></div><div><dt>보수·지원</dt><dd>{item.compensation ?? "협의"}</dd></div><div><dt>활동 기간</dt><dd>{item.schedule ?? "별도 안내"}</dd></div><div><dt>마감</dt><dd><span className={deadline.expired ? styles.expired : styles.deadline}>{deadline.label}</span>{item.deadline && ` · ${item.deadline.replaceAll("-", ".")}`}</dd></div></dl>
                <button type="button" className={styles.detailButton} onClick={() => openOpportunity(item)}>{item.sourceUrl ? "원문 공고 보기 ↗" : deadline.expired ? "마감 공고 확인" : "상세보기"}</button>
              </article>;
            })}
          </div> : <div className={styles.empty}><strong>조건에 맞는 기회가 아직 없습니다.</strong><p>다른 카테고리를 확인해 보세요.</p></div>}
        </section>

        {collaborationPosts.length > 0 && <section aria-labelledby="collab-title" className={styles.section}>
          <div className={styles.sectionHeading}><div><p>COLLABORATION</p><h2 id="collab-title">협업 피드</h2></div><span>POPOK 아티스트의 제안</span></div>
          <div className={styles.collaborationList}>{collaborationPosts.map((post) => <article key={post.id} className={styles.collaborationCard}>
            <div className={styles.avatar} aria-hidden="true">{post.authorName.slice(0, 1)}</div><div className={styles.collaborationBody}><div><strong>{post.authorName}</strong><span>{post.role} · {post.createdLabel}</span></div><p>{post.content}</p></div>
            <Link href={`/artists/${post.authorId}`} onClick={() => analytics.opportunityCollaborationConnectClick(post.id)} className={styles.connectButton} aria-label={`${post.authorName} 프로필에서 연결하기`}>프로필에서 연결하기</Link>
          </article>)}</div>
        </section>}

        <aside className={styles.interview} aria-labelledby="interview-title"><div><p>THIS WEEK&apos;S POKTERVIEW</p><h2 id="interview-title">배우 서윤이 말하는<br />‘오래 연기하는 법’</h2><span>배우 · 인터뷰</span></div><div className={styles.interviewArt} aria-hidden="true"><b>POK<br />TER<br />VIEW</b></div></aside>
      </div>
      <div className={styles.toast} aria-live="polite" aria-atomic="true">{notice}</div>
    </main>
  );
}
