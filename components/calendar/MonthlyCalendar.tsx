import Link from "next/link";
import { getPerformanceExternalLink } from "@/lib/performanceLinks";
import { getCompanyDetailHref } from "@/lib/companyRoute";
import { getSeoulToday, overlapsDateRange } from "@/lib/date";
import type { Performance } from "@/types";
import MagazineTabs from "./MagazineTabs";
import styles from "./performanceMagazine.module.css";

type Locale = "ko" | "en";

const copy = {
  ko: {
    kicker: "POPOK PERFORMANCE MAGAZINE", title: "월간 캘린더", description: "이번 달 공연을 날짜별로 한눈에 확인하세요.",
    weekdays: ["월", "화", "수", "목", "금", "토", "일"],
    prev: "이전 달", next: "다음 달", more: (n: number) => `+${n}건 더`,
    empty: "이 달에는 등록된 공연이 없습니다.", noDate: "날짜 미정",
  },
  en: {
    kicker: "POPOK PERFORMANCE MAGAZINE", title: "Monthly Calendar", description: "See this month's performances at a glance, day by day.",
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    prev: "Previous month", next: "Next month", more: (n: number) => `+${n} more`,
    empty: "No performances are scheduled this month.", noDate: "TBA",
  },
} as const;

function pad(n: number) { return String(n).padStart(2, "0"); }
function toDateStr(d: Date) { return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; }
function addDaysUTC(dateStr: string, count: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + count);
  return toDateStr(dt);
}
function mondayOffset(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // Mon=0 ... Sun=6
}

export function buildMonthGrid(monthStart: string) {
  const [y, m] = monthStart.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const monthEnd = `${y}-${pad(m)}-${pad(lastDay)}`;
  const gridStart = addDaysUTC(monthStart, -mondayOffset(monthStart));
  const gridEnd = addDaysUTC(monthEnd, 6 - mondayOffset(monthEnd));
  const days: string[] = [];
  for (let cursor = gridStart; cursor <= gridEnd; cursor = addDaysUTC(cursor, 1)) days.push(cursor);
  return { days, monthEnd, gridStart, gridEnd };
}

export function shiftMonth(monthStart: string, delta: number) {
  const [y, m] = monthStart.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const nextY = Math.floor(total / 12);
  const nextM = (total % 12) + 1;
  return `${nextY}-${pad(nextM)}-01`;
}

function performanceHref(performance: Performance) {
  const external = getPerformanceExternalLink(performance);
  return external ? { href: external, external: true } : performance.companyId ? { href: getCompanyDetailHref(performance.companyId), external: false } : null;
}

function DayEntryLink({ performance, className }: { performance: Performance; className?: string }) {
  const destination = performanceHref(performance);
  if (!destination) return <span className={className}>{performance.title}</span>;
  return destination.external
    ? <a className={className} href={destination.href} target="_blank" rel="noopener noreferrer">{performance.title}</a>
    : <Link className={className} href={destination.href}>{performance.title}</Link>;
}

function AgendaEntry({ performance }: { performance: Performance }) {
  const destination = performanceHref(performance);
  const body = <><h4>{performance.title}</h4><p>{[performance.companyName || performance.organizer, performance.venue].filter(Boolean).join(" · ")}</p></>;
  if (!destination) return <div className={styles.agendaEntry}>{body}</div>;
  return destination.external
    ? <a className={styles.agendaEntry} href={destination.href} target="_blank" rel="noopener noreferrer">{body}</a>
    : <Link className={styles.agendaEntry} href={destination.href}>{body}</Link>;
}

export default function MonthlyCalendar({ locale, monthStart, performances, embedded = false, query = {} }: { locale: Locale; monthStart: string; performances: Performance[]; embedded?: boolean; query?: Record<string, string> }) {
  const t = copy[locale];
  const { days, gridStart, gridEnd } = buildMonthGrid(monthStart);
  const [year, month] = monthStart.split("-").map(Number);
  const today = getSeoulToday();
  const base = embedded ? (locale === "en" ? "/en/performances" : "/performances") : (locale === "en" ? "/en/calendar/monthly" : "/calendar/monthly");
  const monthHref = (value: string) => { const params = new URLSearchParams({ ...query, view: "calendar", month: value.slice(0, 7) }); return `${base}?${params}`; };
  const prevHref = monthHref(shiftMonth(monthStart, -1));
  const nextHref = monthHref(shiftMonth(monthStart, 1));
  const monthLabel = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));

  const dayEntries = days.map((day) => ({
    day,
    items: performances.filter((item) => overlapsDateRange(item, day, day)).sort((a, b) => (a.title || "").localeCompare(b.title || "")),
  }));
  const agendaDays = dayEntries.filter((d) => d.items.length > 0 && d.day >= monthStart && d.day <= gridEnd && d.day.slice(0, 7) === monthStart.slice(0, 7));

  return (
    <div className={styles.page} lang={locale}>
      {!embedded && <header className={styles.intro}>
        <p>{t.kicker}</p><h1>{t.title}</h1>
        <div><span>{t.description}</span></div>
        <MagazineTabs locale={locale} active="monthly" />
      </header>}

      <div className={styles.shell}>
        <section className={styles.section} style={{ paddingTop: 0 }}>
          <div className={styles.monthNav}>
            <Link href={prevHref} aria-label={t.prev}>←</Link>
            <strong>{monthLabel}</strong>
            <Link href={nextHref} aria-label={t.next}>→</Link>
          </div>

          <div className={styles.monthGrid} role="grid" aria-label={monthLabel}>
            {t.weekdays.map((w) => <div key={w} className={styles.monthWeekday}>{w}</div>)}
            {dayEntries.map(({ day, items }) => {
              const isOutside = day.slice(0, 7) !== monthStart.slice(0, 7);
              const isToday = day === today;
              const dayNum = Number(day.slice(8, 10));
              const shown = items.slice(0, 2);
              const extra = items.length - shown.length;
              return (
                <div key={day} className={`${isOutside ? styles.monthOutside : ""} ${isToday ? styles.monthToday : ""}`.trim()} id={`day-${day}`}>
                  <span className={styles.monthDayNum}>{dayNum}</span>
                  {shown.map((performance) => <DayEntryLink key={performance.id} performance={performance} className={styles.dayLink} />)}
                  {extra > 0 && <a className={styles.dayMore} href={`#day-${day}`}>{t.more(extra)}</a>}
                </div>
              );
            })}
          </div>

          {agendaDays.length > 0 ? (
            <div className={styles.agenda}>
              {agendaDays.map(({ day, items }) => (
                <div key={day} className={styles.agendaDay} id={`agenda-${day}`}>
                  <h3>{new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { month: "long", day: "numeric", weekday: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`))}<small>{items.length}</small></h3>
                  <div className={styles.agendaGrid}>
                    {items.map((performance) => <AgendaEntry key={performance.id} performance={performance} />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>{t.empty}</div>
          )}
        </section>
      </div>
    </div>
  );
}
