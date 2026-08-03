import { Resend } from "resend";

let _resend: Resend | null | undefined;

/** Returns null (never throws) when RESEND_API_KEY isn't set — callers must
 * treat a null client as "email sending is not configured", not an error. */
export function getResendClient(): Resend | null {
  if (_resend !== undefined) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  _resend = apiKey ? new Resend(apiKey) : null;
  return _resend;
}

/** `onboarding@resend.dev` is Resend's shared test sender, usable with zero
 * domain setup — a convenient default for local/preview dev. Production must
 * never fall back to it silently: that sender can only deliver to the
 * Resend account owner's own address, so a silent fallback in prod wouldn't
 * fail loudly — it would just look like sends to real recipients randomly
 * get rejected. Returns null in production when POPOK_EMAIL_FROM isn't set,
 * so callers can treat that as a real config error instead. */
export function getEmailFrom(): string | null {
  const configured = process.env.POPOK_EMAIL_FROM;
  if (configured) return configured;
  if (process.env.VERCEL_ENV === "production") return null;
  return "POPOK <onboarding@resend.dev>";
}

/** Optional reply-to address for outbound POPOK emails (e.g. an inbox the
 * team actually monitors). Unset by default — Resend omits reply-to
 * entirely when this is undefined, so existing sends are unaffected. */
export function getEmailReplyTo(): string | undefined {
  return process.env.POPOK_EMAIL_REPLY_TO || undefined;
}

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://popok.kr").replace(/\/+$/, "");
}
