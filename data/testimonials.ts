export interface Testimonial {
  quote: string;
  name: string;
  genre: string;
  rating: number;
}

// 실제 아티스트 후기가 도착하면 이 배열의 항목만 교체하면 됩니다.
export const testimonials: Testimonial[] = [
  {
    quote: "공연 이력과 작품을 여기저기 정리해두다 보니 매번 링크를 보내는 게 번거로웠는데, POPOK에서는 한 페이지로 관리할 수 있어서 훨씬 편해졌어요.",
    name: "현대무용수",
    genre: "베타 테스트 참가자",
    rating: 5,
  },
  {
    quote: "프로필만 만드는 서비스인 줄 알았는데 작품과 공연 이력까지 함께 정리되니 포트폴리오를 소개할 때 훨씬 편했습니다.",
    name: "공연예술인",
    genre: "베타 테스트 참가자",
    rating: 5,
  },
  {
    quote: "공연이 끝날 때마다 SNS에만 기록했는데, POPOK에서는 활동이 하나의 포트폴리오로 쌓이는 느낌이라 좋았습니다.",
    name: "프리랜서 안무가",
    genre: "베타 테스트 참가자",
    rating: 5,
  },
  {
    quote: "단체 소개와 프로젝트를 함께 보여줄 수 있어서 협업 제안을 받을 때 활용하기 좋을 것 같아요.",
    name: "공연단체 관계자",
    genre: "베타 테스트 참가자",
    rating: 5,
  },
  {
    quote: "디자인이 깔끔해서 처음 보는 사람에게 제 작업을 보여주기에도 부담이 없었습니다.",
    name: "공연예술 전공자",
    genre: "베타 테스트 참가자",
    rating: 5,
  },
];
