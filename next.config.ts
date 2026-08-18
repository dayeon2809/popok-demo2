import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // An unrelated package-lock.json exists above this repo. Pin the project
  // root so Turbopack resolves this app's installed server dependencies.
  turbopack: {
    root: process.cwd(),
  },
  images: {
    qualities: [75, 80],
  },
  // Airtable 연동이므로 완전 동적 렌더링
  // 추후 ISR 적용 가능: revalidate 설정으로 캐시

  // pdf-parse(pdfjs-dist)/mammoth는 Node.js 전용 API에 의존하므로 Next의
  // Route Handler 번들링에서 제외하고 네이티브 require를 사용하게 한다.
  serverExternalPackages: ["pdf-parse", "mammoth"],

  experimental: {
    proxyClientMaxBodySize: "20mb",
  },

  // 응답에 붙는 보안 헤더. Vercel 이 이미 Strict-Transport-Security 를 넣어 주지만
  // 나머지는 아무것도 없었다(요청서 2.5 「1주」 항목).
  //
  // 일부러 넣지 않은 것 둘:
  //  - HSTS 의 includeSubDomains: 아직 HTTPS 가 아닌 하위 도메인이 있으면 그대로
  //    접속 불능이 되고, 브라우저가 기간만큼 기억하므로 되돌리기도 어렵다.
  //  - script-src 등 본격적인 CSP: Next 가 인라인 스크립트를 쓰기 때문에 nonce 배선
  //    없이 켜면 화면이 죽는다. 여기서는 클릭재킹만 막는 frame-ancestors 만 쓴다.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // 브라우저가 Content-Type 을 제멋대로 추측하지 못하게 한다. 공개 버킷에
          // 올라간 파일이 문서로 해석되는 경로를 막는다.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // 우리 페이지를 남의 사이트 iframe 안에 넣지 못하게 한다(클릭재킹).
          // 우리가 YouTube·Vimeo 를 품는 것은 이 헤더와 무관하다.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          // 외부로 나갈 때 전체 주소 대신 출처만 보낸다 — 신청 카드 주소 같은 것이
          // Referer 로 새지 않도록.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
