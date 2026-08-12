import { load } from "cheerio";
import type { ArtGenre, OpportunityDraft, OpportunityListItem, OpportunitySourceName } from "../domain";
import { dedupeArtnuriByDocid } from "../dedupe.ts";
import { normalizeOpportunity, preferPublisherUrl } from "../normalize.ts";

export const SOURCE_CONFIG = {
  artmore: { listUrl: "https://artmore.kr/sub/recruit/search_list.do", allowed: true },
  gokams_notice: { listUrl: "https://www.gokams.or.kr/01_news/notice_list.aspx", allowed: false },
  gokams_event: { listUrl: "https://www.gokams.or.kr/01_news/event_list.aspx", allowed: false },
  artnuri: { listUrl: "https://www.artnuri.or.kr/crawler/info/search.do?key=2301170002", allowed: true },
} as const;

const clean = (value?: string | null) => (value ?? "").replace(/\s+/g, " ").trim();
const absolute = (href: string | undefined, base: string) => { try { return href && !/^javascript:/i.test(href) ? new URL(href, base).toString() : null; } catch { return null; } };
const dates = (value: string) => [...value.matchAll(/(20\d{2})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})(?:일)?(?:\s*(\d{1,2}):(\d{2}))?/g)].map((m) => `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}T${(m[4] ?? "23").padStart(2,"0")}:${m[5] ?? "59"}:00+09:00`);

export function parseOpportunityList(source: Exclude<OpportunitySourceName, "manual">, html: string, base: string = SOURCE_CONFIG[source].listUrl): OpportunityListItem[] {
  const $ = load(html); const items: OpportunityListItem[] = [];
  if (source === "artnuri") {
    $("a[onclick*='goView(']").each((_, node) => {
      const call = $(node).attr("onclick") ?? "";
      const match = call.match(/goView\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]*)['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\)/);
      const title = clean($(node).text());
      if (!match || !title || !$(node).hasClass("title")) return;
      const [, externalId, organization, seNo] = match;
      const sourceUrl = new URL("/crawler/info/view.do", base); sourceUrl.searchParams.set("docid", externalId); sourceUrl.searchParams.set("source", organization); sourceUrl.searchParams.set("seNo", seNo); sourceUrl.searchParams.set("key", "2301170002");
      items.push({ externalId, sourceUrl: sourceUrl.toString(), title, organization });
    });
    return dedupeArtnuriByDocid(items);
  }
  const selector = source === "artmore" ? "a[href*='/sub/recruit/'][href*='rec_idx=']" : "a[href*='_view.aspx'][href*='Idx=']";
  $(selector).each((_, node) => { const sourceUrl = absolute($(node).attr("href"), base); if (!sourceUrl) return; const url = new URL(sourceUrl);
    const externalId = source === "artmore" ? url.searchParams.get("rec_idx") : url.searchParams.get("Idx");
    const title = clean($(node).text()); if (externalId && title) items.push({ externalId, sourceUrl, title }); });
  return [...new Map(items.map((item) => [item.externalId, item])).values()];
}

export function parseOpportunityDetail(source: Exclude<OpportunitySourceName, "manual">, html: string, item: OpportunityListItem): OpportunityDraft {
  const $ = load(html); const allText = clean($("body").text()); const title = clean($(source === "artnuri" ? ".info-tit .ti" : "h1,h2,h3,.title,th.subject").first().text()) || item.title;
  const label = (names: string[]) => { let result = ""; $("dt,th,strong,b,span").each((_, node) => { if (result) return; const key = clean($(node).text()); if (names.some((name) => key === name || key.startsWith(name))) result = clean($(node).next("dd,td,span,div,p").first().text()); }); return result || null; };
  const artnuriValues = (name: string) => $(".info-txt > li").filter((_, li) => clean($(li).children("strong").first().text()).startsWith(name)).first();
  const applicationUrl = absolute($(source === "artnuri" ? ".info-txt .site-link" : "a").filter((_, node) => source === "artnuri" || /신청사이트|온라인신청|홈페이지|지원하기/.test(clean($(node).text()))).first().attr("href"), item.sourceUrl);
  const organization = source === "artnuri" ? item.organization || new URL(item.sourceUrl).searchParams.get("source") || "기관 미상" : label(["주관기관","기관명","회사명"]) || (source.startsWith("gokams") ? "예술경영지원센터" : "기관 미상");
  const period = source === "artnuri" ? clean(artnuriValues("신청기간").text()) : allText; const foundDates = dates(period);
  const genres = source === "artnuri" ? artnuriValues("분야").find("li").toArray().map((node) => clean($(node).text())) : [];
  const genreMap = (genre: string): ArtGenre => genre.includes("무용") ? "dance" : genre.includes("음악") ? "music" : genre.includes("연극") || genre.includes("뮤지컬") ? "theatre_musical" : genre.includes("전통") ? "traditional" : genre.includes("시각") ? "visual" : genre.includes("다원") ? "interdisciplinary" : "all";
  const extractedDescription = clean($(source === "artnuri" ? ".supt-content:not(.file-wrap)" : ".view_cont,.board_view,.job_view,.content,#contents").first().text());
  const description = /^(?:ㅁ+|내용\s*없음)$/u.test(extractedDescription) ? null : extractedDescription || null;
  const deadlineEvidence = foundDates.length ? null : allText.match(/상시\s*모집|예산\s*소진\s*시|(?:일정\s*)?미정/u)?.[0] ?? null;
  return normalizeOpportunity({ source, externalId: item.externalId, sourceUrl: item.sourceUrl, canonicalSourceUrl: item.sourceUrl,
    originalPublisherUrl: preferPublisherUrl(item.sourceUrl, [applicationUrl]), ingestionType: "scraped", title, normalizedTitle: "", organization, normalizedOrganization: "",
    opportunityType: source === "artmore" ? "job" : source === "gokams_event" ? "event" : source === "artnuri" ? "grant" : "open_call", targetAudience: source === "artnuri" ? artnuriValues("지원대상").find("li").toArray().map((node) => clean($(node).text())) : (label(["지원대상"]) ?? "").split(/[,/·]/).filter(Boolean), artGenres: genres.length ? [...new Set(genres.map(genreMap))] : ["all"],
    region: source === "artnuri" ? clean(artnuriValues("지역").find("li").first().text()) || null : label(["지역"]), summary: null, description,
    applicationMethod: null, applicationUrl, contact: source === "artnuri" ? clean($(".supt-inqu .list2").text()) || null : label(["문의","연락처"]), thumbnailUrl: absolute($(source === "artnuri" ? ".supt-content img" : ".view_cont img,.job_view img").first().attr("src"), item.sourceUrl),
    publishedAt: item.publishedAt ?? null, applicationStartAt: foundDates[0] ?? null, deadline: foundDates.at(-1) ?? null, publicationStatus: "draft", isFeatured: false, isVerified: false,
    lastScrapedAt: new Date().toISOString(), rawData: { parserVersion: 1, ...(deadlineEvidence ? { deadlineEvidence } : {}) } });
}
