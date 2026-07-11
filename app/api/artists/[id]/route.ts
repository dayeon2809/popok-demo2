import { NextRequest, NextResponse } from "next/server";
import { getArtist } from "@/lib/artists";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function mapDbRecordToArtist(record: any) {
  const name = (record.name || "").trim();
  const recordId = String(record.id); // artists.id는 uuid — 문자열 그대로 다룬다
  const id = record.slug ? record.slug.trim() : recordId;
  const company = record.company || '';
  // ai_summary 컬럼은 더 이상 존재하지 않음 — bio / bio_short를 소개글 소스로 사용한다.
  const bio = record.bio || record.bio_short || '';

  // works는 jsonb 컬럼 — 항상 배열로 정규화 (portfolio_works 컬럼은 더 이상 존재하지 않음)
  const dbWorks: any[] = Array.isArray(record.works) ? record.works : [];

  // parse works (stored as "role" column in the db as newline separated text)
  let worksList: string[] = [];
  if (record.role && typeof record.role === "string") {
    worksList = record.role.split(/,|\n/).map((w: string) => w.replace(/[<>]/g, "").trim()).filter(Boolean);
  }
  if (worksList.length === 0 && dbWorks.length > 0) {
    worksList = dbWorks.map((pw: any) => pw.title || pw).filter(Boolean);
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

  // attachment 컬럼은 더 이상 존재하지 않음 — instagram / website 분리 컬럼을 그대로 사용한다.
  const instagram = record.instagram || '';
  const website = record.website || '';

  // profile image mapping — profile_image_url 컬럼을 최우선으로 사용
  let profileImage = record.profile_image_url || '';
  if (!profileImage && Array.isArray(record.profile_image_urls) && record.profile_image_urls[0]) {
    profileImage = record.profile_image_urls[0];
  } else if (!profileImage && dbWorks[0]?.image_url) {
    profileImage = dbWorks[0].image_url;
  }

  const aiSummary = bio;
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
    works: dbWorks,
    field,
    genre,
    instagram,
    website,
    profileImage,
    profile_image_urls: Array.isArray(record.profile_image_urls) ? record.profile_image_urls : [],
    motion_video_url: record.motion_video_url || null,
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
    portfolio_works: dbWorks,
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
    // artists.id는 uuid 컬럼이므로, decodedId가 실제 uuid 형식일 때만 id 비교를 포함한다.
    // (uuid가 아닌 문자열을 id.eq.에 넣으면 PostgREST가 타입 캐스팅 오류를 던진다.)
    let dbQuery = supabase.from("artists").select("*");
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);
    if (isUuid) {
      dbQuery = dbQuery.or(`id.eq.${decodedId},slug.eq.${decodedId},name.eq.${decodedId}`);
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
