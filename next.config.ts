import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Airtable 연동이므로 완전 동적 렌더링
  // 추후 ISR 적용 가능: revalidate 설정으로 캐시

  // pdf-parse(pdfjs-dist)/mammoth는 Node.js 전용 API에 의존하므로 Next의
  // Route Handler 번들링에서 제외하고 네이티브 require를 사용하게 한다.
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
