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
  company?: string;                   // 소속/단체명
  bio?: string;                       // 소개글
  works: string[];                    // 대표작 목록 (문자열 배열)
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
  portfolio_works?: Array<{
    title: string;
    year: string;
    description: string;
    role: string;
    image_url: string;
    video_url?: string;
    videoUrl?: string;
    previewStart?: number;
    previewEnd?: number;
    previewAspectRatio?: "16 / 9" | "9 / 16";
    media?: {
      type: "youtube" | "vimeo" | "video" | "image";
      url?: string;
      src?: string;
      poster?: string;
      previewStart?: number;
      previewEnd?: number;
      aspectRatio?: "16 / 9" | "9 / 16";
    };
  }>;
  isDemo?: boolean;
  role?: string;
  motionProfile?: {
    type: "video" | "image";
    src: string;
    poster?: string;
    title?: string;
    caption?: string;
  } | null;
}

export interface Work {
  id: string;                          // Airtable record ID
  artist_id: string;                   // fields.id (김경숙-b0431df7) — Artist.id와 매칭
  artist_name: string;
  title: string;
  year: number | null;
  role: string;
  venue: string;
  festival: string;
  source_url: string;
  artistRecordIds?: string[];          // Airtable linked record ID 배열
}

export type ArtistWithWorks = Artist;


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

export interface Performance {
  id: string;
  title: string;
  company: string;
  venue: string;
  city: string;
  startDate: string;
  endDate: string;
  posterImage: string;
  imageUrl?: string;
  genre: string[];
  ticketUrl: string;
  artistIds: string[];
  status: "published" | "draft" | string;
  description: string;
  recordId?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Airtable에서 로드할 추가 필드
  aiSummary?: string;
  reviews?: Array<{
    source: string;
    url: string;
  }>;

  // 향후 확장을 위한 데이터 구조 설계
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

