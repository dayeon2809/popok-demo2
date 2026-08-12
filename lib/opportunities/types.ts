export type OpportunityCategory =
  | "actor"
  | "music"
  | "dance"
  | "grant"
  | "residency"
  | "international"
  | "job"
  | "collaboration";

export type Opportunity = {
  id: string;
  category: OpportunityCategory;
  typeLabel: string;
  title: string;
  organization: string;
  summary?: string;
  description?: string;
  opportunityType?: string;
  location?: string;
  compensation?: string;
  schedule?: string;
  deadline?: string;
  sourceUrl?: string;
  thumbnailUrl?: string;
  isInternal?: boolean;
  authorId?: string;
  createdAt: string;
  /** Display-only additions — already selected by listPublicOpportunities()
   * but previously left unmapped on the card. Optional so existing callers
   * that don't pass them keep working. */
  artGenres?: string[];
  targetAudience?: string[];
  applicationStartAt?: string;
  isClosingSoon?: boolean;
};

export type OpportunityViewerProfile = {
  genre?: string | null;
  role?: string | null;
  region?: string | null;
  careerItemCount: number;
};

export type CollaborationPost = {
  id: string;
  authorId: string;
  authorName: string;
  role: string;
  content: string;
  createdLabel: string;
  genre: "actor" | "music" | "dance";
};
