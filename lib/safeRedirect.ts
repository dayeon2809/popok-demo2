/**
 * Validates a user-supplied "return to this page after login" value.
 * Only a same-origin relative path is ever allowed — rejects anything that
 * could send the browser off-site after auth (protocol-relative `//evil.com`,
 * an absolute URL, backslashes browsers normalize into `//`, or literal
 * whitespace/control characters some browsers still treat as path breaks).
 */
export function isSafeRelativeRedirect(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.startsWith("/\\")) return false;
  if (/[\s\x00-\x1f]/.test(value)) return false;
  return true;
}
