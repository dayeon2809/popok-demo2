import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://popok-demo.vercel.app"),

  title: "POPOK — Artist's Domain",
  description: "한국 무용계 아티스트와 작품을 발견하는 가장 쉬운 방법.",

  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://popok-demo.vercel.app",
    siteName: "POPOK",
    title: "POPOK — Artist's Domain",
    description: "한국 무용계 아티스트와 작품을 발견하는 가장 쉬운 방법.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "POPOK",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" style={{ background: "#FFFFFF" }}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "POPOK",
              "url": "https://popok.kr",
              "description": "한국 무용계 아티스트와 작품을 발견하는 가장 쉬운 방법.",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "All"
            })
          }}
        />
      </head>
      <body style={{ background: "#FFFFFF" }}>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
        <Header />
        <main style={{ background: "#FFFFFF", paddingBottom: "80px" }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}