import Link from "next/link";
import type { Performance } from "@/types";
import { getPerformanceExternalLink } from "@/lib/performanceLinks";
import { hasValidPoster, normalizePerformanceGenre, type PerformanceGenre, type PerformanceQuick, type PerformanceRegion, type PerformanceSort } from "@/lib/performanceDiscovery";
import MagazineImage from "./MagazineImage";
import MonthlyCalendar from "./MonthlyCalendar";
import styles from "./performanceMagazine.module.css";

type Locale = "ko" | "en";
export type DiscoveryQuery = { genre: PerformanceGenre; region: PerformanceRegion; quick: PerformanceQuick; sort: PerformanceSort; q: string; view: "list" | "calendar"; month: string; page: number };

const GENRES: PerformanceGenre[] = ["all", "music", "dance", "theater", "musical", "traditional"];
const REGIONS: PerformanceRegion[] = ["all", "seoul", "capital", "gangwon", "chungcheong", "jeolla", "gyeongsang", "jeju", "nationwide"];
const genreLabel = { all:{ko:"전체",en:"All"},music:{ko:"음악",en:"Music"},dance:{ko:"무용",en:"Dance"},theater:{ko:"연극",en:"Theatre"},musical:{ko:"뮤지컬",en:"Musical"},traditional:{ko:"국악",en:"Korean Traditional"},unclassified:{ko:"미분류",en:"Unclassified"} } as const;
const regionLabel = {all:{ko:"전체 지역",en:"All regions"},seoul:{ko:"서울",en:"Seoul"},capital:{ko:"경기·인천",en:"Gyeonggi & Incheon"},gangwon:{ko:"강원",en:"Gangwon"},chungcheong:{ko:"충청",en:"Chungcheong"},jeolla:{ko:"전라",en:"Jeolla"},gyeongsang:{ko:"경상",en:"Gyeongsang"},jeju:{ko:"제주",en:"Jeju"},nationwide:{ko:"전국·온라인",en:"Nationwide · Online"}} as const;

function href(locale: Locale, query: DiscoveryQuery, change: Partial<Record<keyof DiscoveryQuery, string | number>>) {
  const next = { ...query, ...change }; const params = new URLSearchParams();
  Object.entries(next).forEach(([key, value]) => { if (value && value !== "all" && !(key === "page" && value === 1) && !(key === "view" && value === "list")) params.set(key, String(value)); });
  return `${locale === "en" ? "/en/performances" : "/performances"}${params.size ? `?${params}` : ""}`;
}

export function PerformanceNavigation({ locale, query, counts }: { locale: Locale; query: DiscoveryQuery; counts: Record<PerformanceGenre, number> }) {
  return <div className={styles.discoveryNav}>
    <nav className={styles.genreTabs} aria-label={locale === "ko" ? "공연 장르" : "Performance genre"}>{GENRES.map((genre) => <Link key={genre} href={href(locale, query, { genre, page: 1 })} className={query.genre === genre ? styles.genreTabActive : styles.genreTab} aria-current={query.genre === genre ? "page" : undefined}>{genreLabel[genre][locale]} <small>{counts[genre]}</small></Link>)}</nav>
    <form action={locale === "en" ? "/en/performances" : "/performances"} className={styles.performanceSearch}><label><span className="sr-only">{locale === "ko" ? "공연 검색" : "Search performances"}</span><input name="q" defaultValue={query.q} placeholder={locale === "ko" ? "공연명, 아티스트, 단체, 공연장을 검색해보세요" : "Search performances, artists, companies, and venues"} /></label>{(["genre","region","quick","sort","view","month"] as const).map((key) => query[key] && query[key] !== "all" && query[key] !== "list" ? <input key={key} type="hidden" name={key} value={String(query[key])} /> : null)}<button type="submit">{locale === "ko" ? "검색" : "Search"}</button></form>
  </div>;
}

function PerformanceListCard({ item, locale }: { item: Performance; locale: Locale }) {
  const external = getPerformanceExternalLink(item); const body = <><div className={styles.listPoster}><MagazineImage src={item.posterUrl!} alt={`${item.title} poster`} /></div><div className={styles.listCardBody}><span>{genreLabel[normalizePerformanceGenre(item)][locale]}</span><h3>{item.title}</h3><p>{[item.venue, item.organizer || item.companyName].filter(Boolean).join(" · ")}</p><time>{item.startDate}{item.endDate && item.endDate !== item.startDate ? ` — ${item.endDate}` : ""}</time></div></>;
  return external ? <a className={styles.listCard} href={external} target="_blank" rel="noopener noreferrer">{body}</a> : <article className={styles.listCard}>{body}</article>;
}

export default function PerformanceDiscovery({ locale, query, list, calendar, total, monthStart }: { locale: Locale; query: DiscoveryQuery; list: Performance[]; calendar: Performance[]; total: number; monthStart: string }) {
  const queryRecord = { genre: query.genre, region: query.region, quick: query.quick, sort: query.sort, q: query.q };
  return <section className={styles.discoverySection} aria-labelledby="performance-results-title">
    <div className={styles.discoveryToolbar}>
      <div><p>PERFORMANCE SCHEDULE</p><h2 id="performance-results-title">{locale === "ko" ? "공연 일정" : "Performance schedule"}</h2><span>{locale === "ko" ? `${total}개의 공연` : `${total} performances`}</span></div>
      <div className={styles.discoveryControls}><form><input type="hidden" name="genre" value={query.genre === "all" ? "" : query.genre} /><input type="hidden" name="q" value={query.q} />{query.quick !== "all" && <input type="hidden" name="quick" value={query.quick} />}{query.view !== "list" && <input type="hidden" name="view" value={query.view} />}{query.month && <input type="hidden" name="month" value={query.month} />}<select name="region" defaultValue={query.region} aria-label={locale === "ko" ? "지역 선택" : "Select region"}>{REGIONS.map((region) => <option key={region} value={region}>{regionLabel[region][locale]}</option>)}</select><select name="sort" defaultValue={query.sort} aria-label={locale === "ko" ? "정렬" : "Sort"}><option value="start-date">{locale === "ko" ? "곧 시작하는 순" : "Starting soon"}</option><option value="newest">{locale === "ko" ? "새로 등록된 순" : "Newest"}</option><option value="ending">{locale === "ko" ? "종료 임박순" : "Ending soon"}</option><option value="recommended">{locale === "ko" ? "추천순" : "Recommended"}</option></select><button type="submit">{locale === "ko" ? "적용" : "Apply"}</button></form></div>
    </div>
    <div className={styles.viewSwitch}><Link href={href(locale, query, { view:"list", page:1 })} aria-current={query.view === "list" ? "page" : undefined}>{locale === "ko" ? "목록 보기" : "List"}</Link><Link href={href(locale, query, { view:"calendar", page:1 })} aria-current={query.view === "calendar" ? "page" : undefined}>{locale === "ko" ? "월간 캘린더" : "Calendar"}</Link></div>
    {query.view === "calendar" ? <MonthlyCalendar locale={locale} monthStart={monthStart} performances={calendar} embedded query={queryRecord} /> : list.length ? <><div className={styles.performanceList}>{list.filter(hasValidPoster).map((item) => <PerformanceListCard key={item.id} item={item} locale={locale} />)}</div><nav className={styles.pagination} aria-label={locale === "ko" ? "페이지" : "Pagination"}>{query.page > 1 && <Link href={href(locale, query, { page:query.page - 1 })}>← {locale === "ko" ? "이전" : "Previous"}</Link>}{query.page * 24 < total && <Link href={href(locale, query, { page:query.page + 1 })}>{locale === "ko" ? "다음" : "Next"} →</Link>}</nav></> : <div className={styles.emptyState}>{locale === "ko" ? "조건에 맞는 포스터 공연이 없습니다. 캘린더에서 포스터 없는 공연도 확인할 수 있어요." : "No poster performances match. Calendar view also includes performances without posters."}</div>}
  </section>;
}
