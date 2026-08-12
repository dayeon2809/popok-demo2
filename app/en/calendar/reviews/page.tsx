import type { Metadata } from "next";
import CriticReviewsFeed from "@/components/calendar/CriticReviewsFeed";
import { listCriticReviews } from "@/lib/criticReviews";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Critics' Reviews | POPOK",description:"Read performing arts criticism and reviews."};
export default async function EnglishCriticReviewsPage(){return <CriticReviewsFeed locale="en" reviews={await listCriticReviews()} />;}
