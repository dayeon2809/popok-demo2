export type EmailNotificationEvent =
  | "artist_company_connection_approved"
  | "artist_profile_approved"
  | "company_profile_approved"
  | "company_portfolio_request_received"
  | "artist_portfolio_request_received"
  | "portfolio_request_accepted"
  | "message_received"
  | "onboarding_reminder";

export type EmailNotificationStatus =
  | "pending"
  | "sent"
  | "failed"
  | "skipped_no_recipient"
  | "skipped_no_email"
  | "skipped_not_configured";

export interface SendPopokEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  eventKey: EmailNotificationEvent;
  /** e.g. "company_manager_request", "submission", "company", "company_portfolio_request", "artist_portfolio_request" */
  entityType: string;
  entityId: string;
  recipientUserId?: string | null;
  notificationType?: "request_received" | "request_accepted";
  conversationId?: string | null;
}

export interface SendPopokEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  /** true when this call was a no-op because the (event, entity, recipient) tuple was already logged */
  skipped?: boolean;
  /** Resend's error.name / error.statusCode — present only on a provider-side rejection, lets callers classify the failure without re-parsing `error`. */
  errorName?: string;
  statusCode?: number;
  /** "not_configured": never reached Resend (no RESEND_API_KEY). "provider_error": Resend accepted the request but rejected/failed the send. */
  failureKind?: "not_configured" | "provider_error";
}
