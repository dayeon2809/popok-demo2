"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getPerformanceExternalLink } from "@/lib/performanceLinks";
import { getCompanyDetailHref } from "@/lib/companyRoute";
import { getSeoulToday, overlapsDateRange } from "@/lib/date";
import { normalizePerformanceGenre } from "@/lib/performanceDiscovery";
import { buildMonthGrid, shiftMonth } from "@/lib/monthGrid";
import type { Performance } from "@/types";
import MagazineTabs from "./MagazineTabs";
import styles from "./performanceMagazine.module.css";

type Locale = "ko" | "en";

const copy = {
  ko: {
    kicker: "POPOK PERFORMANCE MAGAZINE", title: "월간 캘린더", description: "이번 달 공연을 날짜별로 한눈에 확인하세요.",
    weekdays: ["일", "월", "화", "수", "목", "금", "토"],
    prev: "이전 달", next: "다음 달", today: "오늘", more: (n: number) => `+${n}건 더`,
    empty: "이 달에는 등록된 공연이 없습니다.", noDate: "날짜 미정", selected: "선택한 날짜의 공연", selectDay: "날짜를 선택해 공연을 확인하세요.", count: (n:number) => `${n}개의 공연`,
  },
  en: {
    kicker: "POPOK PERFORMANCE MAGAZINE", title: "Monthly Calendar", description: "See this month's performances at a glance, day by day.",
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    prev: "Previous month", next: "Next month", today: "Today", more: (n: number) => `+${n} more`,
    empty: "No performances are scheduled this month.", noDate: "TBA", selected: "Performances on this day", selectDay: "Select a date to see its performances.", count: (n:number) => `${n} performances`,
  },
} as const;

function performanceHref(performance: Performance) {
  const external = getPerformanceExternalLink(performance);
  return external ? { href: external, external: true } : performance.companyId ? { href: getCompanyDetailHref(performance.companyId), external: false } : null;
}

function DayPeriod({ performance, day, className }: { performance: Performance; day:string; className?: string }) {
  const genre = normalizePerformanceGenre(performance);
  const start = performance.startDate || day;
  const end = performance.endDate || start;
  const position = start === end ? "single" : day === start ? "start" : day === end ? "end" : "middle";
  const body = <><i aria-hidden="true" /><span>{performance.title}</span></>;
  return <span className={className} data-genre={genre} data-period={position} title={`${performance.title} · ${start}–${end}`}>{body}</span>;
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
  const todayHref = monthHref(`${today.slice(0, 7)}-01`);
  const monthLabel = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));

  const dayEntries = days.map((day) => ({
    day,
    items: performances.filter((item) => overlapsDateRange(item, day, day)).sort((a, b) => (a.title || "").localeCompare(b.title || "")),
  }));
  const initialDay = dayEntries.find(({day,items}) => day === today && items.length)?.day || dayEntries.find(({day,items}) => day.startsWith(monthStart.slice(0,7)) && items.length)?.day || null;
  const [selectedDay, setSelectedDay] = useState<string | null>(initialDay);
  const selectedItems = useMemo(() => dayEntries.find(({day}) => day === selectedDay)?.items || [], [dayEntries, selectedDay]);
  const selectDay = (day:string) => { setSelectedDay(day); window.history.replaceState(null,"",`#day-${day}`); };

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
            <div className={styles.monthControls}>
              <Link href={prevHref} aria-label={t.prev}>←</Link>
              <Link href={nextHref} aria-label={t.next}>→</Link>
              <Link href={todayHref} className={styles.todayButton}>{t.today}</Link>
            </div>
            <strong>{monthLabel}</strong>
            <span className={styles.monthNavSpacer} aria-hidden="true" />
          </div>

          <div className={styles.calendarLayout}>
          <div className={styles.monthGrid} role="grid" aria-label={monthLabel}>
            {t.weekdays.map((w) => <div key={w} className={styles.monthWeekday}>{w}</div>)}
            {dayEntries.map(({ day, items }) => {
              const isOutside = day.slice(0, 7) !== monthStart.slice(0, 7);
              const isToday = day === today;
              const dayNum = Number(day.slice(8, 10));
              const shown = items.slice(0, 3);
              const extra = items.length - shown.length;
              return (
                <div key={day} className={`${isOutside ? styles.monthOutside : ""} ${isToday ? styles.monthToday : ""} ${selectedDay === day ? styles.monthSelected : ""}`.trim()} id={`day-${day}`}>
                  <button type="button" className={styles.daySelect} onClick={() => selectDay(day)} aria-label={`${day}, ${t.count(items.length)}`} aria-pressed={selectedDay === day}><span className={styles.monthDayNum}>{dayNum}</span></button>
                  {shown.map((performance) => <DayPeriod key={performance.id} day={day} performance={performance} className={styles.dayLink} />)}
                  {extra > 0 && <button type="button" className={styles.dayMore} onClick={() => selectDay(day)}>{t.more(extra)}</button>}
                </div>
              );
            })}
          </div>
          <aside className={styles.dayPanel} aria-live="polite">
            {selectedDay ? <><p>{t.selected}</p><h3>{new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US",{month:"long",day:"numeric",weekday:"long",timeZone:"UTC"}).format(new Date(`${selectedDay}T00:00:00Z`))}</h3><span>{t.count(selectedItems.length)}</span><div className={styles.dayPanelList}>{selectedItems.length ? selectedItems.map((performance)=><AgendaEntry key={performance.id} performance={performance}/>) : <div className={styles.dayPanelEmpty}>{t.empty}</div>}</div></> : <div className={styles.dayPanelEmpty}>{t.selectDay}</div>}
          </aside>
          </div>
        </section>
      </div>
    </div>
  );
}
