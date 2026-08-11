export interface Testimonial {
  quote: string;
  quoteEn: string;
  name: string;
  nameEn: string;
  genre: string;
  genreEn: string;
  rating: number;
}

// 실제 아티스트 후기가 도착하면 이 배열의 항목만 교체하면 됩니다.
export const testimonials: Testimonial[] = [
  {
    quote: "공연 이력과 작품을 여기저기 정리해두다 보니 매번 링크를 보내는 게 번거로웠는데, POPOK에서는 한 페이지로 관리할 수 있어서 훨씬 편해졌어요.",
    quoteEn: "My performance history and works used to be scattered across different places, so sharing links every time was a hassle. Managing everything on one POPOK page is much easier.",
    name: "현대무용수 이0진",
    nameEn: "Contemporary Dancer L** J**",
    genre: "베타 테스트 참가자",
    genreEn: "Beta Tester",
    rating: 5,
  },
  {
    quote: "프로필만 만드는 서비스인 줄 알았는데 작품과 공연 이력까지 함께 정리되니 포트폴리오를 소개할 때 훨씬 편했습니다.",
    quoteEn: "I thought it was only for making a profile, but having my works and performance history organized together made presenting my portfolio much easier.",
    name: "공연예술인 유0리",
    nameEn: "Performing Artist Y** R**",
    genre: "베타 테스트 참가자",
    genreEn: "Beta Tester",
    rating: 5,
  },
  {
    quote: "공연이 끝날 때마다 SNS에만 기록했는데, POPOK에서는 활동이 하나의 포트폴리오로 쌓이는 느낌이라 좋았습니다.",
    quoteEn: "I used to record each finished performance only on social media. With POPOK, it feels like every activity builds into one portfolio.",
    name: "프리랜서 안무가 김0우",
    nameEn: "Freelance Choreographer K** W**",
    genre: "베타 테스트 참가자",
    genreEn: "Beta Tester",
    rating: 5,
  },
  {
    quote: "단체 소개와 프로젝트를 함께 보여줄 수 있어서 협업 제안을 받을 때 활용하기 좋을 것 같아요.",
    quoteEn: "Being able to present our organization and projects together will be useful when receiving collaboration proposals.",
    name: "공연단체 관계자 박0현",
    nameEn: "Performing Arts Organization Staff P** H**",
    genre: "베타 테스트 참가자",
    genreEn: "Beta Tester",
    rating: 5,
  },
  {
    quote: "디자인이 깔끔해서 처음 보는 사람에게 제 작업을 보여주기에도 부담이 없었습니다.",
    quoteEn: "The clean design made it easy to show my work to someone seeing it for the first time.",
    name: "공연예술 전공자 최0준",
    nameEn: "Performing Arts Student C** J**",
    genre: "베타 테스트 참가자",
    genreEn: "Beta Tester",
    rating: 5,
  },
];
