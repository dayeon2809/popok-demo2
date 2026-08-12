import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { checkAdminAuth } from "@/lib/adminAuth";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { normalizeOpportunity } from "@/lib/opportunities/normalize";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) { if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = new URL(req.url).searchParams; let query = getSupabaseServer().from("opportunities" as never).select("*").order("created_at", { ascending: false }).limit(200);
  const source = q.get("source"); const status = q.get("status");
  if (source) query = query.eq("source", source); if (status) query = query.eq("publication_status", status);
  if (q.get("search")) query = query.or(`title.ilike.%${q.get("search")?.replace(/[%_,]/g, "") }%,organization.ilike.%${q.get("search")?.replace(/[%_,]/g, "")}%`);
  const { data, error } = await query; return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ data }); }

export async function POST(req: NextRequest) { if (!checkAdminAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const body = await req.json();
  if (!body.title?.trim() || !body.organization?.trim() || !body.sourceUrl?.trim()) return NextResponse.json({ error: "제목, 기관명, 지원 링크는 필수입니다." }, { status: 400 });
  const now = new Date().toISOString(); const row = normalizeOpportunity({ source: "manual", externalId: null, sourceUrl: body.sourceUrl, canonicalSourceUrl: body.sourceUrl, originalPublisherUrl: body.sourceUrl,
    ingestionType: "manual", title: body.title, normalizedTitle: "", organization: body.organization, normalizedOrganization: "", opportunityType: body.opportunityType ?? "other",
    targetAudience: body.targetAudience ?? [], artGenres: body.artGenres ?? ["all"], region: body.region || null, summary: body.summary || null, description: body.description || null,
    applicationMethod: body.applicationMethod || null, applicationUrl: body.applicationUrl || body.sourceUrl, contact: body.contact || null, thumbnailUrl: body.thumbnailUrl || null,
    publishedAt: body.publishedAt || now, applicationStartAt: body.applicationStartAt || null, deadline: body.deadline || null, publicationStatus: body.publicationStatus ?? "draft",
    isFeatured: !!body.isFeatured, isVerified: !!body.isVerified, lastScrapedAt: null, rawData: null });
  const dbRow = { id: randomUUID(), source: row.source, external_id: row.externalId, source_url: row.sourceUrl, canonical_source_url: row.canonicalSourceUrl, original_publisher_url: row.originalPublisherUrl,
    ingestion_type: row.ingestionType, title: row.title, normalized_title: row.normalizedTitle, organization: row.organization, normalized_organization: row.normalizedOrganization,
    opportunity_type: row.opportunityType, target_audience: row.targetAudience, art_genres: row.artGenres, region: row.region, summary: row.summary, description: row.description,
    application_method: row.applicationMethod, application_url: row.applicationUrl, contact: row.contact, thumbnail_url: row.thumbnailUrl, published_at: row.publishedAt,
    application_start_at: row.applicationStartAt, deadline: row.deadline, publication_status: row.publicationStatus, review_status: row.isVerified ? "approved" : "needs_review", is_featured: row.isFeatured, is_verified: row.isVerified, raw_data: null };
  const { data, error } = await (getSupabaseServer().from("opportunities" as never) as any).insert(dbRow).select("id").single(); return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ data }, { status: 201 }); }
