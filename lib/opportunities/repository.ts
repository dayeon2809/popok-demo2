import { getSupabaseServer } from "@/lib/supabaseServer";
import { selectRepresentativeOpportunities } from "./ingestion";

const PUBLIC_COLUMNS = "id, source, external_id, source_url, canonical_source_url, original_publisher_url, title, normalized_title, organization, normalized_organization, opportunity_type, target_audience, art_genres, region, summary, application_url, thumbnail_url, published_at, application_start_at, deadline, is_featured, is_verified, review_status, created_at";

export async function listPublicOpportunities(limit = 500) {
  const { data, error } = await getSupabaseServer().from("opportunities" as never).select(PUBLIC_COLUMNS)
    .eq("publication_status", "published").eq("is_verified", true).eq("review_status", "approved").order("is_featured", { ascending: false }).order("deadline", { ascending: true, nullsFirst: false }).limit(limit);
  if (error) throw error;
  const rows=(data??[]) as any[]; const comparable=rows.map((row)=>({id:row.id,source:row.source,externalId:row.external_id,canonicalSourceUrl:row.canonical_source_url,normalizedOrganization:row.normalized_organization,normalizedTitle:row.normalized_title,deadline:row.deadline,isFeatured:row.is_featured,isVerified:row.is_verified,publishedAt:row.published_at}));
  const representativeIds=new Set(selectRepresentativeOpportunities(comparable).map((row)=>row.id)); return rows.filter((row)=>representativeIds.has(row.id));
}

export async function getPublicOpportunity(id: string) {
  const { data, error } = await getSupabaseServer().from("opportunities" as never).select(`${PUBLIC_COLUMNS}, description, application_method, contact`)
    .eq("id", id).eq("publication_status", "published").eq("is_verified", true).eq("review_status", "approved").maybeSingle();
  if (error) throw error; return data;
}
