import { NextRequest } from "next/server";

// Shared admin auth check — every /api/admin/** route gates writes behind a
// single shared passcode (x-admin-passcode header vs process.env.ADMIN_PASSCODE),
// not a per-user role. Extracted here so new admin routes reuse the exact
// same check rather than re-copying the inline `checkAuth` each existing
// route defines locally.
export function checkAdminAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}
