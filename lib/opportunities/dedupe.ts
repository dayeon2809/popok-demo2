import type { OpportunityDraft, OpportunityRecord } from "./domain";

export type DuplicateKind = "source_external_id" | "source_url" | "same_source_identity" | "cross_source_candidate";
export interface DuplicateMatch { kind: DuplicateKind; candidateId?: string; confidence: number; }

type ComparableOpportunity = Pick<OpportunityDraft, "source" | "externalId" | "canonicalSourceUrl" | "normalizedOrganization" | "normalizedTitle" | "deadline"> & Partial<Pick<OpportunityRecord, "id">>;

export function titleSimilarity(left: string, right: string) {
  if (left === right) return 1;
  const a = new Set([...left]);
  const b = new Set([...right]);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const char of a) if (b.has(char)) intersection += 1;
  return (2 * intersection) / (a.size + b.size);
}

export function findDuplicate(incoming: ComparableOpportunity, existing: ComparableOpportunity[]): DuplicateMatch | null {
  for (const item of existing) {
    if (incoming.source === item.source && incoming.externalId && incoming.externalId === item.externalId)
      return { kind: "source_external_id", candidateId: item.id, confidence: 1 };
    if (incoming.source === item.source && incoming.canonicalSourceUrl === item.canonicalSourceUrl)
      return { kind: "source_url", candidateId: item.id, confidence: 1 };
    const sameIdentity = incoming.normalizedOrganization === item.normalizedOrganization && incoming.normalizedTitle === item.normalizedTitle && incoming.deadline === item.deadline;
    if (incoming.source === item.source && sameIdentity)
      return { kind: "same_source_identity", candidateId: item.id, confidence: 0.98 };
    const similarity = titleSimilarity(incoming.normalizedTitle, item.normalizedTitle);
    if (incoming.source !== item.source && incoming.normalizedOrganization === item.normalizedOrganization && incoming.deadline === item.deadline && similarity >= 0.82)
      return { kind: "cross_source_candidate", candidateId: item.id, confidence: similarity };
  }
  return null;
}

export function dedupeArtnuriByDocid<T extends { externalId: string }>(items: T[]) {
  return [...new Map(items.map((item) => [item.externalId, item])).values()];
}
