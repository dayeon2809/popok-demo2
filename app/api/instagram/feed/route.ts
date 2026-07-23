import { NextResponse } from "next/server";
import { getWeeklyStories } from "@/lib/instagram";

export const dynamic = "force-dynamic";

// GET — @popok.official's latest normalized posts for the homepage's
// "이주의 소식" section. Not on the homepage's actual render path (app/page.tsx
// calls getWeeklyStories() directly, server-to-server, no HTTP round trip) —
// this thin wrapper exists for manual verification (curl) and as a stable
// contract if a client-side refresh/retry is ever added later.
export async function GET() {
  const stories = await getWeeklyStories();
  return NextResponse.json({ data: stories, error: null });
}
