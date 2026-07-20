export type EmailNotificationEvent =
  | "artist_company_connection_approved"
  | "artist_profile_approved"
  | "company_profile_approved"
  | "company_portfolio_request_received"
  | "artist_portfolio_request_received";

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
}

export interface SendPopokEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  /** true when this call was a no-op because the (event, entity, recipient) tuple was already logged */
  skipped?: boolean;
}
