import type { CollaborationPost, Opportunity } from "./types";

// MVP 전용 데이터입니다. UI는 이 배열 대신 API 결과를 주입하기 쉽게 타입과 분리했습니다.
export const opportunityStats = { total: 28, audition: 12, collaboration: 9, grant: 7 };

export const mockOpportunities: Opportunity[] = [
  {
    id: "actor-audition-1", category: "actor", typeLabel: "배우 · 오디션",
    title: "독립장편영화 〈여름의 끝〉 주·조연 배우 모집", organization: "무브먼트 필름",
    summary: "20–30대 주·조연 배우를 찾습니다. 촬영 전 리딩 일정이 포함됩니다.",
    location: "서울", compensation: "회차당 협의", schedule: "2026년 9월 촬영",
    deadline: "2026-08-05", sourceUrl: "https://www.filmmakers.co.kr/", createdAt: "2026-08-03",
  },
  {
    id: "music-collab-1", category: "music", typeLabel: "음악 · 협업",
    title: "공연 신작에 참여할 첼로 연주자와 작곡가를 찾습니다", organization: "프로젝트 O",
    summary: "창작진과 함께 리서치부터 공연까지 참여할 음악가를 모집합니다.",
    location: "서울·경기", compensation: "유급", schedule: "2026년 10월 공연",
    deadline: "2026-08-07", createdAt: "2026-08-02",
  },
  {
    id: "dance-project-1", category: "dance", typeLabel: "무용 · 프로젝트",
    title: "신작 쇼케이스에 함께할 현대무용수 4인 모집", organization: "스튜디오 결",
    location: "서울", compensation: "연습·공연비 지급", schedule: "9–11월",
    deadline: "2026-08-04", sourceUrl: "https://www.dancepostkorea.com/", createdAt: "2026-08-03",
  },
  {
    id: "grant-1", category: "grant", typeLabel: "지원사업",
    title: "2026 신진 공연예술가 창작지원 참여자 모집", organization: "아트브릿지 재단",
    location: "전국", compensation: "최대 1,500만원", schedule: "2026년 하반기",
    deadline: "2026-08-10", sourceUrl: "https://www.arko.or.kr/", createdAt: "2026-08-01",
  },
  {
    id: "residency-1", category: "residency", typeLabel: "지원사업 · 레지던시",
    title: "공연예술 창작자 가을 레지던시 입주작가 공모", organization: "무대밖 창작소",
    location: "강원", compensation: "공간·제작비 지원", schedule: "2026년 10–12월",
    deadline: "2026-07-30", createdAt: "2026-07-20",
  },
  {
    id: "international-1", category: "international", typeLabel: "해외 · 교류",
    title: "아시아 퍼포밍아츠 교류 프로그램 참가팀 모집", organization: "APAC Arts Network",
    location: "일본 도쿄", compensation: "항공·숙박 지원", schedule: "2027년 1월",
    deadline: "2026-08-18", sourceUrl: "https://on-the-move.org/", createdAt: "2026-08-03",
  },
];

export const mockCollaborations: CollaborationPost[] = [
  { id: "c1", authorId: "yoon-kyungkeun", authorName: "윤경근", role: "공연예술가", content: "단편영화 음악감독을 찾고 있어요.", createdLabel: "2시간 전", genre: "music" },
  { id: "c2", authorId: "yoon-kyungkeun", authorName: "윤경근", role: "퍼포머", content: "10월 쇼케이스 무대에 함께할 현대무용수를 모집합니다.", createdLabel: "어제", genre: "dance" },
  { id: "c3", authorId: "yoon-kyungkeun", authorName: "윤경근", role: "연출", content: "뮤지컬 낭독공연에 참여할 배우 3인을 찾습니다.", createdLabel: "2일 전", genre: "actor" },
];
