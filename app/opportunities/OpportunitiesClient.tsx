"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { analytics } from "@/lib/analytics";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { getArtGenreLabel } from "@/lib/opportunities/labels";
import { normalizeRegion, recommendationScore } from "@/lib/opportunities/recommendation";
import type { CollaborationPost, Opportunity, OpportunityViewerProfile } from "@/lib/opportunities/types";
import styles from "./opportunities.module.css";

type Locale = "ko" | "en";
type FilterKey = "all" | "actor" | "music" | "dance" | "grant" | "international";
type StatusKey = "all" | "open" | "closed";
type QuickKey = "all" | "closing" | "new" | "my-region" | "recommended";
type GenreKey = "all" | "dance" | "music" | "theatre_musical" | "traditional" | "interdisciplinary" | "other";
type TypeKey = "all" | "grant" | "open_call" | "audition" | "residency" | "education" | "job" | "other";
type SortKey = "newest" | "deadline" | "deadline-late" | "recommended";
const PAGE_SIZE = 18;

const GENRE_FILTERS: GenreKey[] = ["all", "dance", "music", "theatre_musical", "traditional", "interdisciplinary", "other"];
const TYPE_FILTERS: TypeKey[] = ["all", "grant", "open_call", "audition", "residency", "education", "job", "other"];
const REGION_FILTERS = ["all", "seoul", "capital", "chungcheong", "jeolla", "gyeongsang", "gangwon", "jeju", "nationwide", "overseas"] as const;
const genreCopy: Record<GenreKey, Record<Locale, string>> = {
  all:{ko:"전체",en:"All"}, dance:{ko:"무용",en:"Dance"}, music:{ko:"음악",en:"Music"}, theatre_musical:{ko:"연극·뮤지컬",en:"Theatre & Musical"}, traditional:{ko:"전통예술",en:"Traditional Arts"}, interdisciplinary:{ko:"다원예술",en:"Interdisciplinary"}, other:{ko:"기타",en:"Other"},
};
const typeCopy: Record<TypeKey, Record<Locale, string>> = {
  all:{ko:"전체",en:"All"}, grant:{ko:"지원사업",en:"Grants"}, open_call:{ko:"공모·창작지원",en:"Open Calls"}, audition:{ko:"오디션",en:"Auditions"}, residency:{ko:"레지던시",en:"Residencies"}, education:{ko:"교육·워크숍",en:"Education & Workshops"}, job:{ko:"채용·협업",en:"Jobs & Collaboration"}, other:{ko:"기타",en:"Other"},
};
const regionCopy: Record<(typeof REGION_FILTERS)[number], Record<Locale, string>> = {
  all:{ko:"전체",en:"All"}, seoul:{ko:"서울",en:"Seoul"}, capital:{ko:"경기·인천",en:"Gyeonggi & Incheon"}, chungcheong:{ko:"충청",en:"Chungcheong"}, jeolla:{ko:"전라",en:"Jeolla"}, gyeongsang:{ko:"경상",en:"Gyeongsang"}, gangwon:{ko:"강원",en:"Gangwon"}, jeju:{ko:"제주",en:"Jeju"}, nationwide:{ko:"전국",en:"Nationwide"}, overseas:{ko:"해외",en:"Overseas"},
};

const FILTERS: { key: FilterKey; label: Record<Locale, string> }[] = [
  { key: "all", label: { ko: "전체", en: "All" } },
  { key: "actor", label: { ko: "배우", en: "Actor" } },
  { key: "music", label: { ko: "음악", en: "Music" } },
  { key: "dance", label: { ko: "무용", en: "Dance" } },
  { key: "grant", label: { ko: "지원사업", en: "Grants" } },
  { key: "international", label: { ko: "해외", en: "International" } },
];
const QUICK_CATEGORIES: { key: FilterKey; title: Record<Locale, string>; description: Record<Locale, string>; mark: string }[] = [
  { key: "actor", title: { ko: "배우 오디션", en: "Actor auditions" }, description: { ko: "연극 · 영화 · 뮤지컬", en: "Theatre · Film · Musical" }, mark: "ACT" },
  { key: "music", title: { ko: "음악 모집", en: "Music calls" }, description: { ko: "보컬 · 세션 · 밴드", en: "Vocal · Session · Band" }, mark: "MUS" },
  { key: "dance", title: { ko: "무용 프로젝트", en: "Dance projects" }, description: { ko: "무용수 · 안무 · 워크숍", en: "Dancer · Choreography · Workshop" }, mark: "DAN" },
  { key: "grant", title: { ko: "지원사업", en: "Grants" }, description: { ko: "창작지원 · 레지던시", en: "Creation support · Residency" }, mark: "SUP" },
];
const collaborationPosts: CollaborationPost[] = [];

const copy: Record<Locale, {
  eyebrow: string; heroTitle: [string, string]; heroDescription: [string, string];
  viewToday: string; registerSoon: string; statLabel: string; statBreakdown: (a: number, c: number, g: number) => string;
  quickKicker: string; quickTitle: string;
  listKicker: string; listTitle: string; countSuffix: (n: number) => string;
  searchPlaceholder: string; moreFilters: string; closeFilters: string;
  regionAll: string; regionLabel: string; audienceAll: string; audienceLabel: string; statusLabel: string;
  statusAll: string; statusOpen: string; statusClosed: string; applyFilters: string; resetFilters: string;
  regionMeta: string; periodMeta: string; deadlineMeta: string;
  permanent: string; dday: string; closed: string; deadlineFrom: (s: string) => string; announcedLater: string;
  save: string; saved: string; detail: string; viewSource: string; viewClosed: string;
  emptyTitle: string; emptyBody: string; emptyReset: string;
  collabKicker: string; collabTitle: string; collabSub: string; connect: (name: string) => string;
  noticeNoSource: string; closingSoonBadge: string;
}> = {
  ko: {
    eyebrow: "POPOK OPPORTUNITIES",
    heroTitle: ["당신의 다음 무대를", "오늘 발견하세요."],
    heroDescription: ["배우 오디션, 음악 협업, 무용 프로젝트, 지원사업까지.", "공연예술인에게 필요한 기회를 한곳에서 만나보세요."],
    viewToday: "오늘의 공고 보기", registerSoon: "공고 등록하기 · 준비 중",
    statLabel: "지금 열려 있는 기회", statBreakdown: (a, c, g) => `마감 임박 ${a} · 오디션 ${c} · 지원사업 ${g}`,
    quickKicker: "QUICK FIND", quickTitle: "분야별로 빠르게 찾기",
    listKicker: "OPEN CALLS", listTitle: "지금 열려 있는 기회", countSuffix: (n) => `${n}개의 공고`,
    searchPlaceholder: "공고 제목, 기관명으로 검색",
    moreFilters: "지역·대상·상태", closeFilters: "필터 닫기",
    regionAll: "전체 지역", regionLabel: "지역", audienceAll: "전체 대상", audienceLabel: "대상", statusLabel: "상태",
    statusAll: "전체 상태", statusOpen: "접수 중·예정", statusClosed: "마감",
    applyFilters: "결과 보기", resetFilters: "초기화",
    regionMeta: "지역", periodMeta: "접수 기간", deadlineMeta: "마감",
    permanent: "상시 모집", dday: "D-day", closed: "마감", deadlineFrom: (s) => `${s}부터`, announcedLater: "별도 안내",
    save: "저장", saved: "저장됨", detail: "상세보기", viewSource: "원문 공고 보기 ↗", viewClosed: "마감 공고 확인",
    emptyTitle: "조건에 맞는 기회가 아직 없습니다.", emptyBody: "다른 카테고리나 필터를 확인해 보세요.", emptyReset: "필터 초기화",
    collabKicker: "COLLABORATION", collabTitle: "협업 피드", collabSub: "POPOK 아티스트의 제안",
    connect: (name) => `${name} 프로필에서 연결하기`,
    noticeNoSource: "아직 연결된 원문 공고가 없습니다. 곧 업데이트할게요.", closingSoonBadge: "마감임박",
  },
  en: {
    eyebrow: "POPOK OPPORTUNITIES",
    heroTitle: ["Find your next stage,", "today."],
    heroDescription: ["Auditions, music collaborations, dance projects, and grants —", "everything a performing artist needs, in one place."],
    viewToday: "See today's postings", registerSoon: "Submit a posting · Coming soon",
    statLabel: "Open opportunities right now", statBreakdown: (a, c, g) => `${a} closing soon · ${c} auditions · ${g} grants`,
    quickKicker: "QUICK FIND", quickTitle: "Browse by category",
    listKicker: "OPEN CALLS", listTitle: "Open opportunities", countSuffix: (n) => `${n} postings`,
    searchPlaceholder: "Search by title or organization",
    moreFilters: "Region · Audience · Status", closeFilters: "Close filters",
    regionAll: "All regions", regionLabel: "Region", audienceAll: "All audiences", audienceLabel: "Audience", statusLabel: "Status",
    statusAll: "All statuses", statusOpen: "Open · Upcoming", statusClosed: "Closed",
    applyFilters: "Show results", resetFilters: "Reset",
    regionMeta: "Region", periodMeta: "Application period", deadlineMeta: "Deadline",
    permanent: "Ongoing", dday: "D-day", closed: "Closed", deadlineFrom: (s) => `From ${s}`, announcedLater: "To be announced",
    save: "Save", saved: "Saved", detail: "View details", viewSource: "View original posting ↗", viewClosed: "View closed posting",
    emptyTitle: "No opportunities match these filters yet.", emptyBody: "Try a different category or filter.", emptyReset: "Reset filters",
    collabKicker: "COLLABORATION", collabTitle: "Collaboration feed", collabSub: "Proposals from POPOK artists",
    connect: (name) => `Connect on ${name}'s profile`,
    noticeNoSource: "This posting isn't linked to a source yet. Check back soon.", closingSoonBadge: "Closing soon",
  },
};

function matchesFilter(item: Opportunity, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "grant") return item.category === "grant" || item.category === "residency";
  if (filter === "dance") return item.artGenres?.includes("dance") ?? false;
  if (filter === "music") return item.artGenres?.includes("music") ?? false;
  if (filter === "actor") return item.artGenres?.includes("theatre_musical") ?? false;
  return item.category === filter;
}

export function getDeadlineState(deadline: string | undefined, locale: Locale, now = new Date()) {
  const t = copy[locale];
  if (!deadline) return { label: t.permanent, expired: false };
  const [year, month, day] = deadline.split("-").map(Number);
  const endDay = Date.UTC(year, month - 1, day);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((endDay - today) / 86400000);
  if (days < 0) return { label: t.closed, expired: true };
  if (days === 0) return { label: t.dday, expired: false };
  return { label: `D-${days}`, expired: false };
}

export default function OpportunitiesClient({ locale, initialOpportunities, initialUserId, viewerProfile }: { locale: Locale; initialOpportunities: Opportunity[]; initialUserId: string | null; viewerProfile: OpportunityViewerProfile | null }) {
  const t = copy[locale];
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<(typeof REGION_FILTERS)[number]>("all");
  const [audience, setAudience] = useState("all");
  const [status, setStatus] = useState<StatusKey>("all");
  const [panelOpen, setPanelOpen] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(initialUserId);
  const [notice, setNotice] = useState("");
  const [quick, setQuick] = useState<QuickKey>("all");
  const [genre, setGenre] = useState<GenreKey>("all");
  const [opportunityType, setOpportunityType] = useState<TypeKey>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    analytics.opportunitiesPageView();
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const audienceOptions = useMemo(() => Array.from(new Set(initialOpportunities.flatMap((i) => i.targetAudience || []))).sort(), [initialOpportunities]);
  const closingSoonCount = useMemo(() => initialOpportunities.filter((i) => i.isClosingSoon).length, [initialOpportunities]);
  const auditionCount = useMemo(() => initialOpportunities.filter((i) => i.category === "actor").length, [initialOpportunities]);
  const grantCount = useMemo(() => initialOpportunities.filter((i) => i.category === "grant" || i.category === "residency").length, [initialOpportunities]);

  const scored = useMemo(() => initialOpportunities.map((item) => ({ item, score: recommendationScore(item, viewerProfile) })), [initialOpportunities, viewerProfile]);
  const visible = useMemo(() => scored.filter(({ item, score }) => {
    const deadline = getDeadlineState(item.deadline, locale);
    if (!matchesFilter(item, filter)) return false;
    if (region !== "all" && normalizeRegion(item.location) !== region) return false;
    if (genre !== "all") {
      const genres = item.artGenres || [];
      if (genre === "other" ? genres.some((value) => ["dance","music","theatre_musical","traditional","interdisciplinary"].includes(value)) : !genres.includes(genre)) return false;
    }
    if (opportunityType !== "all" && (opportunityType === "other" ? ["grant","open_call","audition","residency","education","job"].includes(item.opportunityType || "") : item.opportunityType !== opportunityType)) return false;
    if (audience !== "all" && !(item.targetAudience || []).includes(audience)) return false;
    if (status === "open" && deadline.expired) return false;
    if (status === "closed" && !deadline.expired) return false;
    const daysOld = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 86400000);
    if (quick === "closing" && (!item.isClosingSoon || deadline.expired)) return false;
    if (quick === "new" && (daysOld < 0 || daysOld > 7)) return false;
    if (quick === "my-region" && (!viewerProfile?.region || normalizeRegion(item.location) !== normalizeRegion(viewerProfile.region))) return false;
    if (quick === "recommended" && (score === null || score <= 0)) return false;
    if (search && !`${item.title} ${item.organization} ${item.description || ""} ${item.summary || ""} ${item.opportunityType || ""} ${(item.artGenres || []).join(" ")}`.toLocaleLowerCase("ko-KR").includes(search.toLocaleLowerCase("ko-KR"))) return false;
    return true;
  }).sort((a, b) => {
    if (sort === "recommended") return (b.score ?? -1) - (a.score ?? -1);
    if (sort === "deadline" || sort === "deadline-late") {
      const aTime = a.item.deadline ? new Date(a.item.deadline).getTime() : (sort === "deadline" ? Infinity : -Infinity);
      const bTime = b.item.deadline ? new Date(b.item.deadline).getTime() : (sort === "deadline" ? Infinity : -Infinity);
      return sort === "deadline" ? aTime - bTime : bTime - aTime;
    }
    return new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime();
  }), [scored, filter, region, genre, opportunityType, audience, status, search, locale, quick, sort, viewerProfile]);

  useEffect(() => setVisibleCount(PAGE_SIZE), [filter, region, genre, opportunityType, audience, status, search, quick, sort]);

  const activeFilterCount = (region !== "all" ? 1 : 0) + (genre !== "all" ? 1 : 0) + (opportunityType !== "all" ? 1 : 0) + (audience !== "all" ? 1 : 0) + (status !== "all" ? 1 : 0);

  const selectFilter = (next: FilterKey) => {
    setFilter(next);
    analytics.opportunityFilterClick(next);
    document.getElementById("opportunity-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetFilters = () => { setRegion("all"); setGenre("all"); setOpportunityType("all"); setAudience("all"); setStatus("all"); setQuick("all"); setSort("newest"); setSearch(""); };

  const requireRecommendation = (mode: "quick" | "sort") => {
    if (!userId) { router.push(`/auth?redirect=${encodeURIComponent(locale === "en" ? "/en/opportunities" : "/opportunities")}`); return; }
    if (!viewerProfile) { setNotice(locale === "ko" ? "프로필을 완성하면 맞춤 기회를 추천해드려요." : "Complete your profile to get tailored recommendations."); return; }
    if (mode === "quick") setQuick("recommended"); else setSort("recommended");
    document.getElementById("opportunity-list")?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleSave = (id: string) => {
    analytics.opportunitySaveClick(id);
    if (!userId) {
      router.push(`/auth?redirect=${encodeURIComponent(locale === "en" ? "/en/opportunities" : "/opportunities")}`);
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
      setNotice(t.noticeNoSource);
    }
  };

  return (
    <main className={styles.page} lang={locale}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrowBadge}>
              <span className={styles.eyebrowDot} />
              <span className={styles.eyebrowText}>{t.eyebrow}</span>
            </div>
            <h1 className="display">
              {locale === "ko" ? (
                <>
                  당신의 다음 무대를<br />
                  <span className="seen-highlight">오늘 발견하세요.</span>
                </>
              ) : (
                <>
                  Find your next stage,<br />
                  <span className="seen-highlight">today.</span>
                </>
              )}
            </h1>
            <p className={styles.heroDescription}>
              {t.heroDescription[0]}<br />{t.heroDescription[1]}
            </p>
            <div className={styles.heroActions}>
              <a href="#opportunity-list" className={styles.primaryButton}>{t.viewToday} →</a>
              <button type="button" className={styles.secondaryButton} disabled title={t.registerSoon}>{t.registerSoon}</button>
            </div>
          </div>
          <div className={styles.statCard}>
            <span>{t.statLabel}</span><strong>{initialOpportunities.length}</strong>
            <p>{t.statBreakdown(closingSoonCount, auditionCount, grantCount)}</p>
          </div>
        </div>
      </section>

      <div className={styles.content}>
        <section className={styles.aiBanner} aria-labelledby="ai-recommend-title">
          <div className={styles.aiIcon} aria-hidden="true">✦</div>
          <div><p>{locale === "ko" ? "PROFILE MATCH" : "PROFILE MATCH"}</p><h2 id="ai-recommend-title">{locale === "ko" ? "AI로 나에게 맞는 기회 찾기" : "Find opportunities that fit you"}</h2><span>{locale === "ko" ? "내 POPOK 프로필을 바탕으로 지원할 만한 공고를 추천해드려요." : "Get rule-based recommendations based on your POPOK profile."}</span></div>
          <button type="button" onClick={() => requireRecommendation("quick")}>{locale === "ko" ? "맞춤 기회 보기" : "See my matches"} →</button>
        </section>

        <nav className={styles.quickChips} aria-label={locale === "ko" ? "빠른 탐색" : "Quick filters"}>
          {(["all","closing","new","my-region"] as QuickKey[]).map((key) => {
            const labels: Record<QuickKey, Record<Locale,string>> = { all:{ko:"전체",en:"All"}, closing:{ko:"🔥 마감 임박",en:"🔥 Closing soon"}, new:{ko:"✨ 신규",en:"✨ New"}, "my-region":{ko:"📍 내 지역",en:"📍 My region"}, recommended:{ko:"추천",en:"Recommended"} };
            return <button key={key} type="button" aria-pressed={quick === key} className={quick === key ? styles.activeChip : ""} onClick={() => {
              if (key === "my-region" && !userId) return router.push(`/auth?redirect=${encodeURIComponent(locale === "en" ? "/en/opportunities" : "/opportunities")}`);
              if (key === "my-region" && !viewerProfile?.region) { setPanelOpen(true); setNotice(locale === "ko" ? "프로필 지역이 없어 전체 지역 필터를 열었어요." : "Your profile has no region, so region filters are open."); return; }
              setQuick(key);
            }}>{labels[key][locale]}</button>;
          })}
        </nav>

        <section aria-labelledby="quick-title" className={styles.section}>
          <div className={styles.sectionHeading}><div><p>{t.quickKicker}</p><h2 id="quick-title">{t.quickTitle}</h2></div></div>
          <div className={styles.quickGrid}>
            {QUICK_CATEGORIES.map((item) => (
              <button key={item.key} type="button" onClick={() => selectFilter(item.key)} className={styles.quickCard} aria-label={item.title[locale]}>
                <span className={styles.quickMark}>{item.mark}</span><span><strong>{item.title[locale]}</strong><small>{item.description[locale]}</small></span><b aria-hidden="true">→</b>
              </button>
            ))}
          </div>
        </section>

        <section id="opportunity-list" aria-labelledby="list-title" className={styles.section}>
          <div className={styles.sectionHeading}><div><p>{t.listKicker}</p><h2 id="list-title">{t.listTitle}</h2></div><span>{t.countSuffix(visible.length)}</span></div>

          <div className={styles.toolbar}>
            <label className={styles.searchBox}>
              <span className="sr-only">{t.searchPlaceholder}</span>
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.searchPlaceholder} />
            </label>
            <button type="button" className={styles.moreFiltersButton} onClick={() => setPanelOpen((v) => !v)} aria-expanded={panelOpen} aria-controls="opportunity-filter-panel">
              {t.moreFilters}{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
            </button>
            <label className={styles.sortBox}><span className="sr-only">{locale === "ko" ? "정렬" : "Sort"}</span><select value={sort} onChange={(event) => event.target.value === "recommended" ? requireRecommendation("sort") : setSort(event.target.value as SortKey)}><option value="newest">{locale === "ko" ? "최신 등록순" : "Newest"}</option><option value="deadline">{locale === "ko" ? "마감 임박순" : "Deadline soon"}</option><option value="deadline-late">{locale === "ko" ? "마감일 늦은순" : "Latest deadline"}</option><option value="recommended">{locale === "ko" ? "추천순" : "Recommended"}</option></select></label>
          </div>

          <div className={styles.filterRows}>
            <div><strong>{locale === "ko" ? "분야" : "Genre"}</strong><div className={styles.filters} role="group" aria-label={locale === "ko" ? "분야" : "Genre"}>{GENRE_FILTERS.map((key) => <button key={key} type="button" onClick={() => setGenre(key)} className={genre === key ? styles.activeFilter : ""} aria-pressed={genre === key}>{genreCopy[key][locale]}</button>)}</div></div>
            <div><strong>{locale === "ko" ? "공고 유형" : "Type"}</strong><div className={styles.filters} role="group" aria-label={locale === "ko" ? "공고 유형" : "Type"}>{TYPE_FILTERS.map((key) => <button key={key} type="button" onClick={() => setOpportunityType(key)} className={opportunityType === key ? styles.activeFilter : ""} aria-pressed={opportunityType === key}>{typeCopy[key][locale]}</button>)}</div></div>
          </div>

          <div id="opportunity-filter-panel" className={`${styles.secondaryFilters} ${panelOpen ? styles.panelOpen : ""}`}>
            <div className={styles.filterPanelHeader}><h2>{t.moreFilters}</h2><button type="button" onClick={() => setPanelOpen(false)} aria-label={t.closeFilters}>✕</button></div>
            <label>{t.regionLabel}
              <select value={region} onChange={(e) => setRegion(e.target.value as (typeof REGION_FILTERS)[number])}>
                <option value="all">{t.regionAll}</option>
                {REGION_FILTERS.filter((r) => r !== "all").map((r) => <option key={r} value={r}>{regionCopy[r][locale]}</option>)}
              </select>
            </label>
            <label>{t.audienceLabel}
              <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value="all">{t.audienceAll}</option>
                {audienceOptions.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <label>{t.statusLabel}
              <select value={status} onChange={(e) => setStatus(e.target.value as StatusKey)}>
                <option value="all">{t.statusAll}</option>
                <option value="open">{t.statusOpen}</option>
                <option value="closed">{t.statusClosed}</option>
              </select>
            </label>
            <div className={styles.filterPanelFooter}>
              <button type="button" className={styles.secondaryButton} onClick={resetFilters}>{t.resetFilters}</button>
              <button type="button" className={styles.primaryButton} onClick={() => setPanelOpen(false)}>{t.applyFilters}</button>
            </div>
          </div>
          {panelOpen && <div className={styles.panelOverlay} onClick={() => setPanelOpen(false)} aria-hidden="true" />}

          {visible.length ? <><div className={styles.cardGrid}>
            {visible.slice(0, visibleCount).map(({ item, score }) => {
              const deadline = getDeadlineState(item.deadline, locale);
              const genres = (item.artGenres || []).filter((g) => g !== "all");
              const period = item.applicationStartAt && item.deadline ? `${item.applicationStartAt.replaceAll("-", ".")} – ${item.deadline.replaceAll("-", ".")}` : item.deadline ? t.deadlineFrom(item.deadline.replaceAll("-", ".")) : t.announcedLater;
              return <article key={item.id} className={styles.opportunityCard}>
                <div className={styles.cardTop}>
                  <span className={styles.typeBadge}>{item.typeLabel}</span>
                  {quick === "recommended" && score !== null && <span className={styles.matchBadge}>{locale === "ko" ? "추천" : "Recommended"}</span>}
                  {item.isClosingSoon && !deadline.expired && <span className={styles.urgentBadge}>{t.closingSoonBadge}</span>}
                  <button type="button" className={styles.saveButton} onClick={() => toggleSave(item.id)} aria-label={`${item.title} ${saved.has(item.id) ? t.saved : t.save}`} aria-pressed={saved.has(item.id)}>{saved.has(item.id) ? `★ ${t.saved}` : `☆ ${t.save}`}</button>
                </div>
                <h3>{item.title}</h3>
                <p className={styles.organization}>{item.organization}</p>
                {item.summary && <p className={styles.summary}>{item.summary}</p>}
                {genres.length > 0 && <div className={styles.genreTags}>{genres.slice(0, 3).map((g) => <span key={g}>{getArtGenreLabel(g, locale)}</span>)}</div>}
                <dl className={styles.meta}>
                  <div><dt>{t.regionMeta}</dt><dd>{item.location ?? "—"}</dd></div>
                  <div><dt>{t.periodMeta}</dt><dd>{period}</dd></div>
                  <div><dt>{t.deadlineMeta}</dt><dd><span className={deadline.expired ? styles.expired : styles.deadline}>{deadline.label}</span></dd></div>
                </dl>
                <button type="button" className={styles.detailButton} onClick={() => openOpportunity(item)}>{item.sourceUrl?.startsWith("/") ? t.detail : item.sourceUrl ? t.viewSource : deadline.expired ? t.viewClosed : t.detail}</button>
              </article>;
            })}
          </div>{visibleCount < visible.length && <button type="button" className={styles.loadMore} onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>{locale === "ko" ? `더보기 (${Math.min(PAGE_SIZE, visible.length - visibleCount)}개)` : `Load more (${Math.min(PAGE_SIZE, visible.length - visibleCount)})`}</button>}</> : <div className={styles.empty}>
            <strong>{t.emptyTitle}</strong><p>{t.emptyBody}</p>
            {(filter !== "all" || activeFilterCount > 0 || search) && <button type="button" onClick={() => { setFilter("all"); resetFilters(); }} className={styles.emptyResetButton}>{t.emptyReset}</button>}
          </div>}
        </section>

        {collaborationPosts.length > 0 && <section aria-labelledby="collab-title" className={styles.section}>
          <div className={styles.sectionHeading}><div><p>{t.collabKicker}</p><h2 id="collab-title">{t.collabTitle}</h2></div><span>{t.collabSub}</span></div>
          <div className={styles.collaborationList}>{collaborationPosts.map((post) => <article key={post.id} className={styles.collaborationCard}>
            <div className={styles.avatar} aria-hidden="true">{post.authorName.slice(0, 1)}</div><div className={styles.collaborationBody}><div><strong>{post.authorName}</strong><span>{post.role} · {post.createdLabel}</span></div><p>{post.content}</p></div>
            <Link href={`/artists/${post.authorId}`} onClick={() => analytics.opportunityCollaborationConnectClick(post.id)} className={styles.connectButton} aria-label={t.connect(post.authorName)}>{t.connect(post.authorName)}</Link>
          </article>)}</div>
        </section>}
      </div>

      <div className={styles.toast} aria-live="polite" aria-atomic="true">{notice}</div>
    </main>
  );
}
