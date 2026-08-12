import styles from "./performanceMagazine.module.css";

export type MagazineReview = {
  id: string;
  excerpt: string;
  workTitle: string;
  author: string;
  publishedAt: string;
  href: string;
};

export default function ReviewSection({ reviews, locale }: { reviews: MagazineReview[]; locale: "ko" | "en" }) {
  if (reviews.length === 0) return null;
  return (
    <section className={styles.section} aria-labelledby="review-title">
      <div className={styles.sectionTitle}><span>{locale === "ko" ? "새로 올라온 리뷰" : "New reviews"}</span><h2 id="review-title">REVIEWS</h2></div>
      <div className={styles.reviewGrid}>{reviews.map((review) => (
        <article key={review.id} className={styles.reviewCard}>
          <blockquote>“{review.excerpt}”</blockquote><p>{review.workTitle} · {review.author}</p><time dateTime={review.publishedAt}>{review.publishedAt}</time>
          <a href={review.href}>{locale === "ko" ? "리뷰 읽기" : "Read review"}</a>
        </article>
      ))}</div>
    </section>
  );
}
