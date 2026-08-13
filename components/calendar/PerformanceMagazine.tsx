import Link from "next/link";
import { getPerformanceExternalLink } from "@/lib/performanceLinks";
import { getCompanyDetailHref } from "@/lib/companyRoute";
import { buildPerformanceShelves, curateProfiles, selectMagazineCovers } from "@/lib/calendarMagazine";
import type { Artist, Company, Performance } from "@/types";
import ReviewSection, { type MagazineReview } from "./ReviewSection";
import MagazineImage from "./MagazineImage";
import MagazineTabs from "./MagazineTabs";
import MagazineHeroCarousel from "./MagazineHeroCarousel";
import styles from "./performanceMagazine.module.css";
import type { ReactNode } from "react";

type Locale = "ko" | "en";

const copy = {
  ko: {
    kicker: "POPOK PERFORMANCE MAGAZINE", title: "지금, 공연예술계에서는", description: "새로운 공연과 아티스트, 공연예술계의 이야기를 만나보세요.",
    detail: "자세히 보기", weekly: "이번 주 공연", weeklySub: "오늘의 무대부터 곧 시작될 작업까지", all: "월간 캘린더에서 전체 일정 보기",
    people: "지금 주목받는 아티스트", peopleSub: "새로운 활동을 이어가는 아티스트와 단체",
    empty: "현재 등록된 예정 공연이 없습니다.", newsletter: "이번 주의 공연예술 소식을 받아보세요", newsletterDesc: "새로운 공연, 아티스트, 리뷰와 기회 정보를 한 번에 전해드려요.",
    email: "이메일 주소", subscribe: "구독하기 · 준비 중입니다", genres: ["무용", "음악", "연극·뮤지컬"],
    shelf: { opening: "이번 주 개막", nextWeek: "다음 주 공연", popok: "POPOK 아티스트·단체의 공연" },
    reason: { upcoming: "곧 공연을 앞두고 있어요", active: "최근 활동을 업데이트했어요", popular: "최근 많이 찾는 프로필", new: "새로 합류한 프로필" },
  },
  en: {
    kicker: "POPOK PERFORMANCE MAGAZINE", title: "Now in Performing Arts", description: "Discover new performances, artists, and stories from the performing arts scene.",
    detail: "View details", weekly: "Performances this week", weeklySub: "From today's stage to works opening soon", all: "See the full schedule in the monthly calendar",
    people: "Artists to watch", peopleSub: "Artists and companies shaping new work",
    empty: "There are no upcoming performances at the moment.", newsletter: "Get this week's performing arts stories", newsletterDesc: "New performances, artists, reviews, and opportunities, delivered together.",
    email: "Email address", subscribe: "Subscribe · Coming soon", genres: ["Dance", "Music", "Theatre & Musical"],
    shelf: { opening: "Opening this week", nextWeek: "Next week's performances", popok: "Featuring POPOK artists & companies" },
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
    <div className={styles.poster}>{performance.posterUrl ? <MagazineImage src={performance.posterUrl} alt={`${performance.title} poster`} /> : <span aria-hidden="true">POPOK<br />STAGE</span>}</div>
    <p className={styles.cardDate}>{formatDate(performance.startDate, performance.endDate, locale)}</p><h3>{performance.title}</h3><p>{[performance.companyName || performance.organizer, performance.venue].filter(Boolean).join(" · ")}</p>
  </>;
  if (!destination) return <article className={styles.performanceCard}>{body}</article>;
  return destination.external ? <a className={styles.performanceCard} href={destination.href} target="_blank" rel="noopener noreferrer">{body}</a> : <Link className={styles.performanceCard} href={destination.href}>{body}</Link>;
}

export default function PerformanceMagazine({ locale, performances, artists, companies, navigation, discovery }: { locale: Locale; performances: Performance[]; artists: Artist[]; companies: Company[]; navigation?: ReactNode; discovery?: ReactNode }) {
  const t = copy[locale];
  const covers = selectMagazineCovers(performances, new Date(), 4);
  const shelves = buildPerformanceShelves(performances);
  const profiles = curateProfiles(artists, companies, performances);
  const reviews: MagazineReview[] = []; // No public review-post model exists yet; keep the section hidden.
  const monthlyHref = locale === "en" ? "/en/calendar/monthly" : "/calendar/monthly";

  return <div className={styles.page} lang={locale}>
    <header className={styles.intro}>
      <div className={styles.eyebrowBadge}>
        <span className={styles.eyebrowDot} />
        <span className={styles.eyebrowText}>{t.kicker}</span>
      </div>
      <h1 className="display">
        {locale === "ko" ? (
          <>
            지금, <span className="seen-highlight">공연예술계에서는</span>
          </>
        ) : (
          <>
            Now in <span className="seen-highlight">Performing Arts</span>
          </>
        )}
      </h1>
      <div className={styles.introMeta}>
        <span className={styles.introDesc}>{t.description}</span>
        <b className={styles.introDate}>{new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "long" }).format(new Date())}</b>
      </div>
      <MagazineTabs locale={locale} active="magazine" />
    </header>

    {navigation}

    {covers.length > 0 ? <MagazineHeroCarousel covers={covers} locale={locale} /> : <div className={styles.heroEmpty}>{t.empty}</div>}

    <div className={styles.shell}>
      {shelves.length > 0 ? <section className={styles.section} aria-labelledby="weekly-title"><div className={styles.sectionTitle}><span>{t.weeklySub}</span><h2 id="weekly-title">{t.weekly}</h2></div>{shelves.map((shelf) => <div className={styles.shelf} key={shelf.key}><h3>{t.shelf[shelf.key]}</h3><div className={styles.rail}>{shelf.items.map((performance) => <PerformanceCard key={`${shelf.key}-${performance.id}`} performance={performance} locale={locale} />)}</div></div>)}<Link className={styles.textCta} href={monthlyHref}>{t.all} →</Link></section>
        : <section className={styles.section}><div className={styles.emptyState}>{t.empty}</div><Link className={styles.textCta} href={monthlyHref}>{t.all} →</Link></section>}

      {discovery}

      <ReviewSection reviews={reviews} locale={locale} />

      {profiles.length > 0 && <section className={styles.section} aria-labelledby="people-title"><div className={styles.sectionTitle}><span>{t.peopleSub}</span><h2 id="people-title">{t.people}</h2></div><div className={styles.peopleGrid}>{profiles.map((profile, index) => <Link href={profile.href} className={styles.personCard} key={profile.key}><div className={styles.personImage}>{profile.imageUrl ? <MagazineImage src={profile.imageUrl} alt={profile.name} /> : <span>{profile.name.slice(0, 1)}</span>}<b>{String(index + 1).padStart(2, "0")}</b></div><p>{profile.kind === "artist" ? "ARTIST" : "COMPANY"}</p><h3>{locale === "en" && profile.nameEn ? profile.nameEn : profile.name}</h3><span>{profile.role}</span><small>{t.reason[profile.reason]}</small></Link>)}</div></section>}

      <section className={styles.newsletter} aria-labelledby="newsletter-title"><p>WEEKLY LETTER</p><h2 id="newsletter-title">{t.newsletter}</h2><span>{t.newsletterDesc}</span><fieldset disabled><legend className="sr-only">Genre</legend><div>{t.genres.map((genre) => <label key={genre}><input type="checkbox" /> {genre}</label>)}</div><label className="sr-only" htmlFor={`newsletter-${locale}`}>{t.email}</label><input id={`newsletter-${locale}`} type="email" placeholder={t.email} /><button type="button" disabled>{t.subscribe}</button></fieldset></section>
    </div>
  </div>;
}
