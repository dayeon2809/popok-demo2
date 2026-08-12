import type { OpportunityDraft, OpportunityLifecycleStatus, OpportunityRecord } from "./domain.ts";
import { findDuplicate } from "./dedupe.ts";
import { getOpportunityLifecycleStatus } from "./status.ts";

export type ExistingOpportunity = OpportunityRecord;
export type PlannedAction = "new" | "updated" | "unchanged" | "duplicate" | "skipped";
export interface PlannedOpportunity { action: PlannedAction; record: OpportunityDraft; existingId?: string; changedFields: string[]; reason?: string; payload?: Record<string, unknown>; }
export interface IngestionCounts { discovered: number; new: number; updated: number; unchanged: number; duplicate: number; skipped: number; failed: number; }

const MUTABLE_FIELDS: Array<keyof OpportunityDraft> = ["sourceUrl","canonicalSourceUrl","originalPublisherUrl","title","normalizedTitle","organization","normalizedOrganization","opportunityType","targetAudience","artGenres","region","summary","description","applicationMethod","applicationUrl","contact","thumbnailUrl","publishedAt","applicationStartAt","deadline"];
const DB_COLUMN_BY_FIELD: Record<string,string>={sourceUrl:"source_url",canonicalSourceUrl:"canonical_source_url",originalPublisherUrl:"original_publisher_url",title:"title",normalizedTitle:"normalized_title",organization:"organization",normalizedOrganization:"normalized_organization",opportunityType:"opportunity_type",targetAudience:"target_audience",artGenres:"art_genres",region:"region",summary:"summary",description:"description",applicationMethod:"application_method",applicationUrl:"application_url",contact:"contact",thumbnailUrl:"thumbnail_url",publishedAt:"published_at",applicationStartAt:"application_start_at",deadline:"deadline",lastScrapedAt:"last_scraped_at",rawData:"raw_data"};
const equal = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const DATE_FIELDS = new Set<keyof OpportunityDraft>(["publishedAt","applicationStartAt","deadline"]);
const fieldEqual = (field:keyof OpportunityDraft,a:unknown,b:unknown) => DATE_FIELDS.has(field) && a && b ? new Date(String(a)).getTime()===new Date(String(b)).getTime() : equal(a,b);
export function validateOpportunity(record: OpportunityDraft) {
  const missing: string[] = [];
  if (!record.externalId) missing.push("external_id"); if (!record.title.trim()) missing.push("title"); if (!record.organization.trim() || record.organization === "기관 미상") missing.push("organization");
  if (!record.applicationStartAt) missing.push("application_start_at"); if (!record.deadline) missing.push("deadline");
  const publisherUrl=record.originalPublisherUrl||record.applicationUrl; try { if(!publisherUrl||!/^https?:$/.test(new URL(publisherUrl).protocol)) missing.push("application_url"); } catch { missing.push("application_url"); }
  return { valid: missing.length === 0, missing };
}
export function toUpsertPayload(record: OpportunityDraft) {
  const lifecycleStatus: OpportunityLifecycleStatus = getOpportunityLifecycleStatus(record.applicationStartAt, record.deadline);
  return { source:record.source,external_id:record.externalId,source_url:record.sourceUrl,canonical_source_url:record.canonicalSourceUrl,original_publisher_url:record.originalPublisherUrl,ingestion_type:record.ingestionType,title:record.title,normalized_title:record.normalizedTitle,organization:record.organization,normalized_organization:record.normalizedOrganization,opportunity_type:record.opportunityType,target_audience:record.targetAudience,art_genres:record.artGenres,region:record.region,summary:record.summary,description:record.description,application_method:record.applicationMethod,application_url:record.applicationUrl,contact:record.contact,thumbnail_url:record.thumbnailUrl,published_at:record.publishedAt,application_start_at:record.applicationStartAt,deadline:record.deadline,lifecycle_status:lifecycleStatus,review_status:"needs_review",publication_status:"draft",is_verified:false,last_scraped_at:record.lastScrapedAt,raw_data:record.rawData };
}
export function planIngestion(records: OpportunityDraft[], existing: ExistingOpportunity[], discovered = records.length, failed = 0) {
  const plans: PlannedOpportunity[] = []; const working = [...existing];
  for (const record of records) { const validation=validateOpportunity(record); if(!validation.valid){plans.push({action:"skipped",record,changedFields:[],reason:`needs_review: missing ${validation.missing.join(", ")}`});continue;}
    const same=working.find((item)=>item.source===record.source&&item.externalId===record.externalId); if(same){const changed=MUTABLE_FIELDS.filter((field)=>!fieldEqual(field,record[field],same[field])); const full=toUpsertPayload(record); const payload:Record<string,unknown>={source:record.source,external_id:record.externalId}; for(const field of changed) payload[DB_COLUMN_BY_FIELD[field]]=full[DB_COLUMN_BY_FIELD[field] as keyof typeof full]; if(changed.includes("deadline")||changed.includes("applicationStartAt")) payload.lifecycle_status=full.lifecycle_status; plans.push({action:changed.length?"updated":"unchanged",record,existingId:same.id,changedFields:changed,payload:changed.length?payload:undefined});continue;}
    const duplicate=findDuplicate(record,working); if(duplicate){plans.push({action:"duplicate",record,existingId:duplicate.candidateId,changedFields:[],reason:`${duplicate.kind} (${duplicate.confidence.toFixed(2)})`});continue;}
    plans.push({action:"new",record,changedFields:Object.keys(toUpsertPayload(record)),payload:toUpsertPayload(record)}); working.push({...record,id:`planned:${record.source}:${record.externalId}`,createdAt:"",updatedAt:""});
  }
  const counts:IngestionCounts={discovered,new:0,updated:0,unchanged:0,duplicate:0,skipped:0,failed}; for(const plan of plans) counts[plan.action]++;
  return {counts,plans};
}

const ALLOWED_REGIONS=new Set(["전국","서울","부산","대구","인천","광주","대전","울산","세종","경기","강원","충북","충남","전북","전남","경북","경남","제주","해외"]);
const ALLOWED_AUDIENCES=new Set(["전체","개인","단체","개인,단체","개인·단체"]);
export function validateForAutoPublish(record:OpportunityDraft, peers:OpportunityDraft[]=[]){const reasons:string[]=[];const basic=validateOpportunity(record);reasons.push(...basic.missing.map((field)=>`missing:${field}`));
  if(/[�]|(?:\?{3,})/u.test(record.title)||/^(?:제목\s*없음|공고|아트누리|untitled)$/iu.test(record.title.trim()))reasons.push("invalid:title");
  const start=record.applicationStartAt?new Date(record.applicationStartAt):null;const end=record.deadline?new Date(record.deadline):null;if(!start||Number.isNaN(start.getTime()))reasons.push("invalid:application_start_at");if(!end||Number.isNaN(end.getTime()))reasons.push("invalid:deadline");if(start&&end&&!Number.isNaN(start.getTime())&&!Number.isNaN(end.getTime())&&end<start)reasons.push("invalid:date_range");
  const lifecycle=getOpportunityLifecycleStatus(record.applicationStartAt,record.deadline);if(lifecycle!=="open"&&lifecycle!=="upcoming")reasons.push(`invalid:lifecycle:${lifecycle}`);
  for(const [name,value] of [["original_url",record.originalPublisherUrl],["application_url",record.applicationUrl]] as const){try{if(!value||!/^https?:$/.test(new URL(value).protocol))reasons.push(`invalid:${name}`)}catch{reasons.push(`invalid:${name}`)}}
  if(record.applicationUrl&&/^(?:www\.)?artnuri\.or\.kr$/i.test(new URL(record.applicationUrl).hostname))reasons.push("invalid:artnuri_application_url");
  if(record.region&&!ALLOWED_REGIONS.has(record.region))reasons.push("invalid:region");if(record.targetAudience.some((value)=>!ALLOWED_AUDIENCES.has(value)))reasons.push("invalid:target_audience");if(record.artGenres.some((value)=>!["dance","music","theatre_musical","traditional","visual","interdisciplinary","culture_planning","all"].includes(value)))reasons.push("invalid:art_genres");
  if(peers.some((peer)=>peer.externalId!==record.externalId&&peer.normalizedTitle===record.normalizedTitle&&peer.normalizedOrganization===record.normalizedOrganization&&fieldEqual("applicationStartAt",peer.applicationStartAt,record.applicationStartAt)&&fieldEqual("deadline",peer.deadline,record.deadline)))reasons.push("duplicate:identity_period");
  return {valid:reasons.length===0,reasons:[...new Set(reasons)],lifecycle};}

export function selectRepresentativeOpportunities<T extends Pick<OpportunityRecord,"id"|"source"|"externalId"|"canonicalSourceUrl"|"normalizedOrganization"|"normalizedTitle"|"deadline"|"isFeatured"|"isVerified"|"publishedAt">>(records:T[]){
  const sourcePriority={manual:5,artnuri:4,gokams_notice:3,gokams_event:2,artmore:1} as const; const kept:T[]=[];
  for(const record of [...records].sort((a,b)=>Number(b.isFeatured)-Number(a.isFeatured)||Number(b.isVerified)-Number(a.isVerified)||(sourcePriority[b.source]-sourcePriority[a.source])||String(b.publishedAt??"").localeCompare(String(a.publishedAt??"")))){
    const match=findDuplicate(record,kept); if(match?.kind==="cross_source_candidate") continue; kept.push(record);
  } return kept;
}
