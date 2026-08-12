import type { InstagramStory } from "@/lib/instagram";
import MagazineImage from "./MagazineImage";
import MagazineTabs from "./MagazineTabs";
import styles from "./performanceMagazine.module.css";

type Locale = "ko" | "en";

const copy = {
  ko: {
    kicker: "POPOK PERFORMANCE MAGAZINE", title: "퐄터뷰", description: "무대 위 예술가들이 직접 들려주는 이야기를 만나보세요.",
    empty: "아직 등록된 퐄터뷰가 없습니다. Instagram에서 새 소식을 확인해 보세요.",
    viewOnInstagram: "Instagram에서 보기 ↗",
  },
  en: {
    kicker: "POPOK PERFORMANCE MAGAZINE", title: "Pokterview", description: "Stories told directly by the artists on stage.",
    empty: "No Pokterview stories yet — check @popok.official on Instagram.",
    viewOnInstagram: "View on Instagram ↗",
  },
} as const;

export default function PokterviewFeed({ locale, stories }: { locale: Locale; stories: InstagramStory[] }) {
  const t = copy[locale];
  return (
    <div className={styles.page} lang={locale}>
      <header className={styles.intro}>
        <p>{t.kicker}</p><h1>{t.title}</h1>
        <div><span>{t.description}</span></div>
        <MagazineTabs locale={locale} active="pokterview" />
      </header>

      <div className={styles.shell}>
        <section className={styles.section} style={{ paddingTop: 0 }}>
          {stories.length ? (
            <div className={styles.pokGrid}>
              {stories.map((story) => (
                <a key={story.id} href={story.permalink} target="_blank" rel="noopener noreferrer" className={styles.pokCard}>
                  <div className={styles.pokImage}><MagazineImage src={story.imageUrl} alt={story.title} /></div>
                  <p>{t.viewOnInstagram}</p>
                  <h3>{story.title}</h3>
                  <time dateTime={story.publishedAt}>{new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { dateStyle: "medium" }).format(new Date(story.publishedAt))}</time>
                </a>
              ))}
            </div>
          ) : (
            <div className={styles.pokEmpty}>{t.empty}</div>
          )}
        </section>
      </div>
    </div>
  );
}
