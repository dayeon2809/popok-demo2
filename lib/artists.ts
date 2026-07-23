import fs from "fs";
import path from "path";
import { getSupabaseServer } from "./supabaseServer";
import type { Artist, ArtistFilter } from "@/types";

export function mapArtistRowToArtist(record: any): Artist {
  if (!record) return {} as Artist;

  // Parse category from genre: "dance,contemporary" -> field="dance", genre="contemporary"
  let fValue = "dance";
  let gValue = "contemporary";
  if (record.genre && typeof record.genre === "string") {
    const parts = record.genre.split(",").map((s: string) => s.trim());
    if (parts.length > 1) {
      fValue = parts[0] || "dance";
      gValue = parts[1] || "contemporary";
    } else {
      const val = parts[0] || "";
      const lowerVal = val.toLowerCase();
      // Onboarding's genre picker (app/onboarding/OnboardingClient.tsx's
      // GENRE_OPTIONS) saves the raw Korean label as-is ("한국무용", "발레",
      // "현대무용") rather than an English slug — normalize it to the same
      // canonical dance sub-genre slugs filterArtists() below compares
      // against, or artists picking "한국무용"/"발레" never match the
      // KOREAN DANCE / BALLET sub-filters on /artists. Order matters here:
      // "한국무용" contains "무용", so the Korean-dance check must run
      // before the generic contemporary/무용 check below.
      if (lowerVal.includes("한국") || lowerVal.includes("korean") || lowerVal.includes("전통") || lowerVal.includes("traditional")) {
        fValue = "dance";
        gValue = "korean_dance";
      } else if (lowerVal.includes("발레") || lowerVal.includes("ballet")) {
        fValue = "dance";
        gValue = "ballet";
      } else if (
        lowerVal.includes("무용") ||
        lowerVal.includes("현대") ||
        lowerVal.includes("dance") ||
        lowerVal.includes("contemporary")
      ) {
        fValue = "dance";
        gValue = "contemporary_dance";
      } else if (lowerVal.includes("음악") || lowerVal.includes("music") || lowerVal.includes("composition")) {
        fValue = "music";
        gValue = val;
      } else if (lowerVal.includes("미술") || lowerVal.includes("시각") || lowerVal.includes("visual") || lowerVal.includes("art")) {
        fValue = "visual";
        gValue = val;
      } else {
        fValue = "dance";
        gValue = val;
      }
    }
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
    slug: record.slug || record.id || "",
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
    profileImage: profileImage || "",
    profile_image_url: record.profile_image_url || null,
    profile_image_urls: Array.isArray(record.profile_image_urls) ? record.profile_image_urls : [],
    motion_video_url: record.motion_video_url || null,
    youtube_url: record.youtube_url || null,
    affiliations: Array.isArray(record.affiliations) ? record.affiliations : [],
    education: Array.isArray(record.education) ? record.education : [],
    awards: Array.isArray(record.awards) ? record.awards : [],
    competitions: Array.isArray(record.competitions) ? record.competitions : [],
    links: Array.isArray(record.links) ? record.links : [],
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
    category: record.category || null,
    current_activity: record.current_activity ?? null,
    review_links: record.review_links ?? null,
    portfolio_url: record.portfolio_url || null,
    tags: [fValue === "dance" ? "무용" : fValue === "music" ? "음악" : "시각예술", gValue, "검증됨"].filter(Boolean),
    view_count: typeof record.view_count === "number" ? record.view_count : 0,
  } as any;
}

function getDemoArtists(): Artist[] {
  try {
    const filePath = path.join(process.cwd(), "data", "artists.json");
    if (!fs.existsSync(filePath)) return [];
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(fileContent);
    const demoItems = parsed.filter((a: any) => a.id === "kim-boram" || a.id === "ahn-eunmi");
    return demoItems.map((item: any) => {
      return {
        id: item.id,
        recordId: item.recordId || item.id,
        name: item.name || "",
        name_en: item.name_en || null,
        company: item.company || null,
        bio: item.bio || "",
        bio_short: item.bio_short || null,
        works: Array.isArray(item.works) ? item.works.map((w: any) => ({
          id: w.id || String(Math.random()),
          title: w.title || "",
          year: w.year || null,
          description: w.description || "",
          role: w.role || "",
          image_url: w.image_url || "",
          video_url: w.video_url || ""
        })) : [],
        field: item.field || "dance",
        genre: item.genre || "contemporary",
        role: item.role || (item.field === "dance" ? "현대무용 안무가" : "아티스트"),
        type: item.type || "company",
        instagram: item.instagram || "",
        website: item.website || "",
        profileImage: item.profileImage || "",
        profile_image_url: item.profile_image_url || item.profileImage || null,
        profile_image_urls: Array.isArray(item.profile_image_urls) ? item.profile_image_urls : [],
        motion_video_url: item.motion_video_url || (item.id === "kim-boram" ? "https://www.youtube.com/watch?v=3P1CnWI62Ik" : null),
        youtube_url: item.youtube_url || (item.id === "kim-boram" ? "https://www.youtube.com/watch?v=3P1CnWI62Ik" : null),
        affiliations: Array.isArray(item.affiliations) ? item.affiliations : [],
        education: Array.isArray(item.education) ? item.education : [],
        awards: Array.isArray(item.awards) ? item.awards : [],
        competitions: Array.isArray(item.competitions) ? item.competitions : [],
        links: Array.isArray(item.links) ? item.links : [],
        residency: [],
        festival: [],
        status: "published",
        verified: true,
        aiSummary: item.aiSummary || "",
        reviews: Array.isArray(item.reviews) ? item.reviews : [],
        isDemo: true,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
        city_or_region: item.city_or_region || "",
        tags: ["무용", "현대무용", "데모", "검증됨"]
      } as Artist;
    });
  } catch (e) {
    console.error("Failed to load demo artists from JSON:", e);
    return [];
  }
}

export async function getArtists(): Promise<Artist[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.from("artists" as any).select("*");
  const dbArtists = error ? [] : (data || []).map(mapArtistRowToArtist);
  const demoArtists = getDemoArtists();
  const filteredDemos = demoArtists.filter(d => !dbArtists.some(db => db.id === d.id));
  return [...dbArtists, ...filteredDemos];
}

export async function getPublishedArtists(): Promise<Artist[]> {
  const supabase = getSupabaseServer();
  const showDraft = process.env.NEXT_PUBLIC_SHOW_DRAFT_ARTISTS === "true";

  let dbQuery = supabase.from("artists" as any).select("*");
  if (!showDraft) {
    dbQuery = dbQuery.eq("status", "published");
  }
  // Individual-only: organizations now live in public.companies (see
  // lib/companies.ts) and are browsed via /companies, not /artists or the
  // homepage carousel. artists.artist_type is unset for every current row,
  // so a plain .neq("artist_type", "organization") would wrongly exclude
  // them too (NULL <> 'organization' evaluates to NULL/false in Postgres) —
  // the OR explicitly keeps null (treated as individual) alongside any
  // non-organization value. This is a distinct concept from the legacy
  // `type`/ArtistType content filter (individual vs. group act) used by the
  // "ALL TYPES / INDIVIDUAL / GROUP·TEAM" pills on /artists — that stays untouched.
  dbQuery = dbQuery.or("artist_type.is.null,artist_type.neq.organization");

  const { data, error } = await dbQuery;
  const dbArtists = error ? [] : (data || []).map(mapArtistRowToArtist);
  const demoArtists = getDemoArtists();
  const filteredDemos = demoArtists.filter(d => !dbArtists.some(db => db.id === d.id));
  return [...dbArtists, ...filteredDemos];
}

export async function getArtistBySlug(slug: string): Promise<Artist | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("artists" as any)
    .select("*")
    .or(`slug.eq.${slug},name.eq.${slug}`)
    .maybeSingle();
  if (data) return mapArtistRowToArtist(data);

  const demoArtists = getDemoArtists();
  return demoArtists.find(d => d.slug === slug || d.name === slug || d.id === slug) || null;
}

export async function getArtistById(id: string): Promise<Artist | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("artists" as any)
    .select("*")
    .or(`id.eq.${id},slug.eq.${id},name.eq.${id}`)
    .maybeSingle();
  if (data) return mapArtistRowToArtist(data);

  const demoArtists = getDemoArtists();
  return demoArtists.find(d => d.id === id || d.slug === id || d.name === id) || null;
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
