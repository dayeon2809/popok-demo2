import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

// Single-password admin auth — replaces the earlier Supabase-session +
// ADMIN_EMAIL allowlist scheme. Every /admin page (via the (protected)
// route group's layout) and every /api/admin/** route call into this same
// module (requireAdmin / requireAdminApi), so there is exactly one place
// that decides who's an admin.
//
// The session cookie is not a bare "true" flag — it's `${expiresAt}.${hmac}`,
// an HMAC-SHA256 signature over the expiry timestamp keyed by
// ADMIN_SESSION_SECRET (server-only env var). Forging or extending a cookie
// requires the secret; tampering with expiresAt invalidates the signature.

const ADMIN_SESSION_COOKIE = "popok_admin_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const ADMIN_SESSION_MAX_AGE_SECONDS = Math.floor(SESSION_DURATION_MS / 1000);

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Buffers of different length would throw in timingSafeEqual — this
  // length check is on public-length data (signature/password length), not
  // on the secret itself, so it doesn't leak anything worth hiding.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function sign(message: string, secret: string): string {
  return createHmac("sha256", secret).update(message).digest("base64url");
}

function createAdminSessionToken(secret: string): string {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  return `${expiresAt}.${sign(`admin:${expiresAt}`, secret)}`;
}

function verifyAdminSessionToken(token: string | undefined, secret: string): boolean {
  if (!token) return false;
  const separatorIndex = token.indexOf(".");
  if (separatorIndex === -1) return false;

  const expiresAtRaw = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expiresAt = Number(expiresAtRaw);
  if (!expiresAtRaw || !signature || !Number.isFinite(expiresAt)) return false;
  if (Date.now() > expiresAt) return false;

  return timingSafeStringEqual(signature, sign(`admin:${expiresAt}`, secret));
}

/** Compares a submitted password against ADMIN_PASSWORD in constant time. */
export function verifyAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    console.error("[admin-auth] ADMIN_PASSWORD is not configured. Admin login is disabled.");
    return false;
  }
  return timingSafeStringEqual(candidate, expected);
}

/** Issues the signed admin session cookie — call only from a Route Handler (e.g. the login route). */
export async function setAdminSessionCookie(): Promise<void> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("[admin-auth] ADMIN_SESSION_SECRET is not configured.");
  }
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
}

/** Clears the admin session cookie — call only from a Route Handler (e.g. the logout route). */
export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    console.error("[admin-auth] ADMIN_SESSION_SECRET is not configured. Admin access is disabled.");
    return false;
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token, secret);
}

/** Server-only page guard — put at the top of the protected admin layout. */
export async function requireAdmin(): Promise<void> {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/admin/login");
  }
}

/** Server-only API guard — call at the top of every /api/admin/** Route Handler. */
export async function requireAdminApi(): Promise<NextResponse | null> {
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json(
      { success: false, error: "Admin authentication is not configured." },
      { status: 500 },
    );
  }

  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
