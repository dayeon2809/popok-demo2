import { NextRequest, NextResponse } from "next/server";
import { getArtistById, getArtistBySlug } from "@/lib/artists";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id).trim();

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedId);
    let artist = null;

    if (isUuid) {
      artist = await getArtistById(decodedId);
    } else {
      artist = await getArtistBySlug(decodedId);
    }

    if (!artist) {
      return NextResponse.json(
        { data: null, error: "아티스트를 찾을 수 없습니다.", detail: `id="${decodedId}"` },
        { status: 404 }
      );
    }

    const works = artist.works || [];

    return NextResponse.json(
      { data: { ...artist, works }, error: null },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
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

