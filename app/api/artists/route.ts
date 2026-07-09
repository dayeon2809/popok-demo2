import { NextRequest, NextResponse } from "next/server";
import { searchArtists } from "@/lib/artists";
import type { ArtistField, ArtistType } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const query = searchParams.get("query") ?? "";
    const type  = (searchParams.get("type")  ?? "all") as ArtistType | "all";
    const field = (searchParams.get("field") ?? "all") as ArtistField | "all";

    const artists = searchArtists(query, type, field);

    return NextResponse.json({ data: artists, error: null }, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    console.error("[/api/artists]", err);
    return NextResponse.json(
      { data: null, error: "아티스트 데이터를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
