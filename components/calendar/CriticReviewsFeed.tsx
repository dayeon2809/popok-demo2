import Link from "next/link";
import type { CriticReview } from "@/lib/criticReviews";
import MagazineTabs from "./MagazineTabs";
import styles from "./performanceMagazine.module.css";

export default function CriticReviewsFeed({ locale, reviews }: { locale:"ko"|"en"; reviews:CriticReview[] }) {
  const ko = locale === "ko";
  return <div className={styles.page} lang={locale}>
    <header className={styles.intro}><p>POPOK PERFORMANCE MAGAZINE</p><h1 className="display">{ko ? "평론가 리뷰" : "Critics' Reviews"}</h1><div><span>{ko ? "공연예술을 깊이 읽는 평론과 비평을 만나보세요." : "Read criticism and reviews that look deeper into the performing arts."}</span></div><MagazineTabs locale={locale} active="reviews" /></header>
    <div className={styles.shell}><section className={styles.section} style={{paddingTop:0}}>
      {reviews.length ? <div className={styles.criticGrid}>{reviews.map((review) => <article key={review.id} className={styles.criticCard}>
        <p>{review.publisher || (ko ? "평론·리뷰" : "Criticism")}</p>{review.relatedPerformance && <div className={styles.reviewPerformance}><span>{ko ? "연관 공연" : "Related performance"}</span><strong>{review.relatedPerformance}</strong></div>}<h2>{review.title}</h2>{review.description && <blockquote>“{review.description}”</blockquote>}<div className={styles.reviewMeta}><Link href={review.subjectHref}>{review.subject}</Link>{review.date && <time dateTime={review.date}>{review.date}</time>}</div><a href={review.url} target="_blank" rel="noopener noreferrer">{ko ? "리뷰 전문 읽기" : "Read full review"} ↗</a>
      </article>)}</div> : <div className={styles.pokEmpty}>{ko ? "아직 공개 프로필에 연결된 평론가 리뷰가 없습니다." : "No critics' reviews are linked to public profiles yet."}</div>}
    </section></div>
  </div>;
}
