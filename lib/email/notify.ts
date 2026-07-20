// Thin per-event wrappers around sendPopokEmail — each one resolves the
// right recipient email and builds the right template, so call sites in API
// routes stay a single readable line. None of these throw; sendPopokEmail
// itself never throws either. Callers should call these AFTER their own DB
// write has already succeeded, and not let the result affect the response.

import { getSupabaseServer } from "@/lib/supabaseServer";
import { sendPopokEmail, logSkippedNoRecipient } from "./send-email";
import { getAccountEmailByOwnerId } from "./accountEmail";
import type { SendPopokEmailResult } from "./types";
import {
  buildArtistCompanyConnectionApprovedEmail,
  buildArtistProfileApprovedEmail,
  buildCompanyProfileApprovedEmail,
  buildCompanyPortfolioRequestReceivedEmail,
  buildArtistPortfolioRequestReceivedEmail,
} from "./templates";

/** Fired when an artist's "+ 단체 연결 신청" (company_manager_requests) is approved. */
export async function notifyArtistCompanyConnectionApproved(params: {
  requestId: string;
  recipientUserId: string;
  artistName: string;
  companyName: string;
}): Promise<SendPopokEmailResult> {
  const email = await getAccountEmailByOwnerId(params.recipientUserId);
  const content = buildArtistCompanyConnectionApprovedEmail({
    artistName: params.artistName,
    companyName: params.companyName,
  });
  return sendPopokEmail({
    to: email || "",
    ...content,
    eventKey: "artist_company_connection_approved",
    entityType: "company_manager_request",
    entityId: params.requestId,
    recipientUserId: params.recipientUserId,
  });
}

/**
 * Fired when an admin publishes a submitted artist profile
 * (app/api/admin/submissions/[id]/route.ts, action: "publish").
 *
 * NOTE: at this point in the flow there is no authenticated account linked
 * to the submission yet (no owner_id — see completion report). The only real
 * address on file is the submission's own `email` field, so that's what's
 * used here rather than an auth.users lookup.
 */
export async function notifyArtistProfileApproved(params: {
  submissionId: string;
  submissionEmail: string;
  artistName: string;
}): Promise<SendPopokEmailResult> {
  const content = buildArtistProfileApprovedEmail({ artistName: params.artistName });
  return sendPopokEmail({
    to: params.submissionEmail || "",
    ...content,
    eventKey: "artist_profile_approved",
    entityType: "artist_application",
    entityId: params.submissionId,
  });
}

/**
 * Fired when an admin publishes a company (app/api/admin/companies/[id]/publish/route.ts)
 * — the moment the page actually goes live, not the earlier "application
 * approved -> draft company created" step (see completion report for why).
 *
 * NOTE: same caveat as notifyArtistProfileApproved — no authenticated account
 * is linked to the organization_applications row at this point, so this
 * sends to the application's own `email` field.
 */
export async function notifyCompanyProfileApproved(params: {
  companyId: string;
  applicantEmail: string;
  recipientName: string;
  companyName: string;
}): Promise<SendPopokEmailResult> {
  const content = buildCompanyProfileApprovedEmail({
    recipientName: params.recipientName,
    companyName: params.companyName,
  });
  return sendPopokEmail({
    to: params.applicantEmail || "",
    ...content,
    eventKey: "company_profile_approved",
    entityType: "company",
    entityId: params.companyId,
  });
}

/** Fired right after a company_portfolio_requests row is actually inserted
 * (never on the idempotent "already sent" branch — see call site). */
export async function notifyCompanyPortfolioRequestReceived(params: {
  requestId: string;
  companyId: string;
  companyName: string;
  senderArtistName: string;
  message?: string | null;
}): Promise<SendPopokEmailResult | void> {
  const supabase = getSupabaseServer();
  const { data: repRelation } = await supabase
    .from("artist_companies" as any)
    .select("artists(id, name, owner_id)")
    .eq("company_id", params.companyId)
    .eq("is_current", true)
    .eq("is_primary", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const rep = (repRelation as any)?.artists;
  if (!rep) {
    await logSkippedNoRecipient({
      eventKey: "company_portfolio_request_received",
      entityType: "company_portfolio_request",
      entityId: params.requestId,
    });
    return;
  }

  const email = rep.owner_id ? await getAccountEmailByOwnerId(String(rep.owner_id)) : null;
  const content = buildCompanyPortfolioRequestReceivedEmail({
    representativeName: rep.name || "대표자",
    senderArtistName: params.senderArtistName,
    companyName: params.companyName,
    message: params.message,
  });
  return sendPopokEmail({
    to: email || "",
    ...content,
    eventKey: "company_portfolio_request_received",
    entityType: "company_portfolio_request",
    entityId: params.requestId,
    recipientUserId: rep.owner_id ? String(rep.owner_id) : null,
  });
}

/** Fired right after an artist_portfolio_requests row is actually inserted. */
export async function notifyArtistPortfolioRequestReceived(params: {
  requestId: string;
  recipientArtistId: string;
  recipientArtistName: string;
  senderArtistName: string;
  message?: string | null;
}): Promise<SendPopokEmailResult> {
  const supabase = getSupabaseServer();
  const { data: recipientRow } = await supabase
    .from("artists" as any)
    .select("owner_id")
    .eq("id", params.recipientArtistId)
    .maybeSingle();

  const ownerId = (recipientRow as any)?.owner_id ? String((recipientRow as any).owner_id) : null;
  const email = ownerId ? await getAccountEmailByOwnerId(ownerId) : null;
  const content = buildArtistPortfolioRequestReceivedEmail({
    recipientArtistName: params.recipientArtistName,
    senderArtistName: params.senderArtistName,
    message: params.message,
  });
  return sendPopokEmail({
    to: email || "",
    ...content,
    eventKey: "artist_portfolio_request_received",
    entityType: "artist_portfolio_request",
    entityId: params.requestId,
    recipientUserId: ownerId,
  });
}
