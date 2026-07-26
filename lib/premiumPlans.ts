// Single source of truth for POPOK's plan definitions — shared by /premium
// (full pricing page) and the homepage Premium section, so the two can never
// drift out of sync on what each plan actually includes.

export type PlanId = "free" | "student" | "artist";

export interface PlanDef {
  id: PlanId;
  name: string;
  tagline?: string;
  monthlyPrice: number;
  annualPrice: number;
  originalMonthlyPrice?: number;
  originalAnnualPrice?: number;
  badge?: string;
  highlight?: boolean;
  features: string[];
}

export const PREMIUM_PLANS: PlanDef[] = [
  {
    id: "free",
    name: "Free",
    tagline: "직접 작품과 이력을 기록하는 기본 플랜",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "나만의 포트폴리오 페이지",
      "작품과 이력 직접 기록",
      "검수 후 포트폴리오 공개",
      "하나의 링크로 활동 공유",
    ],
  },
  {
    id: "student",
    name: "Student",
    tagline: "학업과 활동을 병행하는 아티스트를 위한 플랜",
    monthlyPrice: 3900,
    annualPrice: 39000,
    originalMonthlyPrice: 4900,
    originalAnnualPrice: 49000,
    badge: "오픈 이벤트가",
    features: [
      "포트폴리오 간편 제작",
      "활동 데이터 기본 이식",
      "QR 디지털 명함 생성",
      "상시 링크 공유",
    ],
  },
  {
    id: "artist",
    name: "POPOK Artist",
    tagline: "AI와 POPOK 팀이 함께 활동을 관리하는 하이브리드 매니지먼트",
    monthlyPrice: 6900,
    annualPrice: 69000,
    originalMonthlyPrice: 9900,
    originalAnnualPrice: 99000,
    badge: "얼리버드 한정가",
    highlight: true,
    features: [
      "기록보다 창작에 더 많은 시간을",
      "공연 소식 자동 모니터링 & 업데이트",
      "공연 홍보 콘텐츠 제작 지원",
      "POPOK 메인 및 SNS 채널 소개",
      "활동 기록 점검 및 상시 관리",
    ],
  },
];

export const PREMIUM_PLAN = PREMIUM_PLANS.find((p) => p.id === "artist")!;
