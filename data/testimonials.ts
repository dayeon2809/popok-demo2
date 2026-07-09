export interface Testimonial {
  quote: string;
  name: string;
  genre: string;
}

// 실제 아티스트 후기가 도착하면 이 배열의 항목만 교체하면 됩니다.
// (별점/후기 수는 아직 표시하지 않습니다 — 필드 추가 시 TestimonialsSection.tsx도 함께 확인하세요.)
export const testimonials: Testimonial[] = [
  { quote: "후기 준비 중", name: "POPOK Artist", genre: "DANCE" },
  { quote: "후기 준비 중", name: "POPOK Artist", genre: "DANCE" },
  { quote: "후기 준비 중", name: "POPOK Artist", genre: "DANCE" },
  { quote: "후기 준비 중", name: "POPOK Artist", genre: "DANCE" },
];
