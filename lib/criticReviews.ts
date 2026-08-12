import { getPublishedArtists } from "./artists";
import { getPublishedCompanies } from "./companies";

export type CriticReview = { id:string; title:string; publisher:string | null; date:string | null; url:string; description:string | null; subject:string; subjectHref:string; relatedPerformance:string | null };

function validUrl(value: unknown): value is string { if (typeof value !== "string") return false; try { return /^https?:$/.test(new URL(value).protocol); } catch { return false; } }
function normalizeEntry(entry: any, subject: string, subjectHref: string, index: number): CriticReview | null {
  const title = String(entry?.title || entry?.workTitle || "").trim(); const url = entry?.url;
  if (!title || !validUrl(url)) return null;
  const relatedPerformance = String(entry.performanceTitle || entry.performance_title || entry.workTitle || entry.work_title || "").trim() || null;
  return { id:String(entry.id || `${subjectHref}-${index}`), title, publisher:String(entry.publisher || entry.source || "").trim() || null, date:String(entry.publishedAt || entry.published_at || entry.date || "").trim() || null, url, description:String(entry.description || "").trim() || null, subject, subjectHref, relatedPerformance };
}

export async function listCriticReviews(limit = 60): Promise<CriticReview[]> {
  const [artists, companies] = await Promise.all([getPublishedArtists(), getPublishedCompanies()]);
  const reviews: CriticReview[] = [];
  for (const artist of artists as any[]) {
    const entries = Array.isArray(artist.review_links) ? artist.review_links : Array.isArray(artist.reviews) ? artist.reviews : [];
    entries.forEach((entry:any,index:number) => { const value=normalizeEntry(entry,artist.name,`/artists/${encodeURIComponent(artist.slug || artist.id)}`,index); if(value)reviews.push(value); });
  }
  for (const company of companies as any[]) {
    const entries = Array.isArray(company.review_links) ? company.review_links : Array.isArray(company.press_links) ? company.press_links : [];
    entries.forEach((entry:any,index:number) => { const value=normalizeEntry(entry,company.name,`/companies/${encodeURIComponent(company.slug || company.id)}`,index); if(value)reviews.push(value); });
  }
  const unique = new Map(reviews.map((review) => [review.url, review]));
  const timestamp = (value:string|null) => value ? Date.parse(value) || 0 : 0;
  return [...unique.values()].sort((a,b) => timestamp(b.date) - timestamp(a.date) || a.title.localeCompare(b.title)).slice(0,limit);
}
