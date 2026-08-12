import type { Metadata } from "next";
import OpportunitiesClient from "./OpportunitiesClient";
import { listPublicOpportunities } from "@/lib/opportunities/repository";
import { getOpportunityTypeLabel } from "@/lib/opportunities/labels";
import { isOpportunityClosingSoon } from "@/lib/opportunities/status";
import type { Opportunity } from "@/lib/opportunities/types";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "기회 | POPOK",
  description: "공연예술인을 위한 오디션, 협업, 지원사업, 레지던시 정보를 한곳에서 확인하세요.",
};

export function mapOpportunityRow(row: any): Opportunity {
  return {
    id: row.id,
    category: row.opportunity_type === "job" ? "collaboration" : row.opportunity_type === "grant" ? "grant" : "international",
    typeLabel: getOpportunityTypeLabel(row.opportunity_type, "ko"),
    title: row.title,
    organization: row.organization,
    summary: row.summary,
    description: row.description,
    opportunityType: row.opportunity_type,
    location: row.region,
    deadline: row.deadline?.slice(0, 10),
    sourceUrl: `/opportunities/${row.id}`,
    thumbnailUrl: row.thumbnail_url,
    createdAt: row.created_at,
    artGenres: row.art_genres,
    targetAudience: row.target_audience,
    applicationStartAt: row.application_start_at?.slice(0, 10),
    isClosingSoon: isOpportunityClosingSoon(row.deadline),
  };
}

export default async function OpportunitiesPage() {
  let opportunities: any[] = [];
  try { opportunities = await listPublicOpportunities(); } catch (error) { console.error("[opportunities] public query failed", error); }
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: artist } = user ? await supabase.from("artists").select("genre, role, city_or_region, works, education, current_activity").eq("owner_id", user.id).maybeSingle() : { data: null };
  const profile = artist ? { genre: artist.genre, role: artist.role, region: artist.city_or_region, careerItemCount: [artist.works, artist.education, artist.current_activity].reduce((sum, value) => sum + (Array.isArray(value) ? value.length : 0), 0) } : null;
  return <OpportunitiesClient locale="ko" initialOpportunities={opportunities.map(mapOpportunityRow)} initialUserId={user?.id ?? null} viewerProfile={profile} />;
}
