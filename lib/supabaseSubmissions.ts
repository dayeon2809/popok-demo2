import { getSupabaseServer } from "./supabaseServer";

export interface PortfolioWorkInput {
  title: string;
  year: string;
  description: string;
  role: string;
  image_url: string;
  video_url: string;
}

export interface SubmissionInput {
  name: string;
  email: string;
  instagram: string;
  website: string;
  bio: string;
  works: string;
  portfolio_url: string;
  name_en?: string;
  city_or_region?: string;
  bio_short?: string;
  portfolio_works?: PortfolioWorkInput[];
}

export interface Submission {
  id: string;
  name: string;
  email: string;
  instagram: string;
  website: string;
  bio: string;
  works: string;
  portfolio_url: string;
  status: string;
  submitted_at: string;
  created_at?: string | null;
  genre?: string | null;
  additional_requests?: string | null;
  profile_image_url?: string | null;
  profile_image_urls?: string[] | null;
  youtube_url?: string | null;
  youtube_preview_start?: number | null;
  youtube_preview_end?: number | null;
  name_en?: string;
  city_or_region?: string;
  bio_short?: string;
  portfolio_works?: PortfolioWorkInput[];
}

// Explicit types for Supabase submissions table
export interface SubmissionRow {
  id: number;
  name: string;
  company: string | null;
  genre: string | null;
  instagram: string | null;
  website: string | null;
  bio: string | null;
  works: string | null;
  status: string | null;
  created_at: string | null;
  email: string | null;
  portfolio_url: string | null;
  name_en: string | null;
  city_or_region: string | null;
  bio_short: string | null;
  portfolio_works: any | null;
  additional_requests: string | null;
  profile_image_url: string | null;
  profile_image_urls: string[] | null;
  youtube_url: string | null;
  youtube_preview_start: number | null;
  youtube_preview_end: number | null;
}

export interface SubmissionInsert {
  id?: number;
  name: string;
  company?: string | null;
  genre?: string | null;
  instagram?: string | null;
  website?: string | null;
  bio?: string | null;
  works?: string | null;
  status?: string | null;
  created_at?: string | null;
  email?: string | null;
  portfolio_url?: string | null;
  name_en?: string | null;
  city_or_region?: string | null;
  bio_short?: string | null;
  portfolio_works?: any | null;
}

export interface SubmissionUpdate {
  id?: number;
  name?: string;
  company?: string | null;
  genre?: string | null;
  instagram?: string | null;
  website?: string | null;
  bio?: string | null;
  works?: string | null;
  status?: string | null;
  created_at?: string | null;
  email?: string | null;
  portfolio_url?: string | null;
  name_en?: string | null;
  city_or_region?: string | null;
  bio_short?: string | null;
  portfolio_works?: any | null;
}

// Slugify helper for fallback ID
function slugify(name: string): string {
  let clean = name.replace(/[^\w가-힣\s-]/g, '').trim();
  clean = clean.replace(/[\s\t]+/g, '-');
  // Generate 8-character random string (e.g. ziohmboq)
  const suffix = Math.random().toString(36).substring(2, 10).padEnd(8, 'x').substring(0, 8);
  return `${clean}-${suffix}`.toLowerCase();
}

/**
 * Submissions 테이블에 신청 데이터 저장 (Airtable에서 Supabase로 이전)
 */
export async function createSubmission(data: SubmissionInput): Promise<{ id: string }> {
  const supabase = getSupabaseServer();
  
  const insertData: SubmissionInsert = {
    name:          data.name.trim(),
    email:         data.email.trim(),
    instagram:     data.instagram.trim(),
    website:       data.website.trim(),
    bio:           data.bio.trim(),
    works:         data.works.trim(),
    portfolio_url: data.portfolio_url.trim(),
    status:        "pending",
    name_en:       data.name_en ? data.name_en.trim() : null,
    city_or_region: data.city_or_region ? data.city_or_region.trim() : null,
    bio_short:     data.bio_short ? data.bio_short.trim() : null,
    portfolio_works: data.portfolio_works || null,
  };

  const { data: insertedData, error } = await (supabase.from("submissions") as unknown as {
    insert: (values: SubmissionInsert) => {
      select: (columns: string) => {
        single: () => Promise<{ data: { id: number } | null; error: any }>
      }
    }
  })
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("[createSubmission] Error inserting to Supabase:", error);
    throw error;
  }
  
  if (!insertedData) {
    throw new Error("Failed to retrieve inserted submission ID");
  }
  
  return { id: String(insertedData.id) };
}

/**
 * Submissions 테이블 목록 조회 (생성일 내림차순 정렬)
 */
export async function getSubmissions(): Promise<Submission[]> {
  const supabase = getSupabaseServer();
  
  const { data, error } = await (supabase.from("submissions") as unknown as {
    select: (columns: string) => {
      order: (column: string, options: { ascending: boolean }) => Promise<{ data: SubmissionRow[] | null; error: any }>
    }
  })
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getSubmissions] Error fetching from Supabase:", error);
    throw error;
  }

  return (data || []).map((row: SubmissionRow) => ({
    id:            String(row.id),
    name:          row.name || "",
    email:         row.email || "",
    instagram:     row.instagram || "",
    website:       row.website || "",
    bio:           row.bio || "",
    works:         row.works || "",
    portfolio_url: row.portfolio_url || "",
    status:        row.status || "pending",
    submitted_at:  row.created_at || "",
    created_at:    row.created_at || "",
    genre:         row.genre || undefined,
    additional_requests: row.additional_requests || undefined,
    profile_image_url: row.profile_image_url || undefined,
    profile_image_urls: row.profile_image_urls || undefined,
    youtube_url:   row.youtube_url || undefined,
    youtube_preview_start: row.youtube_preview_start ?? undefined,
    youtube_preview_end: row.youtube_preview_end ?? undefined,
    name_en:       row.name_en || undefined,
    city_or_region: row.city_or_region || undefined,
    bio_short:     row.bio_short || undefined,
    portfolio_works: row.portfolio_works || undefined,
  }));
}

/**
 * Submission 상태 업데이트
 */
export async function updateSubmissionStatus(id: string, status: string): Promise<void> {
  const supabase = getSupabaseServer();
  
  const updatePayload: SubmissionUpdate = { status };

  const { error } = await (supabase.from("submissions") as unknown as {
    update: (values: SubmissionUpdate) => {
      eq: (column: string, value: any) => Promise<{ error: any }>
    }
  })
    .update(updatePayload)
    .eq("id", Number(id));

  if (error) {
    console.error("[updateSubmissionStatus] Error updating status in Supabase:", error);
    throw error;
  }
}

/**
 * Submission 데이터 수정
 */
export async function updateSubmission(id: string, fields: Partial<SubmissionInput>): Promise<void> {
  const supabase = getSupabaseServer();
  
  const updateData: SubmissionUpdate = {};
  if (fields.name !== undefined) updateData.name = fields.name.trim();
  if (fields.email !== undefined) updateData.email = fields.email.trim();
  if (fields.instagram !== undefined) updateData.instagram = fields.instagram.trim();
  if (fields.website !== undefined) updateData.website = fields.website.trim();
  if (fields.works !== undefined) updateData.works = fields.works.trim();
  if (fields.portfolio_url !== undefined) updateData.portfolio_url = fields.portfolio_url.trim();
  if (fields.bio !== undefined) updateData.bio = fields.bio.trim();
  if (fields.name_en !== undefined) updateData.name_en = fields.name_en.trim();
  if (fields.city_or_region !== undefined) updateData.city_or_region = fields.city_or_region.trim();
  if (fields.bio_short !== undefined) updateData.bio_short = fields.bio_short.trim();
  if (fields.portfolio_works !== undefined) updateData.portfolio_works = fields.portfolio_works;

  const { error } = await (supabase.from("submissions") as unknown as {
    update: (values: SubmissionUpdate) => {
      eq: (column: string, value: any) => Promise<{ error: any }>
    }
  })
    .update(updateData)
    .eq("id", Number(id));

  if (error) {
    console.error("[updateSubmission] Error updating submission in Supabase:", error);
    throw error;
  }
}

export interface ArtistInsert {
  name: string;
  company?: string;
  role?: string;
  genre?: string;
  attachment?: string;
  slug: string;
  email?: string | null;
  name_en?: string | null;
  city_or_region?: string | null;
  bio_short?: string | null;
  portfolio_works?: any | null;
}

/**
 * 제출 정보를 통해 아티스트를 생성
 */
export async function createArtistFromSubmission(data: {
  name: string;
  company?: string;
  works: string[];
  field?: string;
  genre?: string;
  instagram?: string;
  website?: string;
  email?: string;
  name_en?: string;
  city_or_region?: string;
  bio_short?: string;
  portfolio_works?: PortfolioWorkInput[];
}): Promise<{ id: string }> {
  const supabase = getSupabaseServer();
  
  const roleValue = data.works.map(w => `<${w.trim()}>`).join(", ");
  
  const genres = [data.field || "dance", data.genre || "contemporary"].filter(Boolean);
  const genreValue = genres.join(",");

  const attachmentValue = (data.instagram || data.website || "").trim();

  const slugValue = slugify(data.name.trim());

  const insertPayload: ArtistInsert = {
    name:       data.name.trim(),
    company:    (data.company ?? "").trim(),
    role:       roleValue,
    genre:      genreValue,
    attachment: attachmentValue,
    slug:       slugValue,
    email:      data.email ? data.email.trim() : null,
    name_en:    data.name_en ? data.name_en.trim() : null,
    city_or_region: data.city_or_region ? data.city_or_region.trim() : null,
    bio_short:  data.bio_short ? data.bio_short.trim() : null,
    portfolio_works: data.portfolio_works || null,
  };

  const { data: insertedArtist, error } = await (supabase.from("artists") as unknown as {
    insert: (values: ArtistInsert) => {
      select: (columns: string) => {
        single: () => Promise<{ data: { id: any } | null; error: any }>
      }
    }
  })
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    console.error("[createArtistFromSubmission] Error inserting artist to Supabase:", error);
    throw error;
  }

  if (!insertedArtist) {
    throw new Error("Failed to retrieve inserted artist ID");
  }

  return { id: String(insertedArtist.id) };
}
