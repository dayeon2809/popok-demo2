import { NextRequest, NextResponse } from "next/server";
import { getArtist } from "@/lib/artists";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function mapDbRecordToArtist(record: any) {
  const name = (record.name || "").trim();
  const recordId = String(record.id);
  const id = record.slug ? record.slug.trim() : recordId;
  const company = record.company || '';
  const bio = record.ai_summary || '';
  
  // parse works (stored as "role" column in the db as newline separated text)
  let worksList: string[] = [];
  if (record.role && typeof record.role === "string") {
    worksList = record.role.split("\n").map((w: string) => w.trim()).filter(Boolean);
  }
  
  let field = 'unknown';
  let genre = 'unknown';
  const genreVal = record.genre;
  if (typeof genreVal === 'string') {
    const parts = genreVal.split(',').map(s => s.trim());
    field = parts[0] || 'unknown';
    genre = parts[1] || 'unknown';
  }
  if (genre === 'korean dance' || genre === 'korean_dance') genre = 'korean';
  if (genre === 'contemporary dance' || genre === 'contemporary_dance') genre = 'contemporary';
  
  let instagram = '';
  let website = '';
  const attachment = record.attachment || '';
  if (attachment && typeof attachment === 'string') {
    if (attachment.includes('instagram.com')) {
      instagram = attachment;
    } else {
      website = attachment;
    }
  }

  // profile image mapping
  const profileImage = record.profile_image || '';

  const aiSummary = record.ai_summary || '';
  const reviewLinksRaw = record.review_links || '';
  const reviews: any[] = [];
  if (reviewLinksRaw && typeof reviewLinksRaw === 'string') {
    const lines = reviewLinksRaw.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      const parts = trimmedLine.split('|').map(p => p.trim());
      if (parts.length >= 3) {
        reviews.push({
          workTitle: parts[0],
          source: parts[1],
          url: parts[2]
        });
      }
    }
  }

  return {
    id,
    name,
    company: typeof company === 'string' ? company.trim() : String(company),
    bio: typeof bio === 'string' ? bio.trim() : String(bio),
    works: worksList,
    field,
    genre,
    instagram,
    website,
    profileImage,
    residency: [],
    festival: [],
    status: 'published',
    verified: true,
    aiSummary: typeof aiSummary === 'string' ? aiSummary.trim() : String(aiSummary),
    reviews,
    recordId,
    createdAt: record.created_at || new Date().toISOString(),
    updatedAt: record.updated_at || new Date().toISOString(),
    name_en: record.name_en || '',
    city_or_region: record.city_or_region || '',
    bio_short: record.bio_short || '',
    portfolio_works: record.portfolio_works || [],
    owner_user_id: record.owner_user_id || null
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id).trim();

  try {
    const supabase = getSupabaseServer();

    // 1. Try querying Supabase directly for dynamic live updates
    let dbQuery = supabase.from("artists").select("*");
    const numericId = Number(decodedId);
    if (!isNaN(numericId)) {
      dbQuery = dbQuery.or(`id.eq.${numericId},slug.eq.${decodedId},name.eq.${decodedId}`);
    } else {
      dbQuery = dbQuery.or(`slug.eq.${decodedId},name.eq.${decodedId}`);
    }

    const { data: record, error: dbErr } = await dbQuery.maybeSingle();

    if (!dbErr && record) {
      const mappedArtist = mapDbRecordToArtist(record);
      return NextResponse.json(
        { data: mappedArtist, error: null },
        { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=120" } }
      );
    }

    // 2. Fallback to cached local artists JSON to preserve robust offline support
    const artist = getArtist(decodedId);

    if (!artist) {
      return NextResponse.json(
        { data: null, error: "아티스트를 찾을 수 없습니다.", detail: `id="${decodedId}"` },
        { status: 404 }
      );
    }

    const works = artist.works || [];

    return NextResponse.json(
      { data: { ...artist, works }, error: null },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (err: any) {
    console.error(`[/api/artists/${id}] Error:`, err);
    return NextResponse.json(
      {
        data: null,
        error: "아티스트 정보를 불러오지 못했습니다.",
        detail: String(err),
      },
      { status: 500 }
    );
  }
}
