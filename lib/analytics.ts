import { sendGAEvent } from "@next/third-parties/google";

// Helper to check if string contains personally identifiable information (PII)
function isPii(term: string): boolean {
  // Email address
  if (/\S+@\S+\.\S+/.test(term)) return true;
  // Phone number (Korean format like 010-XXXX-XXXX, or raw digits 9-11 length)
  const cleanDigits = term.replace(/[^0-9]/g, "");
  if (cleanDigits.length >= 9 && cleanDigits.length <= 11) return true;
  // SSN / Resident Registration Number (Korean RRN format XXXXXX-XXXXXXX)
  if (/\d{6}-\d{7}/.test(term)) return true;
  return false;
}

let lastSearchTerm = "";

export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[Analytics]", eventName, params);
    return;
  }
  try {
    sendGAEvent({ event: eventName, ...params });
  } catch (error) {
    console.error("[Analytics] Error sending GA event:", error);
  }
}

export const analytics = {
  signUp: (method: string) => trackEvent("sign_up", { method }),
  login: (method: string) => trackEvent("login", { method }),
  logout: () => trackEvent("logout"),
  portfolioCreated: (artistId: string) => trackEvent("portfolio_created", { artist_id: artistId }),
  workCreated: (workCount: number) => trackEvent("work_created", { work_count: workCount }),
  artistViewed: (id: string, name: string) => trackEvent("artist_view", { artist_id: id, artist_name: name }),
  companyViewed: (id: string, name: string) => trackEvent("company_view", { company_id: id, company_name: name }),
  companyApply: (companyName: string) => trackEvent("company_apply", { company_name: companyName }),
  profileShared: (method: string, contentType: string, itemId: string) =>
    trackEvent("share", { method, content_type: contentType, item_id: itemId }),
  search: (keyword: string) => {
    const trimmed = keyword.trim();
    if (trimmed.length < 2) return;
    const limited = trimmed.slice(0, 100);
    if (limited === lastSearchTerm) return;
    if (isPii(limited)) return;

    lastSearchTerm = limited;
    trackEvent("search", { search_term: limited });
  },
  premiumClick: (location: string) => trackEvent("premium_click", { location }),
};
