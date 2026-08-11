import { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";
import { copyrightContent } from "@/data/legal/copyright";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "저작권 및 콘텐츠 정책 — POPOK",
  description: "POPOK 서비스 저작권 및 콘텐츠 정책입니다. 아티스트 콘텐츠 저작권 보호 및 침해 신고 절차를 담고 있습니다.",
  alternates: {
    canonical: "https://popok-demo.vercel.app/copyright",
  },
};

export default function CopyrightPage() {
  return <LegalLayout document={copyrightContent} />;
}
