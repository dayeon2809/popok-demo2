import Link from "next/link";
import ResponsiveImage from "@/components/ResponsiveImage";
import { getPerformanceExternalLink } from "@/lib/performanceLinks";
import { getCompanyDetailHref } from "@/lib/companyRoute";
import { buildPerformanceShelves, curateProfiles, selectMagazineCover } from "@/lib/calendarMagazine";
import { getSeoulToday, getWeeklyPerformanceRange, overlapsDateRange } from "@/lib/date";
import type { Artist, Company, Performance } from "@/types";
import type { InstagramStory } from "@/lib/instagram";
import ReviewSection, { type MagazineReview } from "./ReviewSection";
import styles from "./performanceMagazine.module.css";

type Locale = "ko" | "en";
type MagazineContentItem = {
  id: string; category: string; title: string; summary: string; thumbnailUrl: string;
  publishedAt: string; href?: string; instagramUrl?: string;
};

const copy = {
  ko: {
    kicker: "POPOK PERFORMANCE MAGAZINE", title: "지금, 공연예술계에서는", description: "새로운 공연과 아티스트, 공연예술계의 이야기를 만나보세요.",
    detail: "자세히 보기", weekly: "이번 주 공연", weeklySub: "오늘의 무대부터 곧 시작될 작업까지", all: "전체 공연 일정 보기",
    news: "POPOK 소식", newsSub: "공연예술계에서 포착한 새로운 장면", instagram: "Instagram에서 보기",
    people: "지금 주목받는 아티스트", peopleSub: "새로운 활동을 이어가는 아티스트와 단체", schedule: "전체 공연 일정", scheduleSub: "다가오는 공연을 주별로 확인하세요.",
    empty: "현재 등록된 예정 공연이 없습니다.", newsletter: "이번 주의 공연예술 소식을 받아보세요", newsletterDesc: "새로운 공연, 아티스트, 리뷰와 기회 정보를 한 번에 전해드려요.",
    email: "이메일 주소", subscribe: "구독하기 · 준비 중입니다", genres: ["무용", "음악", "연극·뮤지컬"],
    shelf: { today: "오늘 볼 수 있는 공연", opening: "이번 주 개막", closing: "곧 마감되는 공연", popok: "POPOK 아티스트·단체의 공연" },
    reason: { upcoming: "곧 공연을 앞두고 있어요", active: "최근 활동을 업데이트했어요", popular: "최근 많이 찾는 프로필", new: "새로 합류한 프로필" },
  },
  en: {
    kicker: "POPOK PERFORMANCE MAGAZINE", title: "Now in Performing Arts", description: "Discover new performances, artists, and stories from the performing arts scene.",
    detail: "View details", weekly: "Performances this week", weeklySub: "From today’s stage to works opening soon", all: "View the full performance calendar",
    news: "POPOK stories", newsSub: "New scenes and voices from performing arts", instagram: "View on Instagram",
    people: "Artists to watch", peopleSub: "Artists and companies shaping new work", schedule: "Full performance calendar", scheduleSub: "Browse upcoming performances by week.",
    empty: "There are no upcoming performances at the moment.", newsletter: "Get this week’s performing arts stories", newsletterDesc: "New performances, artists, reviews, and opportunities, delivered together.",
    email: "Email address", subscribe: "Subscribe · Coming soon", genres: ["Dance", "Music", "Theatre & Musical"],
    shelf: { today: "On stage today", opening: "Opening this week", closing: "Closing soon", popok: "Featuring POPOK artists & companies" },
    reason: { upcoming: "Performing soon", active: "Recently updated", popular: "Trending profile", new: "New to POPOK" },
  },
} as const;

function formatDate(start: string | null | undefined, end: string | null | undefined, locale: Locale) {
  const format = (value: string) => {
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    if (!year || !month || !day) return "";
    return locale === "ko" ? `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}` : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
  };
  const first = start ? format(start) : ""; const last = end ? format(end) : "";
  return first && last && first !== last ? `${first} — ${last}` : first || last;
}

function performanceHref(performance: Performance) {
  const external = getPerformanceExternalLink(performance);
  return external ? { href: external, external: true } : performance.companyId ? { href: getCompanyDetailHref(performance.companyId), external: false } : null;
}

function PerformanceCard({ performance, locale }: { performance: Performance; locale: Locale }) {
  const destination = performanceHref(performance);
  const body = <>
    <div className={styles.poster}>{performance.posterUrl ? <ResponsiveImage src={performance.posterUrl} alt={`${performance.title} poster`} sizes="(max-width: 640px) 72vw, 270px" maxWidth={540} loading="lazy" /> : <span aria-hidden="true">POPOK<br />STAGE</span>}</div>
    <p className={styles.cardDate}>{formatDate(performance.startDate, performance.endDate, locale)}</p><h3>{performance.title}</h3><p>{[performance.companyName || performance.organizer, performance.venue].filter(Boolean).join(" · ")}</p>
  </>;
  if (!destination) return <article className={styles.performanceCard}>{body}</article>;
  return destination.external ? <a className={styles.performanceCard} href={destination.href} target="_blank" rel="noopener noreferrer">{body}</a> : <Link className={styles.performanceCard} href={destination.href}>{body}</Link>;
}

function addDays(date: string, count: number) { const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + count); return d.toISOString().slice(0, 10); }
function scheduleGroups(performances: Performance[], referenceDate = new Date()) {
  const { weekStart } = getWeeklyPerformanceRange(referenceDate);
  return Array.from({ length: 12 }, (_, index) => {
    const start = addDays(weekStart, index * 7); const end = addDays(start, 6);
    return { index, start, end, items: performances.filter((item) => overlapsDateRange(item, start, end)) };
  }).filter((group) => group.items.length);
}

export default function PerformanceMagazine({ locale, performances, artists, companies, stories }: { locale: Locale; performances: Performance[]; artists: Artist[]; companies: Company[]; stories: InstagramStory[] }) {
  const t = copy[locale];
  const cover = selectMagazineCover(performances);
  const shelves = buildPerformanceShelves(performances);
  const profiles = curateProfiles(artists, companies, performances);
  const groups = scheduleGroups(performances);
  const news: MagazineContentItem[] = stories.map((story) => ({ id: story.id, category: story.category, title: story.title, summary: story.excerpt, thumbnailUrl: story.imageUrl, publishedAt: story.publishedAt, instagramUrl: story.permalink }));
  const reviews: MagazineReview[] = []; // No public review-post model exists yet; keep the section hidden.

  return <div className={styles.page} lang={locale}>
    <header className={styles.intro}><p>{t.kicker}</p><h1>{t.title}</h1><div><span>{t.description}</span><b>{new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "long" }).format(new Date())}</b></div></header>

    {cover ? <section className={styles.cover} aria-label={cover.title}>
      <div className={styles.coverMedia}>{cover.posterUrl ? <ResponsiveImage src={cover.posterUrl} alt={`${cover.title} poster`} sizes="100vw" maxWidth={1600} loading="eager" /> : <span aria-hidden="true">POPOK<br />PERFORMANCE</span>}<div className={styles.coverOverlay} /></div>
      <div className={styles.coverCopy}><p>{cover.featured ? "EDITOR’S PICK" : (cover.category || cover.genre || "PERFORMANCE")}</p><h2>{cover.title}</h2>{cover.description && <span>{cover.description}</span>}<time>{formatDate(cover.startDate, cover.endDate, locale)}{cover.venue ? ` · ${cover.venue}` : ""}</time>{performanceHref(cover) && (performanceHref(cover)!.external ? <a href={performanceHref(cover)!.href} target="_blank" rel="noopener noreferrer">{t.detail} ↗</a> : <Link href={performanceHref(cover)!.href}>{t.detail} →</Link>)}</div>
    </section> : <div className={styles.heroEmpty}>{t.empty}</div>}

    <div className={styles.shell}>
      {shelves.length > 0 && <section className={styles.section} aria-labelledby="weekly-title"><div className={styles.sectionTitle}><span>{t.weeklySub}</span><h2 id="weekly-title">{t.weekly}</h2></div>{shelves.map((shelf) => <div className={styles.shelf} key={shelf.key}><h3>{t.shelf[shelf.key]}</h3><div className={styles.rail}>{shelf.items.map((performance) => <PerformanceCard key={`${shelf.key}-${performance.id}`} performance={performance} locale={locale} />)}</div></div>)}<a className={styles.textCta} href="#all-performances">{t.all} ↓</a></section>}

      {news.length > 0 && <section className={styles.section} aria-labelledby="news-title"><div className={styles.sectionTitle}><span>{t.newsSub}</span><h2 id="news-title">{t.news}</h2></div><div className={styles.newsGrid}>{news.map((item, index) => <article key={item.id} className={index === 0 ? styles.newsLead : styles.newsCard}><div className={styles.newsImage}><ResponsiveImage src={item.thumbnailUrl} alt="" sizes={index === 0 ? "(max-width: 760px) 100vw, 60vw" : "(max-width: 760px) 100vw, 30vw"} maxWidth={index === 0 ? 1000 : 600} loading="lazy" /></div><div><p>{item.category}</p><h3>{item.title}</h3>{item.summary && <span>{item.summary}</span>}<time dateTime={item.publishedAt}>{new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { dateStyle: "medium" }).format(new Date(item.publishedAt))}</time>{item.href ? <Link href={item.href}>{t.detail}</Link> : item.instagramUrl ? <a href={item.instagramUrl} target="_blank" rel="noopener noreferrer">{t.instagram} ↗</a> : null}</div></article>)}</div></section>}

      <ReviewSection reviews={reviews} locale={locale} />

      {profiles.length > 0 && <section className={styles.section} aria-labelledby="people-title"><div className={styles.sectionTitle}><span>{t.peopleSub}</span><h2 id="people-title">{t.people}</h2></div><div className={styles.peopleGrid}>{profiles.map((profile, index) => <Link href={profile.href} className={styles.personCard} key={profile.key}><div className={styles.personImage}>{profile.imageUrl ? <ResponsiveImage src={profile.imageUrl} alt={profile.name} sizes="(max-width: 640px) 45vw, 260px" maxWidth={520} loading="lazy" /> : <span>{profile.name.slice(0, 1)}</span>}<b>{String(index + 1).padStart(2, "0")}</b></div><p>{profile.kind === "artist" ? "ARTIST" : "COMPANY"}</p><h3>{locale === "en" && profile.nameEn ? profile.nameEn : profile.name}</h3><span>{profile.role}</span><small>{t.reason[profile.reason]}</small></Link>)}</div></section>}

      <section id="all-performances" className={styles.section} aria-labelledby="schedule-title"><div className={styles.sectionTitle}><span>{t.scheduleSub}</span><h2 id="schedule-title">{t.schedule}</h2></div>{groups.length ? <div className={styles.schedule}>{groups.map((group) => <section key={group.start}><h3>{group.index === 0 ? (locale === "ko" ? "이번 주" : "This week") : formatDate(group.start, group.end, locale)}</h3><div className={styles.rail}>{group.items.map((performance) => <PerformanceCard key={`calendar-${group.start}-${performance.id}`} performance={performance} locale={locale} />)}</div></section>)}</div> : <div className={styles.emptyState}>{t.empty}</div>}</section>

      <section className={styles.newsletter} aria-labelledby="newsletter-title"><p>WEEKLY LETTER</p><h2 id="newsletter-title">{t.newsletter}</h2><span>{t.newsletterDesc}</span><fieldset disabled><legend className="sr-only">Genre</legend><div>{t.genres.map((genre) => <label key={genre}><input type="checkbox" /> {genre}</label>)}</div><label className="sr-only" htmlFor={`newsletter-${locale}`}>{t.email}</label><input id={`newsletter-${locale}`} type="email" placeholder={t.email} /><button type="button" disabled>{t.subscribe}</button></fieldset></section>
    </div>
  </div>;
}
