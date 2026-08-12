import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicOpportunity } from "@/lib/opportunities/repository";
import { getArtGenreLabel, getOpportunityTypeLabel } from "@/lib/opportunities/labels";
import styles from "./opportunityDetail.module.css";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

function formatDate(value?: string | null, includeTime = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10).replaceAll("-", ". ");
  return new Intl.DateTimeFormat("ko-KR", { timeZone:"Asia/Seoul", year:"numeric", month:"long", day:"numeric", ...(includeTime ? { hour:"numeric", minute:"2-digit" } : {}) }).format(date);
}

function lifecycleLabel(status?: string | null) {
  if (status === "open") return "접수 중";
  if (status === "upcoming") return "접수 예정";
  if (status === "closed") return "접수 마감";
  return "일정 확인 필요";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const item: any = await getPublicOpportunity(id);
    if (!item) return { title:"기회 공고 | POPOK" };
    return { title:`${item.title} | POPOK 기회`, description:item.summary || `${item.organization}의 공연예술 기회 공고입니다.` };
  } catch { return { title:"기회 공고 | POPOK" }; }
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { id } = await params;
  let item: any = null;
  try { item = await getPublicOpportunity(id); } catch (error) { console.error("[opportunity detail] query failed", error); }
  if (!item) notFound();

  const applicationHref = item.application_url || item.original_publisher_url || item.source_url;
  const sourceHref = item.original_publisher_url || item.source_url;
  const genres = (item.art_genres || []).filter((genre: string) => genre !== "all");
  const audiences = item.target_audience || [];
  const start = formatDate(item.application_start_at);
  const deadline = formatDate(item.deadline, true);

  return <main className={styles.page}>
    <div className={styles.shell}>
      <nav className={styles.breadcrumb} aria-label="현재 위치"><Link href="/opportunities">기회</Link><span aria-hidden="true">/</span><span>{getOpportunityTypeLabel(item.opportunity_type, "ko")}</span></nav>

      <header className={styles.hero}>
        <div className={styles.badges}><span className={styles.status} data-status={item.lifecycle_status}>{lifecycleLabel(item.lifecycle_status)}</span><span className={styles.type}>{getOpportunityTypeLabel(item.opportunity_type, "ko")}</span>{item.is_featured && <span className={styles.featured}>POPOK PICK</span>}</div>
        <h1>{item.title}</h1>
        <p className={styles.organization}>{item.organization}</p>
        {item.summary && <p className={styles.lead}>{item.summary}</p>}
      </header>

      <section className={styles.factGrid} aria-label="공고 핵심 정보">
        <div><span>접수 기간</span><strong>{start && deadline ? `${start} — ${deadline}` : deadline || start || "원문에서 확인"}</strong></div>
        <div><span>지역</span><strong>{item.region || "지역 제한 없음·미정"}</strong></div>
        <div><span>지원 분야</span><strong>{genres.length ? genres.map((genre: string) => getArtGenreLabel(genre, "ko")).join(" · ") : "분야 제한 없음·미정"}</strong></div>
        <div><span>지원 대상</span><strong>{audiences.length ? audiences.join(" · ") : "원문에서 확인"}</strong></div>
      </section>

      <div className={styles.layout}>
        <article className={styles.content}>
          {item.description && <section aria-labelledby="description-title"><p className={styles.kicker}>ABOUT THE OPPORTUNITY</p><h2 id="description-title">공고 내용</h2><div className={styles.prose}>{item.description}</div></section>}
          {item.application_method && <section aria-labelledby="method-title"><p className={styles.kicker}>HOW TO APPLY</p><h2 id="method-title">지원 방법</h2><div className={styles.prose}>{item.application_method}</div></section>}
          {item.contact && <section aria-labelledby="contact-title"><p className={styles.kicker}>CONTACT</p><h2 id="contact-title">문의</h2><div className={styles.prose}>{item.contact}</div></section>}
          {!item.description && !item.application_method && <section><p className={styles.kicker}>NOTICE</p><h2>상세 안내</h2><p className={styles.muted}>세부 내용은 원문 공고에서 확인해 주세요.</p></section>}
          <aside className={styles.notice}><strong>확인해 주세요</strong><p>POPOK은 공고 정보를 보기 쉽게 정리해 제공합니다. 지원 전 일정과 자격 조건, 제출 서류는 반드시 원 발행기관의 최신 공고를 확인해 주세요.</p></aside>
        </article>

        <aside className={styles.applyPanel} aria-label="지원 정보">
          <p>APPLICATION</p><span>마감</span><strong>{deadline || "원문에서 확인"}</strong>
          {applicationHref && <a className={styles.primaryCta} href={applicationHref} target="_blank" rel="noopener noreferrer">지원 페이지로 이동 <span aria-hidden="true">↗</span></a>}
          {sourceHref && sourceHref !== applicationHref && <a className={styles.secondaryCta} href={sourceHref} target="_blank" rel="noopener noreferrer">원문 공고 보기 <span aria-hidden="true">↗</span></a>}
          <dl><div><dt>주최·기관</dt><dd>{item.organization}</dd></div><div><dt>공고 유형</dt><dd>{getOpportunityTypeLabel(item.opportunity_type, "ko")}</dd></div>{item.published_at && <div><dt>게시일</dt><dd>{formatDate(item.published_at)}</dd></div>}</dl>
          <Link href="/opportunities" className={styles.backLink}>← 기회 목록으로</Link>
        </aside>
      </div>
    </div>
  </main>;
}
