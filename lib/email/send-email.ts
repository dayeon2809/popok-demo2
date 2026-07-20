import { getSupabaseServer } from "@/lib/supabaseServer";
import { getResendClient, getEmailFrom } from "./client";
import type { SendPopokEmailParams, SendPopokEmailResult } from "./types";

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
    return { success: false, error: "no recipient email", skipped: true };
  }

  const resend = getResendClient();
  if (!resend) {
    console.log(
      `[email] RESEND_API_KEY not configured — skipping "${params.eventKey}" for ${params.entityType}/${params.entityId}`
    );
    await logAttempt(supabase, params, "skipped_not_configured", null);
    return { success: false, error: "email sending not configured", skipped: true };
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
      // Already sent/attempted for this exact (event, entity, recipient) — don't resend.
      return { success: true, skipped: true };
    }
    console.error("[email] Failed to write notification log:", insertErr.message);
    return { success: false, error: "failed to record notification log" };
  }

  const logId = (logRow as any).id;

  try {
    const { data, error } = await resend.emails.send({
      from: getEmailFrom(),
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (error) {
      await updateLogStatus(supabase, logId, "failed", undefined, error.message);
      return { success: false, error: error.message };
    }

    await updateLogStatus(supabase, logId, "sent", data?.id);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    const message = err?.message || String(err);
    await updateLogStatus(supabase, logId, "failed", undefined, message);
    return { success: false, error: message };
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
