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
  location?: string;
  compensation?: string;
  schedule?: string;
  deadline?: string;
  sourceUrl?: string;
  thumbnailUrl?: string;
  isInternal?: boolean;
  authorId?: string;
  createdAt: string;
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
