import type { OpportunityDraft } from "./domain";

const TITLE_PREFIX = /^\s*(?:\[\s*(?:공고|모집|채용|지원사업|오디션)\s*\]|(?:공고|모집)\s*[:：-])\s*/gi;
const TRACKING_PARAMS = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"]);

export function normalizeWhitespace(value: string | null | undefined) {
  return (value ?? "").normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
}

export function normalizeTitle(value: string) {
  return normalizeWhitespace(value)
    .replace(TITLE_PREFIX, "")
    .replace(/^(?:19|20)\d{2}(?:년(?:도)?)?\s*/u, "")
    .replace(/[\[\](){}<>《》「」『』【】'\"“”‘’·ㆍ:：,_~!?.-]/g, "")
    .replace(/\s+/g, "")
    .toLocaleLowerCase("ko-KR");
}

export function normalizeOrganization(value: string) {
  return normalizeWhitespace(value)
    .replace(/^(?:재단법인|사단법인|주식회사|\(재\)|\(사\)|\(주\))\s*/u, "")
    .replace(/[\s·ㆍ:：,_~!?.-]/g, "")
    .toLocaleLowerCase("ko-KR");
}

export function canonicalizeUrl(value: string, base?: string) {
  const url = new URL(value, base);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
  }
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
  url.searchParams.sort();
  return url.toString();
}

export function preferPublisherUrl(platformUrl: string, candidates: Array<string | null | undefined>) {
  const platformHost = new URL(platformUrl).hostname.replace(/^www\./, "");
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const canonical = canonicalizeUrl(candidate, platformUrl);
      if (new URL(canonical).hostname.replace(/^www\./, "") !== platformHost) return canonical;
    } catch { /* malformed source links are ignored */ }
  }
  return null;
}

export function normalizeOpportunity(draft: OpportunityDraft): OpportunityDraft {
  return {
    ...draft,
    title: normalizeWhitespace(draft.title),
    normalizedTitle: normalizeTitle(draft.title),
    organization: normalizeWhitespace(draft.organization),
    normalizedOrganization: normalizeOrganization(draft.organization),
    sourceUrl: canonicalizeUrl(draft.sourceUrl),
    canonicalSourceUrl: canonicalizeUrl(draft.sourceUrl),
    originalPublisherUrl: draft.originalPublisherUrl ? canonicalizeUrl(draft.originalPublisherUrl, draft.sourceUrl) : null,
  };
}
