export interface FaqItem {
  question: string;
  answer: string;
  // 결제/구독 관련 질문처럼 별도 페이지로 안내가 필요한 경우에만 채웁니다.
  ctaHref?: string;
  ctaLabel?: string;
}

// FAQ 질문/답변을 수정하려면 이 배열만 편집하면 됩니다.
export const faqItems: FaqItem[] = [
  {
    question: "POPOK은 어떤 서비스인가요?",
    answer: "무용가와 아티스트의 흩어진 작업 기록을 하나의 개인 프로필 페이지로 정리하는 서비스입니다.",
  },
  {
    question: "누구나 프로필을 만들 수 있나요?",
    answer: "현재는 무용 아티스트를 중심으로 시작하며, 발레·한국무용·현대무용 분야부터 순차적으로 확장할 예정입니다.",
  },
  {
    question: "프로필을 만들려면 어떤 자료가 필요한가요?",
    answer: "프로필 사진과 움직임을 보여주는 영상, 그리고 대표 작품이나 활동 이력을 보내주시면 됩니다.",
  },
  {
    question: "제출하면 바로 공개되나요?",
    answer: "아직은 바로 공개되지 않습니다. POPOK 팀이 자료를 확인하고 정리한 뒤 이메일로 안내드립니다.",
  },
  {
    question: "프로필을 나중에 수정할 수 있나요?",
    answer: "네. 기본 수정 요청이 가능하며, 앞으로 정기적으로 포트폴리오를 관리해주는 Premium 서비스도 제공할 예정입니다.",
  },
  {
    question: "POPOK Premium은 무엇인가요?",
    answer: "새로운 공연과 작품 활동을 POPOK 팀이 주기적으로 확인하고 정리해 아티스트 프로필을 최신 상태로 유지해주는 관리 서비스입니다.",
    ctaHref: "/premium",
    ctaLabel: "Premium 안내 보기 →",
  },
];
