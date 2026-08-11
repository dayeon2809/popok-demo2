import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const artistId = req.nextUrl.searchParams.get("artist_id");
    const supabase = getSupabaseServer();

    let works: any[] = [];
    if (artistId) {
      const showDraft = process.env.NEXT_PUBLIC_SHOW_DRAFT_ARTISTS === "true";
      let dbQuery = supabase
        .from("artists")
        .select("id, name, slug, works, status");
      
      if (!showDraft) {
        dbQuery = dbQuery.eq("status", "published");
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(artistId);
      if (isUuid) {
        dbQuery = dbQuery.or(`id.eq.${artistId},slug.eq.${artistId},name.eq.${artistId}`);
      } else {
        dbQuery = dbQuery.or(`slug.eq.${artistId},name.eq.${artistId}`);
      }

      const { data: record, error: dbErr } = (await dbQuery.maybeSingle()) as any;

      if (!dbErr && record) {
        const dbWorks = Array.isArray(record.works) ? record.works : [];
        const artistIdVal = record.slug || String(record.id);
        works = dbWorks.map((w: any) => {
          const title = typeof w === "string" ? w : w?.title || "";
          return {
            title,
            artist_id: artistIdVal,
            artist_name: record.name,
            year: typeof w === "object" ? w?.year || null : null,
            role: typeof w === "object" ? w?.role || "choreographer" : "choreographer",
            venue: typeof w === "object" ? w?.venue || "" : "",
            festival: typeof w === "object" ? w?.festival || "" : "",
            source_url: typeof w === "object" ? w?.source_url || "" : "",
          };
        });
      }
    } else {
      const showDraft = process.env.NEXT_PUBLIC_SHOW_DRAFT_ARTISTS === "true";
      let dbQuery = supabase
        .from("artists")
        .select("id, name, slug, works, status");
      
      if (!showDraft) {
        dbQuery = dbQuery.eq("status", "published");
      }

      const { data: records, error: dbErr } = (await dbQuery) as any;

      if (!dbErr && records) {
        works = records.flatMap((record: any) => {
          const dbWorks = Array.isArray(record.works) ? record.works : [];
          const artistIdVal = record.slug || String(record.id);
          return dbWorks.map((w: any) => {
            const title = typeof w === "string" ? w : w?.title || "";
            return {
              title,
              artist_id: artistIdVal,
              artist_name: record.name,
              year: typeof w === "object" ? w?.year || null : null,
              role: typeof w === "object" ? w?.role || "choreographer" : "choreographer",
              venue: typeof w === "object" ? w?.venue || "" : "",
              festival: typeof w === "object" ? w?.festival || "" : "",
              source_url: typeof w === "object" ? w?.source_url || "" : "",
            };
          });
        });
      }
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

