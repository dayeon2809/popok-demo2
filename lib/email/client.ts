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
 * domain setup — the safe default for any environment that hasn't verified
 * popok.kr with Resend yet. Production must set POPOK_EMAIL_FROM to a
 * popok.kr address once that domain is verified. */
export function getEmailFrom(): string {
  return process.env.POPOK_EMAIL_FROM || "POPOK <onboarding@resend.dev>";
}

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://popok.kr").replace(/\/+$/, "");
}
