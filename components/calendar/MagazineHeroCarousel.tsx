"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Performance } from "@/types";
import { getPerformanceExternalLink } from "@/lib/performanceLinks";
import { getCompanyDetailHref } from "@/lib/companyRoute";
import MagazineImage from "./MagazineImage";
import styles from "./performanceMagazine.module.css";

type Locale = "ko" | "en";

function formatDate(start: string | null | undefined, end: string | null | undefined, locale: Locale) {
  const format = (value: string) => {
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    if (!year || !month || !day) return "";
    return locale === "ko"
      ? `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}`
      : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
  };
  const first = start ? format(start) : "";
  const last = end ? format(end) : "";
  return first && last && first !== last ? `${first} — ${last}` : first || last;
}

function destination(performance: Performance) {
  const external = getPerformanceExternalLink(performance);
  if (external) return { href: external, external: true };
  if (performance.companyId) return { href: getCompanyDetailHref(performance.companyId), external: false };
  return null;
}

export default function MagazineHeroCarousel({ covers, locale }: { covers: Performance[]; locale: Locale }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = covers.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % count), 5000);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  const move = (direction: number) => setActive((current) => (current + direction + count) % count);

  return (
    <section
      className={styles.cover}
      aria-roledescription="carousel"
      aria-label={locale === "ko" ? "주요 공연" : "Featured performances"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className={styles.coverTrack} style={{ transform: `translateX(-${active * 100}%)` }}>
        {covers.map((cover, index) => {
          const href = destination(cover);
          return (
            <article className={styles.coverSlide} key={cover.id} aria-hidden={index !== active}>
              <div className={styles.coverMedia}>
                {cover.posterUrl ? <MagazineImage src={cover.posterUrl} alt={`${cover.title} poster`} priority={index === 0} /> : <span aria-hidden="true">POPOK<br />PERFORMANCE</span>}
                <div className={styles.coverOverlay} />
              </div>
              <div className={styles.coverCopy}>
                <p>{cover.featured ? "EDITOR'S PICK" : (cover.category || cover.genre || "PERFORMANCE")}</p>
                <h2>{cover.title}</h2>
                {cover.description && <span>{cover.description}</span>}
                <time>{formatDate(cover.startDate, cover.endDate, locale)}{cover.venue ? ` · ${cover.venue}` : ""}</time>
                {href && (href.external
                  ? <a href={href.href} target="_blank" rel="noopener noreferrer" tabIndex={index === active ? 0 : -1}>{locale === "ko" ? "자세히 보기" : "View details"} →</a>
                  : <Link href={href.href} tabIndex={index === active ? 0 : -1}>{locale === "ko" ? "자세히 보기" : "View details"} →</Link>)}
              </div>
            </article>
          );
        })}
      </div>

      {count > 1 && (
        <div className={styles.coverControls}>
          <div className={styles.coverDots} aria-label={locale === "ko" ? "공연 슬라이드 선택" : "Choose performance slide"}>
            {covers.map((cover, index) => (
              <button key={cover.id} type="button" aria-label={`${index + 1} / ${count}`} aria-current={index === active ? "true" : undefined} onClick={() => setActive(index)} />
            ))}
          </div>
          <button type="button" onClick={() => move(-1)} aria-label={locale === "ko" ? "이전 공연" : "Previous performance"}>←</button>
          <span>{String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
          <button type="button" onClick={() => move(1)} aria-label={locale === "ko" ? "다음 공연" : "Next performance"}>→</button>
        </div>
      )}
    </section>
  );
}
