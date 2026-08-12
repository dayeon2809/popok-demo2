import Link from "next/link";
import styles from "./performanceMagazine.module.css";

type Locale = "ko" | "en";
type TabKey = "magazine" | "reviews" | "pokterview" | "monthly";

const TABS: { key: TabKey; path: string; label: Record<Locale, string> }[] = [
  { key: "magazine", path: "performances", label: { ko: "매거진", en: "Magazine" } },
  { key: "reviews", path: "/reviews", label: { ko: "평론가 리뷰", en: "Critics' Reviews" } },
  { key: "pokterview", path: "/pokterview", label: { ko: "퐄터뷰", en: "Pokterview" } },
  { key: "monthly", path: "/monthly", label: { ko: "월간 캘린더", en: "Monthly Calendar" } },
];

export default function MagazineTabs({ locale, active }: { locale: Locale; active: TabKey }) {
  const prefix = locale === "en" ? "/en/" : "/";
  return (
    <nav className={styles.tabs} aria-label={locale === "ko" ? "공연 콘텐츠 탭" : "Performances section tabs"}>
      {TABS.map((tab) => (
        <Link key={tab.key} href={tab.path.startsWith("/") ? `${prefix}calendar${tab.path}` : `${prefix}${tab.path}`} className={tab.key === active ? styles.tabActive : styles.tab} aria-current={tab.key === active ? "page" : undefined}>
          {tab.label[locale]}
        </Link>
      ))}
    </nav>
  );
}
