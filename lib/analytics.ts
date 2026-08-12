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
  aiDiscoveryOpened: (location: string) => trackEvent("ai_discovery_opened", { location }),
  aiDiscoverySearched: (mode: string, query: string) =>
    trackEvent("ai_discovery_searched", { mode, query_length: query.trim().length }),
  aiDiscoveryResultClicked: (artistId: string, position: number) =>
    trackEvent("ai_discovery_result_clicked", { artist_id: artistId, position }),
  aiSimilarArtistClicked: (contextArtistId: string) =>
    trackEvent("ai_similar_artist_clicked", { context_artist_id: contextArtistId }),
  aiDiscoveryNoResults: (mode: string) => trackEvent("ai_discovery_no_results", { mode }),
  aiDiscoveryFailed: (mode: string, code?: string) => trackEvent("ai_discovery_failed", { mode, code }),

  opportunitiesPageView: () => trackEvent("opportunities_page_view"),
  opportunityFilterClick: (category: string) =>
    trackEvent("opportunity_filter_click", { category }),
  opportunityCardClick: (opportunityId: string) =>
    trackEvent("opportunity_card_click", { opportunity_id: opportunityId }),
  opportunitySaveClick: (opportunityId: string) =>
    trackEvent("opportunity_save_click", { opportunity_id: opportunityId }),
  opportunityExternalLinkClick: (opportunityId: string) =>
    trackEvent("opportunity_external_link_click", { opportunity_id: opportunityId }),
  opportunityCollaborationConnectClick: (postId: string) =>
    trackEvent("opportunity_collaboration_connect_click", { post_id: postId }),

  // ── Home conversion CTAs ───────────────────────────────────────────────
  // location: "hero" | "result_comparison" | "feed_inline" | "steps" | "final_cta"
  homeCreatePopokClicked: (location: string, isLoggedIn: boolean) =>
    trackEvent("home_create_popok_clicked", { location, is_logged_in: isLoggedIn }),

  // ── Artist Detail ──────────────────────────────────────────────────────
  artistShareClicked: (artistId: string) => trackEvent("artist_share_clicked", { artist_id: artistId }),
  artistConnectClicked: (artistId: string) => trackEvent("artist_connect_clicked", { artist_id: artistId }),
  artistContactClicked: (artistId: string, channel: string) =>
    trackEvent("artist_contact_clicked", { artist_id: artistId, channel }),
  artistCardFlipped: (artistId: string) => trackEvent("artist_card_flipped", { artist_id: artistId }),
  artistQrSaved: (artistId: string) => trackEvent("artist_qr_saved", { artist_id: artistId }),
  artistCardShareOpen: (artistId: string) => trackEvent("artist_card_share_open", { artist_id: artistId }),
  artistCardStoryDownload: (artistId: string) => trackEvent("artist_card_story_download", { artist_id: artistId }),
  artistCardNativeShare: (artistId: string) => trackEvent("artist_card_native_share", { artist_id: artistId }),
  artistProfileLinkCopy: (artistId: string) => trackEvent("artist_profile_link_copy", { artist_id: artistId }),
  artistWorkOpened: (artistId: string, workId: string) =>
    trackEvent("artist_work_opened", { artist_id: artistId, work_id: workId }),
  artistWorkClosed: (artistId: string, workId: string) =>
    trackEvent("artist_work_closed", { artist_id: artistId, work_id: workId }),
  artistWorkExternalClicked: (artistId: string, workId: string) =>
    trackEvent("artist_work_external_clicked", { artist_id: artistId, work_id: workId }),
  artistMediaClicked: (artistId: string) => trackEvent("artist_media_clicked", { artist_id: artistId }),
  artistCompanyClicked: (artistId: string, companyId: string) =>
    trackEvent("artist_company_clicked", { artist_id: artistId, company_id: companyId }),
  artistAiDiscoveryClicked: (artistId: string) => trackEvent("artist_ai_discovery_clicked", { artist_id: artistId }),
  artistRelatedArtistClicked: (artistId: string) =>
    trackEvent("artist_related_artist_clicked", { artist_id: artistId }),

  // ── Works ──────────────────────────────────────────────────────────────
  workGalleryScroll: (artistId: string) => trackEvent("work_gallery_scroll", { artist_id: artistId }),
  workImageChanged: (artistId: string, workId: string) =>
    trackEvent("work_image_changed", { artist_id: artistId, work_id: workId }),
  workVideoPlayed: (artistId: string, workId: string) =>
    trackEvent("work_video_played", { artist_id: artistId, work_id: workId }),

  // ── Navigation ─────────────────────────────────────────────────────────
  artistsBackClicked: (artistId: string) => trackEvent("artists_back_clicked", { artist_id: artistId }),
  footerPopokClicked: () => trackEvent("footer_popok_clicked"),
};
