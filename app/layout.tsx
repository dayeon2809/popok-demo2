import type { Metadata } from "next";
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
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header />
        <main style={{ marginBottom: "80px" }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}