import { SOURCE_CONFIG, parseOpportunityDetail, parseOpportunityList } from "./parser.ts";
import type { CrawlResult, OpportunitySourceName } from "../domain";

export function exceedsFailureThreshold(failed: number, attempted: number, maximumRate = 0.3, minimumAttempts = 3) { return attempted >= minimumAttempts && failed / attempted > maximumRate; }

export async function crawlSource(source: Exclude<OpportunitySourceName, "manual">, options = { maxPages: 1, maxItems: 10, timeoutMs: 12_000, delayMs: 800, maxFailureRate: 0.3 }): Promise<CrawlResult> {
  const config = SOURCE_CONFIG[source];
  if (!config.allowed) throw new Error(`${source} live crawl disabled: robots.txt disallows /01_news/*.aspx`);
  if (options.maxPages > 20 || options.maxItems > 200) throw new Error("Safety limit exceeded (maxPages=20, maxItems=200)");
  const fetchHtml = async (url: string) => { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), options.timeoutMs);
    try { const response = await fetch(url, { signal: controller.signal, headers: { "user-agent": "POPOKOpportunityBot/0.1 (+contact: admin@popok.kr)" } }); if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.text(); } finally { clearTimeout(timer); } };
  const discovered=new Map<string,ReturnType<typeof parseOpportunityList>[number]>();let pagesChecked=0;
  for(let page=1;page<=options.maxPages&&discovered.size<options.maxItems;page++){const url=new URL(config.listUrl);url.searchParams.set("pageIndex",String(page));const pageItems=parseOpportunityList(source,await fetchHtml(url.toString()),url.toString());pagesChecked++;const before=discovered.size;for(const item of pageItems)discovered.set(`${source}:${item.externalId}`,item);if(pageItems.length===0||discovered.size===before)break;if(page<options.maxPages&&discovered.size<options.maxItems)await new Promise((resolve)=>setTimeout(resolve,options.delayMs));}
  const items=[...discovered.values()].slice(0,options.maxItems); const records=[]; const failures=[]; const maxFailureRate=options.maxFailureRate??0.3; let aborted=false;
  for (const item of items) { if (records.length||failures.length) await new Promise((resolve) => setTimeout(resolve, options.delayMs)); try { const parsed = parseOpportunityDetail(source, await fetchHtml(item.sourceUrl), item);
    if (!parsed.title || parsed.title === "아트모아" || parsed.organization === "기관 미상" || (source === "artmore" && !parsed.description)) throw new Error("Parser quality check failed");
    if (parsed.applicationStartAt && parsed.deadline && new Date(parsed.deadline) < new Date(parsed.applicationStartAt)) throw new Error("Invalid date range"); records.push(parsed);
  } catch(error){failures.push({externalId:item.externalId,sourceUrl:item.sourceUrl,message:error instanceof Error?error.message:String(error)}); const attempted=records.length+failures.length; if(exceedsFailureThreshold(failures.length,attempted,maxFailureRate)){aborted=true;break;}} }
  return {source,pagesChecked,discovered:items.length,records,failures,aborted};
}
