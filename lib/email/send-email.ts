import { getSupabaseServer } from "@/lib/supabaseServer";
import { getResendClient, getEmailFrom, getEmailReplyTo } from "./client";
import type { SendPopokEmailParams, SendPopokEmailResult } from "./types";
function maskEmail(email?: string | null): string | null {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 2)}***@${domain}`;
}

function logEmailOutcome(params: SendPopokEmailParams, details: {
  success: boolean;
  providerErrorMessage?: string | null;
  providerErrorCode?: string | number | null;
  skippedReason?: string | null;
}) {
  const payload = {
    notification_type: params.notificationType || params.eventKey,
    success: details.success,
    provider: "resend",
    provider_error_message: details.providerErrorMessage || null,
    provider_error_code: details.providerErrorCode || null,
    skipped_reason: details.skippedReason || null,
    recipient_exists: Boolean(params.to?.trim()),
    recipient_email_masked: maskEmail(params.to),
    request_id: params.entityId,
    conversation_id_exists: Boolean(params.conversationId),
  };
  if (details.success) console.info("[email] notification outcome", payload);
  else console.error("[email] notification outcome", payload);
}

/**
 * The one place every transactional email in POPOK goes through. Never
 * throws — a failure here must never take down the approval/portfolio-request
 * flow that triggered it (see callers: they call this *after* their own DB
 * write has already succeeded, and ignore/log the result rather than
 * propagating it as a request failure).
 *
 * Idempotency: attempts an INSERT into email_notification_logs first, using
 * the (event_key, entity_type, entity_id, recipient_email) unique index as
 * the concurrency guard — exactly the same "insert first, treat 23505 as
 * already-handled" pattern used for portfolio-request duplicate prevention
 * elsewhere in this codebase. If a log row already exists in ANY status for
 * this tuple (sent, failed, skipped_*), this is a no-op: `skipped: true`.
 */
export async function sendPopokEmail(params: SendPopokEmailParams): Promise<SendPopokEmailResult> {
  const supabase = getSupabaseServer();

  if (!params.to || !params.to.trim()) {
    await logAttempt(supabase, params, "skipped_no_email", null);
    logEmailOutcome(params, { success: false, skippedReason: "no_recipient_email" });
    return { success: false, error: "no recipient email", skipped: true };
  }

  const resend = getResendClient();
  const from = getEmailFrom();
  if (!resend || !from) {
    const missing = !resend ? "RESEND_API_KEY_missing" : "POPOK_EMAIL_FROM_missing_in_production";
    console.log(
      `[email] ${missing} — skipping "${params.eventKey}" for ${params.entityType}/${params.entityId}`
    );
    await logAttempt(supabase, params, "skipped_not_configured", null);
    logEmailOutcome(params, { success: false, skippedReason: missing });
    return { success: false, error: "email sending not configured", skipped: true, failureKind: "not_configured" };
  }

  // Claim the idempotency slot before actually sending.
  const { data: logRow, error: insertErr } = await (supabase.from("email_notification_logs" as any) as any)
    .insert({
      event_key: params.eventKey,
      entity_type: params.entityType,
      entity_id: params.entityId,
      recipient_user_id: params.recipientUserId || null,
      recipient_email: params.to,
      provider: "resend",
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr) {
    if ((insertErr as any).code === "23505") {
      // Already attempted for this exact (event, entity, recipient) tuple —
      // don't resend, but don't blindly report success either: the existing
      // row could be from a PRIOR FAILED attempt (e.g. a rejected send while
      // the sender domain was misconfigured), in which case reporting
      // success here would be a false positive — the caller/UI would show
      // "sent" while Resend never actually delivered anything.
      const { data: existing } = await (supabase.from("email_notification_logs" as any) as any)
        .select("status, provider_message_id")
        .eq("event_key", params.eventKey)
        .eq("entity_type", params.entityType)
        .eq("entity_id", params.entityId)
        .eq("recipient_email", params.to)
        .maybeSingle();

      if ((existing as any)?.status === "sent" && (existing as any)?.provider_message_id) {
        return { success: true, skipped: true, messageId: (existing as any).provider_message_id };
      }
      return {
        success: false,
        skipped: true,
        error: "a previous attempt for this recipient did not succeed and was not retried",
        failureKind: "provider_error",
      };
    }
    console.error("[email] Failed to write notification log:", insertErr.message);
    return { success: false, error: "failed to record notification log" };
  }

  const logId = (logRow as any).id;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: getEmailReplyTo(),
    });

    // Resend's own contract is "error is null iff data.id is present", but
    // that's trusted implicitly nowhere else in this codebase — check both
    // explicitly so a malformed/empty response can never read as success.
    if (error || !data?.id) {
      const message = error?.message || "Resend returned no message id";
      await updateLogStatus(supabase, logId, "failed", undefined, message);
      logEmailOutcome(params, { success: false, providerErrorMessage: message, providerErrorCode: (error as any)?.name || (error as any)?.statusCode });
      return {
        success: false,
        error: message,
        errorName: (error as any)?.name,
        statusCode: (error as any)?.statusCode,
        failureKind: "provider_error",
      };
    }

    await updateLogStatus(supabase, logId, "sent", data.id);
    logEmailOutcome(params, { success: true });
    return { success: true, messageId: data.id };
  } catch (err: any) {
    const message = err?.message || String(err);
    await updateLogStatus(supabase, logId, "failed", undefined, message);
    logEmailOutcome(params, { success: false, providerErrorMessage: message, providerErrorCode: err?.code || err?.statusCode || err?.name });
    return {
      success: false,
      error: message,
      errorName: err?.name,
      statusCode: err?.statusCode,
      failureKind: "provider_error",
    };
  }
}

async function logAttempt(
  supabase: ReturnType<typeof getSupabaseServer>,
  params: SendPopokEmailParams,
  status: "skipped_no_email" | "skipped_no_recipient" | "skipped_not_configured",
  providerMessageId: string | null | undefined
) {
  try {
    await (supabase.from("email_notification_logs" as any) as any).insert({
      event_key: params.eventKey,
      entity_type: params.entityType,
      entity_id: params.entityId,
      recipient_user_id: params.recipientUserId || null,
      recipient_email: params.to || null,
      provider: "resend",
      provider_message_id: providerMessageId || null,
      status,
    });
  } catch {
    // Best-effort logging only — never let a logging failure surface as a
    // real error to a caller that already succeeded at its actual DB write.
  }
}

async function updateLogStatus(
  supabase: ReturnType<typeof getSupabaseServer>,
  logId: string,
  status: "sent" | "failed",
  providerMessageId?: string,
  errorMessage?: string
) {
  try {
    await (supabase.from("email_notification_logs" as any) as any)
      .update({
        status,
        provider_message_id: providerMessageId || null,
        error_message: errorMessage || null,
      })
      .eq("id", logId);
  } catch (err) {
    console.error("[email] Failed to update notification log status:", err);
  }
}

/**
 * For callers that know upfront there's no recipient at all (e.g. a company
 * with no current representative) — logs `skipped_no_recipient` without
 * attempting to send anything. Distinct from sendPopokEmail's own
 * `skipped_no_email` (a recipient exists but has no email on file).
 */
export async function logSkippedNoRecipient(params: Omit<SendPopokEmailParams, "to" | "subject" | "html" | "text">) {
  const supabase = getSupabaseServer();
  await logAttempt(supabase, { ...params, to: "", subject: "", html: "" }, "skipped_no_recipient", null);
}
