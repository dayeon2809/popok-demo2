import { getUpcomingPerformances } from "@/lib/performances";
import { getPerformanceExternalLink } from "@/lib/performanceLinks";
import { getCompanyDetailHref } from "@/lib/companyRoute";
import { getWeeklyPerformanceRange, parseDateOnly } from "@/lib/date";
import type { Performance } from "@/types";

export const dynamic = "force-dynamic";

function formatDateRange(start?: string | null, end?: string | null): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };
  const s = start ? fmt(start) : "";
  const e = end ? fmt(end) : "";
  if (s && e && s !== e) return `${s} – ${e}`;
  return s || e || "일정 미정";
}

// "YYYY-MM-DD" (UTC-anchored, matching lib/date.ts's own day-math convention)
function addDaysUTC(dateStr: string, days: number): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt;
}

function formatShortDate(dt: Date): string {
  return `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`;
}

function formatWeekLabel(weekIndex: number, weekStart: Date, weekEnd: Date): string {
  const range = `${formatShortDate(weekStart)}~${formatShortDate(weekEnd)}`;
  if (weekIndex === 0) return `이번주 (${range})`;
  if (weekIndex === 1) return `다음주 (${range})`;
  return `${weekIndex}주 후 (${range})`;
}

interface WeekGroup {
  weekIndex: number;
  weekStart: Date;
  weekEnd: Date;
  performances: Performance[];
}

/**
 * Groups performances into Monday–Sunday weeks, keyed off *this* week
 * (index 0) — a performance is bucketed by its start date's week, clamped to
 * week 0 for anything already running (start date before this week's
 * Monday), so nothing that should be visible "now" ends up hidden in a past
 * bucket. Reuses lib/date.ts's existing Asia/Seoul week-boundary math
 * (getWeeklyPerformanceRange) instead of re-deriving it.
 */
function groupByWeek(performances: Performance[]): WeekGroup[] {
  const { weekStart: week0StartStr } = getWeeklyPerformanceRange(new Date());
  const week0Start = addDaysUTC(week0StartStr, 0);

  const groups = new Map<number, Performance[]>();
  for (const perf of performances) {
    const start = parseDateOnly(perf.startDate);
    if (!start) continue;
    const startDate = addDaysUTC(start, 0);
    const diffDays = Math.floor((startDate.getTime() - week0Start.getTime()) / 86400000);
    const weekIndex = Math.max(0, Math.floor(diffDays / 7));
    if (!groups.has(weekIndex)) groups.set(weekIndex, []);
    groups.get(weekIndex)!.push(perf);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([weekIndex, perfs]) => {
      const weekStart = addDaysUTC(week0StartStr, weekIndex * 7);
      const weekEnd = addDaysUTC(week0StartStr, weekIndex * 7 + 6);
      return { weekIndex, weekStart, weekEnd, performances: perfs };
    });
}

function PerformanceCard({ perf }: { perf: Performance }) {
  const externalLink = getPerformanceExternalLink(perf);
  const href = externalLink || (perf.companyId ? getCompanyDetailHref(perf.companyId) : null);
  const isExternal = Boolean(externalLink);

  const card = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        width: "100%", aspectRatio: "3 / 4", borderRadius: "8px", overflow: "hidden",
        background: "#EAE6DD", border: "1px solid var(--border)", marginBottom: "10px",
      }}>
        {perf.posterUrl && (
          <img src={perf.posterUrl} alt={perf.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
        )}
      </div>
      <span className="mono" style={{ fontSize: "0.66rem", fontWeight: 800, color: "var(--accent-dark)" }}>
        {formatDateRange(perf.startDate, perf.endDate)}
      </span>
      <h3 style={{
        fontSize: "0.88rem", fontWeight: 800, color: "var(--navy)", margin: "3px 0 2px", lineHeight: 1.35,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {perf.title}
      </h3>
      <span style={{
        fontSize: "0.74rem", color: "var(--ink-muted)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {[perf.companyName || perf.organizer, perf.venue].filter(Boolean).join(" · ")}
      </span>
    </div>
  );

  const wrapperStyle: React.CSSProperties = {
    textDecoration: "none",
    minWidth: "150px",
    maxWidth: "150px",
    flex: "0 0 auto",
    scrollSnapAlign: "start",
  };

  if (!href) return <div style={wrapperStyle}>{card}</div>;
  return isExternal ? (
    <a href={href} target="_blank" rel="noopener noreferrer" style={wrapperStyle}>{card}</a>
  ) : (
    <a href={href} style={wrapperStyle}>{card}</a>
  );
}

// Header's "공연" tab — every upcoming/published performance, grouped into
// Monday–Sunday weeks ("이번주 (7/27~8/2)", "다음주 (8/3~8/9)", ...), each
// week shown as a single horizontally-scrollable row (mobile-friendly by
// construction — no column-count breakpoints needed). Reuses the same data
// + link-resolution the homepage's V1 performance carousel used
// (lib/performances.ts, lib/performanceLinks.ts, lib/date.ts).
export default async function CalendarPage() {
  const performances = await getUpcomingPerformances(60);
  const weeks = groupByWeek(performances);

  return (
    <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "56px 0 100px" }}>
      <div style={{ marginBottom: "36px", padding: "0 24px" }}>
        <h1 className="display" style={{
          fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "var(--navy)", fontWeight: 950, letterSpacing: "-0.03em", margin: "0 0 10px",
        }}>
          다가오는 공연
        </h1>
        <p style={{ fontSize: "0.92rem", color: "var(--ink-muted)" }}>
          POPOK 아티스트와 단체의 공연 일정을 주별로 확인하세요.
        </p>
      </div>

      {weeks.length === 0 ? (
        <div style={{ margin: "0 24px", padding: "80px 24px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "8px", color: "var(--ink-muted)", fontSize: "0.9rem" }}>
          예정된 공연이 없습니다.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
          {weeks.map((week) => (
            <section key={week.weekIndex}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--navy)", margin: "0 0 14px", padding: "0 24px" }}>
                {formatWeekLabel(week.weekIndex, week.weekStart, week.weekEnd)}
              </h2>
              <div
                className="no-scrollbar"
                style={{
                  display: "flex", gap: "16px", overflowX: "auto",
                  padding: "2px 24px 8px", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
                }}
              >
                {week.performances.map((perf) => (
                  <PerformanceCard key={perf.id} perf={perf} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
