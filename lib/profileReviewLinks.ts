export type ProfileReviewLink = {
  title: string;
  publication: string;
  work: string;
  url: string;
  year?: string;
};

const WORK_SOURCE_KEYS = [
  "source", "sources", "review", "reviewLink", "article", "articleUrl",
  "\uAE30\uC0AC", "\uB9AC\uBDF0", "\uCD9C\uCC98",
] as const;

function cleanUrl(raw: string): string {
  const value = raw.trim().replace(/[),.;\]}>"']+$/g, "");
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function domainLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "관련 기사";
  }
}
const EXTERNAL_CHANNEL_HOST = /(^|\.)(instagram\.com|linkedin\.com|youtube\.com|youtu\.be|facebook\.com|x\.com|twitter\.com|vimeo\.com|behance\.net|notion\.site|brunch\.co\.kr|blog\.naver\.com)$/i;
const EXTERNAL_CHANNEL_LABEL = /(인스타|instagram|링크드인|linkedin|유튜브|youtube|페이스북|facebook|트위터|twitter|공식\s*(홈페이지|사이트|웹사이트|채널)|홈페이지|웹사이트|website|portfolio|포트폴리오|블로그|blog|vimeo|behance)/i;

function isExternalChannelLink(item: unknown, label: string, url: string): boolean {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return false;
  }
  if (EXTERNAL_CHANNEL_HOST.test(host)) return true;
  if (!item || typeof item !== "object") return EXTERNAL_CHANNEL_LABEL.test(label);
  const record = item as Record<string, unknown>;
  const descriptor = [label, record.label, record.title, record.type, record.category, record.name]
    .filter((value) => typeof value === "string")
    .join(" ");
  return EXTERNAL_CHANNEL_LABEL.test(descriptor);
}

export function extractReviewUrls(value: unknown): Array<{ label: string; url: string }> {
  const results: Array<{ label: string; url: string }> = [];
  const add = (urlValue: string, labelValue = "") => {
    const url = cleanUrl(urlValue);
    if (!url) return;
    results.push({ label: labelValue.trim(), url });
  };

  const visit = (input: unknown, inheritedLabel = "") => {
    if (Array.isArray(input)) {
      input.forEach((item) => visit(item, inheritedLabel));
      return;
    }
    if (input && typeof input === "object") {
      const item = input as Record<string, unknown>;
      const label = String(item.label || item.title || item.publication || item.source || inheritedLabel || "");
      if (typeof item.url === "string") add(item.url, label);
      else if (typeof item.href === "string") add(item.href, label);
      else Object.values(item).forEach((nested) => visit(nested, label));
      return;
    }
    if (typeof input !== "string") return;

    const consumed = new Set<string>();
    for (const match of input.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi)) {
      add(match[2], match[1]);
      consumed.add(match[2]);
    }
    for (const match of input.matchAll(/\[([^\]]+)\]\s*(https?:\/\/[^\s]+)/gi)) {
      add(match[2], match[1]);
      consumed.add(match[2]);
    }
    for (const match of input.matchAll(/https?:\/\/[^\s<>"']+/gi)) {
      if (!consumed.has(match[0])) add(match[0], inheritedLabel);
    }
  };

  visit(value);
  return results;
}

function normalizedFullTitle(value: unknown): string {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[〈〉《》「」『』<>"']/g, "")
    .replace(/[\s·:：_\-–—]+/g, "")
    .replace(/[^\p{L}\p{N}()]/gu, "");
}

function normalizedBaseTitle(value: unknown): string {
  return normalizedFullTitle(value).replace(/(\([^)]*\))+$/g, "");
}

function awardWorkCandidates(award: Record<string, unknown>): string[] {
  const values = [award.work, award.workTitle, award.result];
  const candidates: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const bracketed = Array.from(value.matchAll(/[<〈《「『]([^>〉》」』]+)[>〉》」』]/g), (match) => match[1].trim());
    if (bracketed.length) candidates.push(...bracketed);
    else if (value === award.work || value === award.workTitle) candidates.push(value.trim());
  }
  return candidates.filter(Boolean);
}

function findAwardWorkTitle(award: Record<string, unknown>, works: Record<string, unknown>[]): string | null {
  for (const candidate of awardWorkCandidates(award)) {
    const exact = works.filter((work) => normalizedFullTitle(work.title) === normalizedFullTitle(candidate));
    if (exact.length === 1) return String(exact[0].title || "");
    const base = works.filter((work) => normalizedBaseTitle(work.title) === normalizedBaseTitle(candidate));
    if (base.length === 1) return String(base[0].title || "");
  }
  return null;
}

export function mapProfileSourceUrlsToReviewLinks(rawProfile: Record<string, any>): Record<string, any> {
  const works = Array.isArray(rawProfile.works) ? rawProfile.works : [];
  const awards = Array.isArray(rawProfile.awards) ? rawProfile.awards : [];
  const existing = [
    ...(Array.isArray(rawProfile.review_links) ? rawProfile.review_links : []),
    ...(Array.isArray(rawProfile.reviewLinks) ? rawProfile.reviewLinks : []),
  ];
  const reviewLinks: ProfileReviewLink[] = [];
  const seen = new Set<string>();

  const add = (entry: Partial<ProfileReviewLink>) => {
    const url = cleanUrl(String(entry.url || ""));
    if (!url || seen.has(url)) return;
    seen.add(url);
    const fallback = domainLabel(url);
    reviewLinks.push({
      title: String(entry.title || (entry as any).label || fallback),
      publication: String(entry.publication || entry.title || (entry as any).label || fallback),
      work: String(entry.work || (entry as any).workTitle || ""),
      url,
      ...(entry.year ? { year: String(entry.year) } : {}),
    });
  };

  existing.forEach((item: any) => {
    if (typeof item === "string") {
      extractReviewUrls(item).forEach((link) => add({ ...link, title: link.label, publication: link.label }));
    } else if (item && typeof item === "object") {
      add(item);
    }
  });

  works.forEach((work: Record<string, unknown>) => {
    WORK_SOURCE_KEYS.forEach((key) => {
      extractReviewUrls(work[key]).forEach(({ label, url }) => add({
        title: label || domainLabel(url),
        publication: label || domainLabel(url),
        work: String(work.title || ""),
        url,
        year: work.year ? String(work.year) : undefined,
      }));
    });
  });

  awards.forEach((award: Record<string, unknown>) => {
    const workTitle = findAwardWorkTitle(award, works);
    if (!workTitle) return;
    for (const key of ["source", "sources", "article", "articleUrl", "\uAE30\uC0AC", "\uB9AC\uBDF0", "\uCD9C\uCC98"]) {
      extractReviewUrls(award[key]).forEach(({ label, url }) => add({
        title: label || String(award.title || domainLabel(url)),
        publication: label || domainLabel(url),
        work: workTitle,
        url,
        year: award.year ? String(award.year) : undefined,
      }));
    }
  });

  const externalLinks = Array.isArray(rawProfile.links)
    ? rawProfile.links.filter((item: unknown) => {
        const extracted = extractReviewUrls(item);
        if (extracted.length === 0) return true;

        let shouldRemainExternal = false;
        extracted.forEach(({ label, url }) => {
          if (seen.has(url)) return;
          if (isExternalChannelLink(item, label, url)) {
            shouldRemainExternal = true;
            return;
          }
          const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
          add({
            title: label || String(record.label || record.title || domainLabel(url)),
            publication: String(record.publication || label || record.label || record.title || domainLabel(url)),
            work: String(record.work || record.workTitle || ""),
            url,
            year: record.year ? String(record.year) : undefined,
          });
        });
        return shouldRemainExternal;
      })
    : rawProfile.links;

  return { ...rawProfile, links: externalLinks, review_links: reviewLinks };
}
