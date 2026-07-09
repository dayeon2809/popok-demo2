import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Airtable 연동이므로 완전 동적 렌더링
  // 추후 ISR 적용 가능: revalidate 설정으로 캐시
};

export default nextConfig;
