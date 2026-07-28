import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/admin";

// No requireAdminApi() guard here either — logging out should work even if
// the session cookie is already invalid/expired (just clears it either way).
export const dynamic = "force-dynamic";

export async function POST() {
  await clearAdminSessionCookie();
  return NextResponse.json({ success: true });
}
