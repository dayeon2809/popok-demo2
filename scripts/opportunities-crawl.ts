import { crawlSource } from "../lib/opportunities/sources/fetch.ts";
import { SOURCE_CONFIG } from "../lib/opportunities/sources/parser.ts";
import { planIngestion, type ExistingOpportunity } from "../lib/opportunities/ingestion.ts";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { applyOpportunityPlan } from "../lib/opportunities/apply.ts";

const args = new Map(process.argv.slice(2).map((arg) => { const [key, value = "true"] = arg.replace(/^--/, "").split("="); return [key, value]; }));
const sourceArg = args.get("source") ?? "all";
const apply = args.has("apply"); const envFile=args.get("env-file");
if(envFile){const text=await readFile(envFile,"utf8");for(const line of text.split(/\r?\n/)){const match=line.match(/^([A-Z0-9_]+)=(.*)$/);if(match&&!process.env[match[1]])process.env[match[1]]=match[2].trim().replace(/^['\"]|['\"]$/g,"");}}
const expectedRef=args.get("confirm-project-ref"); const confirmedSource=args.get("confirm-source"); const maxNew=Number(args.get("max-new")??0);
if(apply&&(sourceArg!=="artnuri"||confirmedSource!=="artnuri"||expectedRef!=="sawsqtqjqmesfasbcmyf"||maxNew!==3)) throw new Error("Apply requires --source=artnuri --confirm-source=artnuri --confirm-project-ref=sawsqtqjqmesfasbcmyf --max-new=3");
const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.SUPABASE_SERVICE_ROLE_KEY; const actualRef=url?new URL(url).hostname.split(".")[0]:null;
if(apply&&(!url||!key||actualRef!==expectedRef)) throw new Error(`Supabase ref mismatch or missing server credentials (actual=${actualRef??"missing"})`);
const client=url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
let snapshot: ExistingOpportunity[] = args.get("snapshot") ? JSON.parse(await readFile(args.get("snapshot")!, "utf8")) : [];
if(client){const {data,error}=await client.from("opportunities").select("*");if(error)throw error;snapshot=(data??[]).map((row:any)=>({id:row.id,source:row.source,externalId:row.external_id,sourceUrl:row.source_url,canonicalSourceUrl:row.canonical_source_url,originalPublisherUrl:row.original_publisher_url,ingestionType:row.ingestion_type,title:row.title,normalizedTitle:row.normalized_title,organization:row.organization,normalizedOrganization:row.normalized_organization,opportunityType:row.opportunity_type,targetAudience:row.target_audience,artGenres:row.art_genres,region:row.region,summary:row.summary,description:row.description,applicationMethod:row.application_method,applicationUrl:row.application_url,contact:row.contact,thumbnailUrl:row.thumbnail_url,publishedAt:row.published_at,applicationStartAt:row.application_start_at,deadline:row.deadline,publicationStatus:row.publication_status,isFeatured:row.is_featured,isVerified:row.is_verified,createdAt:row.created_at,updatedAt:row.updated_at,lastScrapedAt:row.last_scraped_at,rawData:row.raw_data}));}
const sources = (sourceArg === "all" ? Object.keys(SOURCE_CONFIG) : [sourceArg]) as Array<keyof typeof SOURCE_CONFIG>;
for (const source of sources) {
  if (!(source in SOURCE_CONFIG)) { console.error(`[${source}] unknown source`); continue; }
  if (!SOURCE_CONFIG[source].allowed) { console.log(JSON.stringify({ source, mode: "dry-run", skipped: true, reason: "robots.txt disallow" })); continue; }
  try { const result = await crawlSource(source, { maxPages: 1, maxItems: Math.min(Number(args.get("limit") ?? 10), 10), timeoutMs: 12_000, delayMs: 800, maxFailureRate: Number(args.get("max-failure-rate") ?? 0.3) });
    const plan=planIngestion(result.records,snapshot,result.discovered,result.failures.length);
    console.log(JSON.stringify({ source, mode: "dry-run", pagesChecked: 1, aborted:result.aborted, counts:plan.counts, failures:result.failures, changes:plan.plans.map(({action,existingId,changedFields,reason,payload})=>({action,existingId,changedFields,reason,payload})) }, null, 2));
    if(apply){if(result.aborted||plan.counts.failed||plan.counts.skipped||plan.counts.updated||plan.counts.duplicate||plan.counts.new>maxNew||plan.counts.new!==result.records.length)throw new Error(`Unsafe apply plan: ${JSON.stringify(plan.counts)}`);
      const applied=await applyOpportunityPlan(client!,plan.plans,true); const finishedAt=new Date().toISOString(); const {error:runError}=await client!.from("opportunity_ingestion_runs").insert({source:"artnuri",mode:"apply",status:"completed",pages_checked:1,items_found:result.discovered,items_parsed:result.records.length,items_failed:result.failures.length,summary:{...plan.counts,applied:applied.applied},started_at:finishedAt,finished_at:finishedAt});if(runError)throw runError;console.log(JSON.stringify({source,mode:"apply",applied:applied.applied,projectRef:actualRef}));}
  } catch (error) { console.error(JSON.stringify({ source, mode: "dry-run", error: error instanceof Error ? error.message : String(error) })); }
}
