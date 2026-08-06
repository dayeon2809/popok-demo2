import type { Metadata } from "next";
import { headers } from "next/headers";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import "./discovery.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { localizePath, type Locale } from "@/lib/i18n/locale";

const baseMetadata: Metadata = {
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

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const locale = (headerStore.get("x-popok-locale") === "en" ? "en" : "ko") as Locale;
  const pathname = headerStore.get("x-popok-pathname") || "/";
  const title = locale === "en" ? "POPOK — Artist Portfolios" : String(baseMetadata.title);
  const description = locale === "en"
    ? "Discover performing artists, companies, works, and portfolios from Korea."
    : String(baseMetadata.description);
  return {
    ...baseMetadata,
    metadataBase: new URL("https://popok.kr"),
    title,
    description,
    alternates: {
      canonical: localizePath(pathname, locale),
      languages: { ko: localizePath(pathname, "ko"), en: localizePath(pathname, "en") },
    },
    openGraph: { ...baseMetadata.openGraph, locale: locale === "en" ? "en_US" : "ko_KR", url: localizePath(pathname, locale), title, description },
    twitter: { ...baseMetadata.twitter, title, description },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const locale = headerStore.get("x-popok-locale") === "en" ? "en" : "ko";
  return (
    <html lang={locale} style={{ background: "#FFFFFF" }}>
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
