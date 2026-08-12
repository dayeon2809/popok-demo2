import type { Metadata } from "next";
import CriticReviewsFeed from "@/components/calendar/CriticReviewsFeed";
import { listCriticReviews } from "@/lib/criticReviews";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"평론가 리뷰 | POPOK",description:"공연예술 평론과 리뷰를 만나보세요."};
export default async function CriticReviewsPage(){return <CriticReviewsFeed locale="ko" reviews={await listCriticReviews()} />;}
