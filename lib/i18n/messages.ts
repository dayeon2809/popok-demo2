import type { Locale } from "./locale";

const messages = {
  ko: {
    nav: { about: "소개", artists: "아티스트", companies: "단체", performances: "공연", opportunities: "기회", popokArtist: "POPOK Artist", faq: "자주 묻는 질문" },
    common: { loading: "불러오는 중…", empty: "표시할 내용이 없습니다.", error: "문제가 발생했습니다.", save: "저장", cancel: "취소", edit: "수정", share: "공유", copyLink: "링크 복사", viewEnglish: "View in English" },
  },
  en: {
    nav: { about: "About", artists: "Artists", companies: "Companies", performances: "Performances", opportunities: "Opportunities", popokArtist: "POPOK Artist", faq: "FAQ" },
    common: { loading: "Loading…", empty: "Nothing to show yet.", error: "Something went wrong.", save: "Save", cancel: "Cancel", edit: "Edit", share: "Share", copyLink: "Copy link", viewEnglish: "한국어로 보기" },
  },
} as const;

export type Messages = (typeof messages)["ko"];
export function getMessages(locale: Locale) {
  return messages[locale];
}
