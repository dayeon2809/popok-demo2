import { NextRequest, NextResponse } from "next/server";
import { searchArtists } from "@/lib/artists";
import { getSupabaseServer } from "@/lib/supabaseServer";
import type { ArtistField, ArtistType } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const query = searchParams.get("query") ?? "";
    const type  = (searchParams.get("type")  ?? "all") as any;
    const field = (searchParams.get("field") ?? "all") as any;

    // 1. Fetch dynamic approved artists from Supabase DB
    const supabase = getSupabaseServer();
    const { data: dbArtists, error: dbErr } = await (supabase.from("artists" as any) as any)
      .select("*")
      .eq("status", "published");

    const mappedDbArtists: any[] = [];
    if (!dbErr && dbArtists) {
      dbArtists.forEach((record: any) => {
        // Parse category from genre: "dance,contemporary" -> field="dance", genre="contemporary"
        let fValue = "dance";
        let gValue = "contemporary";
        if (record.genre && typeof record.genre === "string") {
          const parts = record.genre.split(",").map((s: string) => s.trim());
          fValue = parts[0] || "dance";
          gValue = parts[1] || "contemporary";
        }

        // works는 jsonb 컬럼 — 항상 배열로 정규화 (portfolio_works 컬럼은 더 이상 존재하지 않음)
        const dbWorks: any[] = Array.isArray(record.works) ? record.works : [];

        // Works titles array
        let worksList: string[] = [];
        if (record.role && typeof record.role === "string") {
          worksList = record.role.split(",").map((w: string) => w.replace(/[<>]/g, "").trim()).filter(Boolean);
        } else {
          worksList = dbWorks.map((pw: any) => pw.title).filter(Boolean);
        }

        // Main Profile Image mapping — profile_image_url 컬럼을 최우선으로 사용
        let profileImage = record.profile_image_url || "";
        if (!profileImage && Array.isArray(record.profile_image_urls) && record.profile_image_urls[0]) {
          profileImage = record.profile_image_urls[0];
        } else if (!profileImage && dbWorks[0]?.image_url) {
          profileImage = dbWorks[0].image_url;
        }

        mappedDbArtists.push({
          id: record.slug || String(record.id),
          recordId: String(record.id),
          name: record.name,
          name_en: record.name_en || null,
          company: record.company || null,
          bio: record.bio_short || record.bio || `${record.name} 작가의 공식 POPOK 디지털 명함 카드 페이지입니다.`,
          bio_short: record.bio_short || null,
          works: worksList,
          field: fValue,
          genre: gValue,
          role: record.role || `${fValue} 아티스트`,
          type: record.artist_type || "individual",
          instagram: record.instagram || "",
          website: record.website || "",
          profileImage: profileImage || "/images/placeholders/cake-placeholder.png",
          residency: [],
          festival: [],
          status: "published",
          verified: true,
          aiSummary: record.bio_short || "",
          reviews: [],
          isDemo: !!record.is_demo,
          tags: [fValue === "dance" ? "무용" : fValue === "music" ? "음악" : "시각예술", gValue, "검증됨"].filter(Boolean)
        });
      });
    }

    // Apply Filters to DB Artists
    let filteredDbArtists = mappedDbArtists;

    if (type !== "all") {
      filteredDbArtists = filteredDbArtists.filter(a => a.type === type);
    }

    if (field !== "all") {
      filteredDbArtists = filteredDbArtists.filter(a => {
        const f = a.field || "dance";
        if (field === "dance") {
          return f === "dance" || f === "contemporary_dance" || f === "korean_dance" || f === "ballet" || f === "interdisciplinary";
        }
        if (field === "music") return f === "music";
        if (field === "visual") return f === "visual";
        
        // Sub-genres
        if (field === "contemporary") return a.genre === "contemporary" || a.genre === "contemporary_dance";
        if (field === "ballet") return a.genre === "ballet";
        if (field === "korean") return a.genre === "korean" || a.genre === "traditional" || a.genre === "korean_dance";
        
        return f === field || a.genre === field;
      });
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      filteredDbArtists = filteredDbArtists.filter(
        a =>
          a.name.toLowerCase().includes(q) ||
          a.name_en?.toLowerCase().includes(q) ||
          a.company?.toLowerCase().includes(q) ||
          a.bio?.toLowerCase().includes(q) ||
          a.genre?.toLowerCase().includes(q) ||
          a.role?.toLowerCase().includes(q)
      );
    }

    // 2. Fetch local JSON + Demo artists
    const localArtists = searchArtists(query, type, field);

    // 3. Merge both sets and deduplicate (Supabase first, slug/id based)
    const merged: any[] = [...filteredDbArtists];
    localArtists.forEach(la => {
      const isDup = merged.some(ma => {
        if (ma.id && la.id && ma.id === la.id) return true;
        if (ma.recordId && la.recordId && ma.recordId === la.recordId) return true;
        return ma.name.trim() === la.name.trim();
      });
      if (!isDup) {
        merged.push(la);
      }
    });

    return NextResponse.json({ data: merged, error: null }, {
      headers: { "Cache-Control": "s-maxage=10, stale-while-revalidate=60" }, // Low cache to see DB publish immediately
    });
  } catch (err) {
    console.error("[/api/artists]", err);
    return NextResponse.json(
      { data: null, error: "아티스트 데이터를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
