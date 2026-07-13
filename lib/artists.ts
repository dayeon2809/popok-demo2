import { getSupabaseServer } from "./supabaseServer";
import type { Artist, ArtistFilter } from "@/types";

export function mapArtistRowToArtist(record: any): Artist {
  if (!record) return {} as Artist;

  // Parse category from genre: "dance,contemporary" -> field="dance", genre="contemporary"
  let fValue = "dance";
  let gValue = "contemporary";
  if (record.genre && typeof record.genre === "string") {
    const parts = record.genre.split(",").map((s: string) => s.trim());
    fValue = parts[0] || "dance";
    gValue = parts[1] || "contemporary";
  }

  // works는 jsonb 컬럼 — 항상 배열로 정규화
  const dbWorks: any[] = Array.isArray(record.works) ? record.works : [];

  // Main Profile Image mapping — profile_image_url 컬럼을 최우선으로 사용
  let profileImage = record.profile_image_url || "";
  if (!profileImage && Array.isArray(record.profile_image_urls) && record.profile_image_urls[0]) {
    profileImage = record.profile_image_urls[0];
  } else if (!profileImage && dbWorks[0]?.image_url) {
    profileImage = dbWorks[0].image_url;
  }

  // Parse review links
  const reviewLinksRaw = record.review_links || "";
  const reviews: any[] = [];
  if (reviewLinksRaw && typeof reviewLinksRaw === "string") {
    const lines = reviewLinksRaw.split("\n");
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      const parts = trimmedLine.split("|").map(p => p.trim());
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
    id: record.slug || String(record.id),
    recordId: String(record.id),
    name: record.name || "",
    name_en: record.name_en || null,
    /** @deprecated Deletion candidate in future database migration */
    company: record.company || null,
    bio: record.bio || record.bio_short || `${record.name} 작가의 공식 POPOK 디지털 명함 카드 페이지입니다.`,
    bio_short: record.bio_short || null,
    works: dbWorks,
    field: fValue,
    genre: gValue,
    role: record.role || `${fValue} 아티스트`,
    /** @deprecated Deletion candidate in future database migration */
    type: record.artist_type || (record.role?.includes("단체") || record.company ? "group" : "individual"),
    instagram: record.instagram || "",
    website: record.website || "",
    profileImage: profileImage || "/images/placeholders/cake-placeholder.png",
    profile_image_urls: Array.isArray(record.profile_image_urls) ? record.profile_image_urls : [],
    motion_video_url: record.motion_video_url || null,
    residency: [],
    festival: [],
    status: record.status || "published",
    verified: !!record.verified,
    aiSummary: record.bio_short || "",
    reviews: reviews,
    isDemo: !!record.is_demo,
    createdAt: record.created_at || new Date().toISOString(),
    updatedAt: record.updated_at || new Date().toISOString(),
    city_or_region: record.city_or_region || "",
    tags: [fValue === "dance" ? "무용" : fValue === "music" ? "음악" : "시각예술", gValue, "검증됨"].filter(Boolean)
  } as any;
}

export async function getArtists(): Promise<Artist[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.from("artists" as any).select("*");
  if (error) {
    console.error("[getArtists] Supabase error:", error);
    return [];
  }
  return (data || []).map(mapArtistRowToArtist);
}

export async function getPublishedArtists(): Promise<Artist[]> {
  const supabase = getSupabaseServer();
  const showDraft = process.env.NEXT_PUBLIC_SHOW_DRAFT_ARTISTS === "true";

  let dbQuery = supabase.from("artists" as any).select("*");
  if (!showDraft) {
    dbQuery = dbQuery.eq("status", "published");
  }

  const { data, error } = await dbQuery;
  if (error) {
    console.error("[getPublishedArtists] Supabase error:", error);
    return [];
  }
  return (data || []).map(mapArtistRowToArtist);
}

export async function getArtistBySlug(slug: string): Promise<Artist | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("artists" as any)
    .select("*")
    .or(`slug.eq.${slug},name.eq.${slug}`)
    .maybeSingle();
  if (error) {
    console.error("[getArtistBySlug] Supabase error:", error);
    return null;
  }
  return data ? mapArtistRowToArtist(data) : null;
}

export async function getArtistById(id: string): Promise<Artist | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("artists" as any)
    .select("*")
    .or(`id.eq.${id},slug.eq.${id},name.eq.${id}`)
    .maybeSingle();
  if (error) {
    console.error("[getArtistById] Supabase error:", error);
    return null;
  }
  return data ? mapArtistRowToArtist(data) : null;
}


export async function searchArtists(
  query: string,
  typeFilter?: string,
  fieldFilter?: string
): Promise<Artist[]> {
  let list = await getPublishedArtists();

  if (typeFilter && typeFilter !== "all") {
    list = list.filter(a => {
      const type = a.type || (a.company ? "group" : "individual");
      if (typeFilter === "individual") {
        return type === "individual";
      }
      if (typeFilter === "group") {
        return type === "company" || type === "project_group" || type === "group";
      }
      return true;
    });
  }

  if (fieldFilter && fieldFilter !== "all") {
    list = list.filter(a => {
      const field = a.field || "dance";
      if (fieldFilter === "dance") {
        return field === "dance" || field === "contemporary_dance" || field === "korean_dance" || field === "ballet" || field === "interdisciplinary";
      }
      if (fieldFilter === "music") return field === "music";
      if (fieldFilter === "visual") return field === "visual";

      // Sub-genres
      if (fieldFilter === "contemporary") return a.genre === "contemporary" || a.genre === "contemporary_dance";
      if (fieldFilter === "ballet") return a.genre === "ballet";
      if (fieldFilter === "korean") return a.genre === "korean" || a.genre === "traditional" || a.genre === "korean_dance";

      return field === fieldFilter || a.genre === fieldFilter;
    });
  }

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    list = list.filter(
      a =>
        a.name.toLowerCase().includes(q) ||
        a.name_en?.toLowerCase().includes(q) ||
        a.company?.toLowerCase().includes(q) ||
        a.bio?.toLowerCase().includes(q) ||
        a.genre?.toLowerCase().includes(q) ||
        a.role?.toLowerCase().includes(q)
    );
  }

  return list;
}
