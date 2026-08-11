export interface Work {
  title: string;
  year: number | null;
  role: string;
  venue: string;
  festival: string;
  source_url: string;
}

export interface Artist {
  id: string;
  name: string;
  name_en: string;
  type: "individual" | "company" | "project_group";
  field: "contemporary_dance" | "ballet" | "korean_dance" | "interdisciplinary" | "unknown";
  bio_short: string;
  works: Work[];
  representative_work: string;
  year: number | null;
  organization_or_affiliation: string;
  festival_or_venue: string;
  city_or_region: string;
  website_url: string | null;
  instagram_url: string | null;
  video_url: string | null;
  photo_url: string | null;       // 아티스트 사진 URL (직접 입력)
  career: string[];               // 주요 경력 (직접 입력)
  source_url: string | null;
  source_file: string;
  tags: string[];
  verification_status: "verified" | "needs_review";
  related_articles: string[];
  created_at: string;
  updated_at: string;
}

export type FieldType = Artist["field"];
export type ArtistType = Artist["type"];
