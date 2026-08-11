import type { Metadata } from "next";
import OpportunitiesClient from "./OpportunitiesClient";

export const metadata: Metadata = {
  title: "기회 | POPOK",
  description: "공연예술인을 위한 오디션, 협업, 지원사업, 레지던시 정보를 한곳에서 확인하세요.",
};

export default function OpportunitiesPage() {
  return <OpportunitiesClient />;
}
