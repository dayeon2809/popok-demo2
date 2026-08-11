// Single place that decides where a company's detail page lives. Every
// company link (companies list cards, an artist's CONNECTED ORGANIZATION
// card, future links) must go through this function so the route can change
// later without hunting down every call site.
export function getCompanyDetailHref(slugOrId: string): string {
  return `/companies/${encodeURIComponent(slugOrId)}`;
}
