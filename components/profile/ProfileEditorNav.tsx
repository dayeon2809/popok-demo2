"use client";

import styles from "./ProfileEditorNav.module.css";

export type ProfileEditorSection = "basic" | "intro" | "works" | "activity" | "education" | "awards";

const sections: Array<{ key: ProfileEditorSection; number: string; label: string }> = [
  { key: "basic", number: "1", label: "기본 정보" },
  { key: "intro", number: "2", label: "소개 · 미디어" },
  { key: "works", number: "3", label: "작품 · 프로젝트" },
  { key: "activity", number: "4", label: "활동 이력" },
  { key: "education", number: "5", label: "학력" },
  { key: "awards", number: "6", label: "수상 · 선정" },
];

export default function ProfileEditorNav({ active, onChange }: { active: ProfileEditorSection; onChange: (section: ProfileEditorSection) => void }) {
  return <nav className={styles.nav} aria-label="프로필 편집 항목">
    <div className={styles.track}>{sections.map((section) => <button key={section.key} type="button" className={styles.tab} data-active={active === section.key} aria-current={active === section.key ? "step" : undefined} onClick={() => onChange(section.key)}><span>{section.number}</span>{section.label}</button>)}</div>
  </nav>;
}