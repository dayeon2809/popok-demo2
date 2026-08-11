import { NextRequest, NextResponse } from "next/server";
import { getArtistById, getArtistBySlug } from "@/lib/artists";
import { getUpcomingPerformancesByArtistId } from "@/lib/performances";

export const dynamic = "force-dynamic";

// GET — upcoming published performances linked to this artist via
// performance_artists, for the artist detail page's "Upcoming Performance"
// section. Mirrors app/api/artists/[id]/route.ts's uuid-vs-slug resolution
// so this accepts the same id the page itself is already loaded with.
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

    const performances = await getUpcomingPerformancesByArtistId(artist.recordId);
    return NextResponse.json({ data: performances, error: null });
  } catch (err: any) {
    console.error(`[/api/artists/${id}/upcoming-performances] Error:`, err);
    return NextResponse.json({ data: [], error: "공연 정보를 불러오지 못했습니다." }, { status: 500 });
  }
}
