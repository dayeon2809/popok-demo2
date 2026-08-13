import Link from "next/link";
import type { CriticReview } from "@/lib/criticReviews";
import MagazineTabs from "./MagazineTabs";
import MagazineImage from "./MagazineImage";
import styles from "./performanceMagazine.module.css";

function formatReviewDate(value: string | null, locale: "ko" | "en") {
  if (!value) return locale === "ko" ? "날짜 미정" : "Date TBA";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).format(parsed);
}

export default function CriticReviewsFeed({ locale, reviews }: { locale:"ko"|"en"; reviews:CriticReview[] }) {
  const ko = locale === "ko";
  return <div className={styles.page} lang={locale}>
    <header className={styles.intro}>
      <div className={styles.eyebrowBadge}>
        <span className={styles.eyebrowDot} />
        <span className={styles.eyebrowText}>POPOK PERFORMANCE MAGAZINE</span>
      </div>
      <h1 className="display">
        {ko ? (
          <>
            깊이 있는 <span className="seen-highlight">평론가 리뷰</span>
          </>
        ) : (
          <>
            In-depth <span className="seen-highlight">Critics&apos; Reviews</span>
          </>
        )}
      </h1>
      <div className={styles.introMeta}>
        <span className={styles.introDesc}>
          {ko ? "공연예술을 깊이 읽는 평론과 비평을 만나보세요." : "Read criticism and reviews that look deeper into the performing arts."}
        </span>
      </div>
      <MagazineTabs locale={locale} active="reviews" />
    </header>
    <div className={styles.shell}><section className={styles.section} style={{paddingTop:0}}>
      {reviews.length ? <div className={styles.criticGrid}>{reviews.map((review, index) => <article key={review.id} className={styles.criticCard}>
        <div className={styles.criticCardTop}>
          <p>{review.publisher || (ko ? "평론·리뷰" : "Criticism")}</p>
          <time dateTime={review.date || undefined}>{formatReviewDate(review.date, locale)}</time>
        </div>
        <h2>{review.title}</h2>
        {review.description && <blockquote>“{review.description}”</blockquote>}
        <a className={styles.criticThumbnail} href={review.url} target="_blank" rel="noopener noreferrer" aria-label={`${review.title} ${ko ? "리뷰 읽기" : "Read review"}`}>
          {review.imageUrl ? <MagazineImage src={review.imageUrl} alt="" /> : <span><b>{String(index + 1).padStart(2, "0")}</b> POPOK REVIEW</span>}
        </a>
        {review.relatedPerformance && <div className={styles.reviewPerformance}><span>{ko ? "연관 공연" : "Related performance"}</span><strong>{review.relatedPerformance}</strong></div>}
        <div className={styles.reviewMeta}><Link href={review.subjectHref}>{review.subject}</Link><a href={review.url} target="_blank" rel="noopener noreferrer">{ko ? "리뷰 전문" : "Full review"} ↗</a></div>
      </article>)}</div> : <div className={styles.pokEmpty}>{ko ? "아직 공개 프로필에 연결된 평론가 리뷰가 없습니다." : "No critics' reviews are linked to public profiles yet."}</div>}
    </section></div>
  </div>;
}
