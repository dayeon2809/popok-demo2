import { getSupabaseServer } from "./supabaseServer";
import type { ParsedArtistProfile, ParserStatus } from "./parsedProfile";

export interface Submission {
  id: string;
  name: string;
  email: string;
  instagram: string;
  genre?: string | null;
  status: string;
  submitted_at: string;
  created_at?: string | null;
  additional_requests?: string | null;
  profile_image_url?: string | null;
  profile_image_urls?: string[] | null;
  motion_video_url?: string | null;
  bio_short?: string | null;
  works?: any | null;
  claim_code?: string | null;
  public_slug?: string | null;
  parsed_profile?: ParsedArtistProfile | null;
  parsed_at?: string | null;
  parser_status?: ParserStatus;
  parser_error?: string | null;
}

// Explicit type for the Supabase submissions table (columns as they actually exist)
interface SubmissionRow {
  id: number;
  created_at: string | null;
  updated_at: string | null;
  status: string | null;
  name: string;
  email: string | null;
  instagram: string | null;
  genre: string | null;
  bio_short: string | null;
  profile_image_url: string | null;
  motion_video_url: string | null;
  works: any | null;
  additional_requests: string | null;
  claim_code: string | null;
  public_slug: string | null;
  profile_image_urls: string[] | null;
  parsed_profile: ParsedArtistProfile | null;
  parsed_at: string | null;
  parser_status: ParserStatus | null;
  parser_error: string | null;
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
    genre:         row.genre || undefined,
    status:        row.status || "pending",
    submitted_at:  row.created_at || "",
    created_at:    row.created_at || "",
    additional_requests: row.additional_requests || undefined,
    profile_image_url: row.profile_image_url || undefined,
    profile_image_urls: row.profile_image_urls || undefined,
    motion_video_url: row.motion_video_url || undefined,
    bio_short:     row.bio_short || undefined,
    works:         row.works || undefined,
    claim_code:    row.claim_code || undefined,
    public_slug:   row.public_slug || undefined,
    parsed_profile: row.parsed_profile || null,
    parsed_at:     row.parsed_at || null,
    parser_status: row.parser_status || "not_parsed",
    parser_error:  row.parser_error || null,
  }));
}
