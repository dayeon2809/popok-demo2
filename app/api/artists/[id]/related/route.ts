import { NextRequest, NextResponse } from "next/server";
import { getArtistById, getArtistBySlug, getRelatedArtists } from "@/lib/artists";

export const dynamic = "force-dynamic";

// GET — up to 3 other published artists, for the artist detail page's
// "더 탐색할 예술가들" section. Mirrors app/api/artists/[id]/route.ts's
// uuid-vs-slug resolution so this accepts the same id the page is loaded with.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id).trim();

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);
    const artist = isUuid ? await getArtistById(decodedId) : await getArtistBySlug(decodedId);

    if (!artist || !artist.recordId) {
      return NextResponse.json({ data: [], error: null });
    }

    const related = await getRelatedArtists(artist.recordId, 3);
    return NextResponse.json({ data: related, error: null });
  } catch (err: any) {
    console.error(`[/api/artists/${id}/related] Error:`, err);
    return NextResponse.json({ data: [], error: "관련 아티스트를 불러오지 못했습니다." }, { status: 500 });
  }
}
