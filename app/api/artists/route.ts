import { NextRequest, NextResponse } from "next/server";
import { searchArtists } from "@/lib/artists";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const query = searchParams.get("query") ?? "";
    const type  = searchParams.get("type")  ?? "all";
    const field = searchParams.get("field") ?? "all";

    const data = await searchArtists(query, type, field);

    return NextResponse.json({ data, error: null }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" }, // Supabase 수정이 CDN/브라우저 캐시 없이 즉시 반영되도록
    });
  } catch (err) {
    console.error("[/api/artists]", err);
    return NextResponse.json(
      { data: null, error: "아티스트 데이터를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

