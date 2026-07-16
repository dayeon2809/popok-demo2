export type ArtistType = "individual" | "company" | "project_group" | "group";
export type ArtistField =
  | "contemporary_dance"
  | "ballet"
  | "korean_dance"
  | "interdisciplinary"
  | "unknown";
export type VerificationStatus = "verified" | "needs_review";

export interface Artist {
  id: string;                         // fields.id (김경숙-b0431df7 또는 yoon-kyunggeun)
  name: string;
  /** @deprecated Deletion candidate. To be migrated in the next phase. */
  company?: string;                   // 소속/단체명
  bio?: string;                       // 소개글
  works?: Array<string | Work>;       // 대표작 목록 (문자열 또는 상세 객체 배열)
  field?: string;                     // 분야 (dance, interdisciplinary 등)
  genre?: string;                     // 장르 (contemporary, ballet, korean 등)
  instagram?: string;                 // 인스타그램 주소
  website?: string;                   // 홈페이지 주소
  profileImage?: string;              // 대표 이미지 경로 (/images/artists/...)
  residency?: string[];               // 레지던시 목록
  festival?: string[];                // 페스티벌 목록
  status?: "published" | "draft" | string; // 검수 상태
  verified?: boolean;                 // 검증 여부
  slug?: string;                      // 아티스트 슬러그명
  /** @deprecated Deletion candidate. To be migrated in the next phase. */
  claim_code?: string;                // 비공개 로그인 코드 (poc_xxxxxxxx)
  aiSummary?: string;                 // AI 요약 정보
  reviews?: Array<{                   // 관련 리뷰 링크 목록
    workTitle: string;
    source: string;
    url: string;
  }>;

  // 하위 호환성을 위해 유지하는 기존 필드들
  recordId?: string;                  // Airtable 내부 record ID
  name_en?: string;
  type?: ArtistType;
  bio_short?: string;
  representative_work?: string;
  year?: number | null;
  organization_or_affiliation?: string;
  festival_or_venue?: string;
  city_or_region?: string;
  website_url?: string | null;
  instagram_url?: string | null;
  video_url?: string | null;
  photo_url?: string | null;
  source_file?: string;
  tags?: string[];
  verification_status?: VerificationStatus;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  portfolio_works?: Work[];
  isDemo?: boolean;
  role?: string;
  motion_video_url?: string | null;
  youtube_url?: string | null;
  profile_image_url?: string | null;
  profile_image_urls?: string[];
  motionProfile?: {
    type: "video" | "image";
    src: string;
    poster?: string;
    title?: string;
    caption?: string;
  } | null;
  affiliations?: any[];
  education?: string[];
  awards?: any[];
  competitions?: any[];
  links?: any[];
  view_count?: number;                // 누적 조회수
  category?: string | null;
  current_activity?: unknown;         // string | object | array — normalize with lib/normalize before use
  review_links?: unknown;             // string | object | array — normalize with lib/normalize before use
  portfolio_url?: string | null;
  connectedCompany?: ConnectedCompany | null;
}

export interface Work {
  id: string;
  slug?: string;
  title: string;
  year?: string | number | null;
  description?: string;
  role?: string;
  image_url?: string;
  video_url?: string;
  videoUrl?: string;
  preview_start?: number;
  preview_end?: number;
  previewStart?: number;
  previewEnd?: number;
  previewAspectRatio?: "16 / 9" | "9 / 16";
  media?: {
    type: string;
    url?: string;
    src?: string;
    poster?: string;
    previewStart?: number;
    previewEnd?: number;
    aspectRatio?: "16 / 9" | "9 / 16";
  } | null;

  created_at?: string;
  updated_at?: string;

  // Legacy Airtable properties for backward compatibility
  artist_id?: string;
  artist_name?: string;
  venue?: string;
  festival?: string;
  source_url?: string;
  artistRecordIds?: string[];
}

export type ArtistWithWorks = Artist;

// public.companies — organization public profile (separate from artists;
// see lib/companies.ts). Individual <-> company relationships live in
// public.artist_companies, never inferred from artists.company text.
export interface Company {
  id: string;
  name: string;
  name_en?: string | null;
  slug?: string | null;
  status?: "draft" | "published" | "archived" | string;
  verified?: boolean;
  genre?: string | null;
  category?: string | null;
  city_or_region?: string | null;
  bio_short?: string | null;
  bio?: string | null;
  profile_image_url?: string | null;
  profile_image_urls?: string[];
  motion_video_url?: string | null;
  email?: string | null;
  instagram?: string | null;
  website?: string | null;
  portfolio_url?: string | null;
  current_activity?: string[];
  createdAt?: string | null;
  updatedAt?: string | null;

  // Rich Brand/Company Extensions
  brand_color?: string | null;
  slogan?: string | null;
  mission?: string | null;
  vision?: string | null;
  values?: string[] | null;
  core_values?: string[] | null;
  view_count?: number | null;
  founded_year?: number | null;
  history?: Array<{ year: string; event: string }> | null;
  projects?: Array<{ title: string; date?: string; link?: string; description?: string }> | null;
  press_links?: Array<{ title: string; source?: string; url?: string }> | null;
  logo_url?: string | null;
  hero_image_url?: string | null;

  // JSONB Arrays
  works?: any[] | null;
  awards?: any[] | null;
  review_links?: any[] | null;
  links?: any[] | null;
}

// A row from public.artist_companies joined with its linked company.
export interface ConnectedCompany {
  company: Company;
  role: string | null;
  start_year: number | null;
  end_year: number | null;
  is_current: boolean;
  is_primary: boolean;
  created_at?: string | null;
}


export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface ArtistFilter {
  type?: ArtistType | "all";
  field?: ArtistField | "all";
  query?: string;
}

export const FIELD_LABELS: Record<string, string> = {
  all: "전체 분야",
  contemporary_dance: "현대무용",
  ballet: "발레",
  korean_dance: "한국무용",
  interdisciplinary: "다원예술",
  unknown: "기타",
};

export const TYPE_LABELS: Record<string, string> = {
  all: "전체",
  individual: "개인 안무가",
  company: "무용단·단체",
  project_group: "프로젝트팀",
};

export interface PerformanceComment {
  id: string;
  performanceId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface PerformanceRating {
  id: string;
  performanceId: string;
  userId: string;
  rating: number;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
  savedPerformances: string[]; // performance IDs
  savedArtists: string[]; // artist IDs
  role?: "reader" | "artist" | "admin";
}

// An artist linked to a performance via performance_artists, with the role
// preserved from that join row (e.g. "안무", "출연"). Kept separate from
// Artist itself so Artist doesn't have to carry performance-specific fields.
export interface RelatedPerformanceArtist {
  artist: Artist;
  role?: string | null;
}

export interface Performance {
  id: string;                         // performances.id (uuid)
  title: string;
  slug?: string | null;

  posterUrl?: string | null;
  sourceUrl?: string | null;
  ticketUrl?: string | null;

  venue?: string | null;
  startDate?: string | null;          // performances.start_date
  endDate?: string | null;            // performances.end_date

  organizer?: string | null;
  genre?: string | null;
  category?: string | null;

  status?: string | null;             // 'draft' | 'published' | 'archived'
  published?: boolean;                // derived: status === 'published'
  featured?: boolean;                 // manual editorial pick for curated placement

  createdAt?: string | null;
  updatedAt?: string | null;

  // Populated by lib/performances.ts from performance_artists + artists,
  // filtered to artists.status === 'published'. Empty array, never undefined,
  // when there's no DB relation yet or no linked artists.
  relatedArtists?: RelatedPerformanceArtist[];

  description?: string;

  // Legacy fields kept optional for any code still reading the old shape
  // (none currently found in active use — see walkthrough.md).
  company?: string;
  city?: string;
  posterImage?: string;
  imageUrl?: string;
  artistIds?: string[];
  recordId?: string;
  aiSummary?: string;
  reviews?: Array<{
    source: string;
    url: string;
  }>;
  companyId?: string;
  comments?: PerformanceComment[];
  ratings?: PerformanceRating[];
  averageRating?: number;
  likesCount?: number;
  savesCount?: number;
}

export interface ArtistComment {
  id: string;
  artistId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  likesCount?: number;
  likesUsers?: string[];
}

