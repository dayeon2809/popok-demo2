import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlannedOpportunity } from "./ingestion.ts";

/** Not called by the CLI until migration approval. Requires an explicit caller opt-in. */
export async function applyOpportunityPlan(client: SupabaseClient, plans: PlannedOpportunity[], explicitlyApproved: boolean) {
  if (!explicitlyApproved) throw new Error("Opportunity apply requires explicit approval");
  const writable=plans.filter((plan)=>plan.action==="new"||plan.action==="updated");
  const inserts=writable.filter((plan)=>plan.action==="new"&&plan.payload); for(let i=0;i<inserts.length;i+=50){const payloads=inserts.slice(i,i+50).map((plan)=>plan.payload!);const {error}=await client.from("opportunities").upsert(payloads,{onConflict:"source,external_id",ignoreDuplicates:false});if(error)throw error;}
  for(const plan of writable.filter((item)=>item.action==="updated")){if(!plan.payload)continue;const {source,external_id,...changes}=plan.payload;const {error}=await client.from("opportunities").update(changes).eq("source",source).eq("external_id",external_id);if(error)throw error;}
  return {applied:writable.length};
}
