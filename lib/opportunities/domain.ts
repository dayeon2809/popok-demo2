export const OPPORTUNITY_SOURCES = ["manual", "artmore", "gokams_notice", "gokams_event", "artnuri"] as const;

export type OpportunitySourceName = (typeof OPPORTUNITY_SOURCES)[number];
export type OpportunityIngestionType = "manual" | "scraped";
export type OpportunityPublicationStatus = "draft" | "published" | "hidden";
export type OpportunityLifecycleStatus = "open" | "upcoming" | "closed" | "undated";
export type OpportunityType = "grant" | "open_call" | "audition" | "job" | "education" | "residency" | "space" | "event" | "other";

export const ART_GENRES = ["dance", "music", "theatre_musical", "traditional", "visual", "interdisciplinary", "culture_planning", "all"] as const;
export type ArtGenre = (typeof ART_GENRES)[number];

export interface OpportunityRecord {
  id: string;
  source: OpportunitySourceName;
  externalId: string | null;
  sourceUrl: string;
  canonicalSourceUrl: string;
  originalPublisherUrl: string | null;
  ingestionType: OpportunityIngestionType;
  title: string;
  normalizedTitle: string;
  organization: string;
  normalizedOrganization: string;
  opportunityType: OpportunityType;
  targetAudience: string[];
  artGenres: ArtGenre[];
  region: string | null;
  summary: string | null;
  description: string | null;
  applicationMethod: string | null;
  applicationUrl: string | null;
  contact: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  applicationStartAt: string | null;
  deadline: string | null;
  publicationStatus: OpportunityPublicationStatus;
  isFeatured: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastScrapedAt: string | null;
  rawData: Record<string, unknown> | null;
}

export type OpportunityDraft = Omit<OpportunityRecord, "id" | "createdAt" | "updatedAt">;

export interface OpportunityListItem {
  externalId: string;
  sourceUrl: string;
  title: string;
  organization?: string | null;
  publishedAt?: string | null;
  rawData?: Record<string, unknown>;
}

export interface CrawlOptions {
  maxPages: number;
  maxItems: number;
  timeoutMs: number;
  delayMs: number;
  maxFailureRate?: number;
}

export interface CrawlFailure { externalId: string; sourceUrl: string; message: string; }
export interface CrawlResult { source: Exclude<OpportunitySourceName, "manual">; pagesChecked: number; discovered: number; records: OpportunityDraft[]; failures: CrawlFailure[]; aborted: boolean; }

export interface OpportunitySourceAdapter {
  readonly source: Exclude<OpportunitySourceName, "manual">;
  readonly listUrl: string;
  fetchList(options: CrawlOptions): Promise<OpportunityListItem[]>;
  fetchDetail(item: OpportunityListItem, options: CrawlOptions): Promise<OpportunityDraft>;
}
