// Client-safe shared types/helpers for the "포퐄 보내기" feature — kept
// separate from lib/portfolioRequestsServer.ts (which pulls in
// lib/supabaseServer.ts, a server-only module) so this file can be imported
// from client components without bundling server code.

export type PortfolioRequestTargetType = "company" | "artist";

export interface PortfolioRequestTarget {
  type: PortfolioRequestTargetType;
  id: string;
  name: string;
  imageUrl?: string | null;
}

export function portfolioRequestCreateEndpoint(target: Pick<PortfolioRequestTarget, "type" | "id">): string {
  return target.type === "company"
    ? `/api/companies/${target.id}/portfolio-requests`
    : `/api/artists/${target.id}/portfolio-requests`;
}

export const PORTFOLIO_REQUEST_STATUS_LABEL: Record<string, string> = {
  pending: "확인 대기 중",
  viewed: "상대방이 포퐄을 확인했습니다",
  accepted: "포퐄 요청을 수락했습니다",
  declined: "이번 요청은 진행되지 않았습니다",
  withdrawn: "요청을 취소했습니다",
};

export const PORTFOLIO_REQUEST_COPY: Record<PortfolioRequestTargetType, {
  heading: string;
  subheading: string;
  buttonLabel: string;
  sentLabel: string;
  selfLabel: string;
  messagePlaceholder: string;
  recipientFieldLabel: string;
  fallbackIcon: string;
}> = {
  company: {
    heading: "함께 작업하고 싶은 단체인가요?",
    subheading: "함께 작업하고 싶은 단체에 나의 포트폴리오를 보내보세요.",
    buttonLabel: "이 단체한테 내 포퐄 보내기",
    sentLabel: "포퐄을 보냈습니다",
    selfLabel: "내 단체 페이지입니다",
    messagePlaceholder: "단체에 전하고 싶은 간단한 메시지를 작성해주세요.",
    recipientFieldLabel: "보내는 곳",
    fallbackIcon: "🏛️",
  },
  artist: {
    heading: "함께 작업하고 싶은 예술가인가요?",
    subheading: "나의 포트폴리오와 함께 간단한 협업 제안을 보내보세요.",
    buttonLabel: "이 아티스트에게 내 포퐄 보내기",
    sentLabel: "포퐄을 보냈습니다",
    selfLabel: "내 포퐄 페이지입니다",
    messagePlaceholder: "아티스트에게 전하고 싶은 협업 제안이나 메시지를 작성해주세요.",
    recipientFieldLabel: "보내는 아티스트",
    fallbackIcon: "🎭",
  },
};
