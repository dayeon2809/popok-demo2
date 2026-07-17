import { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";
import { privacyContent } from "@/data/legal/privacy";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "개인정보처리방침 — POPOK",
  description: "POPOK 서비스 개인정보처리방침입니다. 회원의 개인정보를 보호하고 관리하기 위해 규정한 기준을 명시합니다.",
  alternates: {
    canonical: "https://popok-demo.vercel.app/privacy",
  },
};

export default function PrivacyPage() {
  return <LegalLayout document={privacyContent} />;
}
