import { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";
import { termsContent } from "@/data/legal/terms";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "이용약관 — POPOK",
  description: "POPOK 서비스 이용약관입니다. 서비스 이용과 관련된 회원과 회사 간의 권리 및 의무를 규정합니다.",
  alternates: {
    canonical: "https://popok-demo.vercel.app/terms",
  },
};

export default function TermsPage() {
  return <LegalLayout document={termsContent} />;
}
