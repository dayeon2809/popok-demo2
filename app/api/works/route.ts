import { NextRequest, NextResponse } from "next/server";
import { artists } from "@/lib/artists";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const artistId = req.nextUrl.searchParams.get("artist_id");
    
    let works: any[] = [];
    if (artistId) {
      const artist = artists.find((a) => a.id === artistId || a.recordId === artistId);
      if (artist) {
        works = (artist.works || []).map((w) => {
          const title = typeof w === "string" ? w : (w as any).title || "";
          return {
            title,
            artist_id: artist.id,
            artist_name: artist.name,
            year: null,
            role: "choreographer",
            venue: "",
            festival: "",
            source_url: "",
          };
        });
      }
    } else {
      works = artists.flatMap((a) =>
        (a.works || []).map((w) => {
          const title = typeof w === "string" ? w : (w as any).title || "";
          return {
            title,
            artist_id: a.id,
            artist_name: a.name,
            year: null,
            role: "choreographer",
            venue: "",
            festival: "",
            source_url: "",
          };
        })
      );
    }

    return NextResponse.json({ data: works, error: null }, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    console.error("[/api/works]", err);
    return NextResponse.json(
      { data: null, error: "작품 데이터를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
