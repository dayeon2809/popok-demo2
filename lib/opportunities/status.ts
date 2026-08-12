import type { OpportunityLifecycleStatus, OpportunityPublicationStatus } from "./domain";

const DAY_MS = 86_400_000;

export function getOpportunityLifecycleStatus(
  applicationStartAt: string | null | undefined,
  deadline: string | null | undefined,
  now = new Date(),
): OpportunityLifecycleStatus {
  const startAt = applicationStartAt ? new Date(applicationStartAt) : null;
  const deadlineAt = deadline ? new Date(deadline) : null;
  const validStart = startAt && !Number.isNaN(startAt.getTime()) ? startAt : null;
  const validDeadline = deadlineAt && !Number.isNaN(deadlineAt.getTime()) ? deadlineAt : null;
  if (!validDeadline) return "undated";
  if (validDeadline.getTime() < now.getTime()) return "closed";
  if (validStart && validStart.getTime() > now.getTime()) return "upcoming";
  return "open";
}

export function isOpportunityClosingSoon(deadline: string | null | undefined, now = new Date(), days = 7) {
  if (!deadline) return false; const deadlineAt = new Date(deadline); if (Number.isNaN(deadlineAt.getTime())) return false;
  const remaining = deadlineAt.getTime() - now.getTime(); return remaining >= 0 && remaining <= days * DAY_MS;
}

export function isOpportunityPublic(status: OpportunityPublicationStatus, isVerified: boolean) {
  return status === "published" && isVerified;
}
