// Re-export shared work normalization utilities from ./works
// to ensure zero regression across existing imports.

export {
  normalizeWorkImages,
  normalizeWorkCredits,
  creditsToDisplayString,
  normalizeWork,
  normalizeWorks,
  cleanWorkForPayload,
  cleanWorksForPayload,
  type WorkCredit,
  type NormalizedWork,
} from "./works";
