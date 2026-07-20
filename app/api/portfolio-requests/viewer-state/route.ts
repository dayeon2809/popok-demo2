import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getPortfolioRequestViewerState, type PortfolioRequestTargetType } from "@/lib/portfolioRequestsServer";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Client-fetch counterpart to getPortfolioRequestViewerState() for pages that
// can't compute it server-side before first paint — currently just
// app/artists/[id]/page.tsx, which is a client component (unlike the company
// detail page, which is a server component and calls the shared function
// directly). Accepts a slug OR uuid for an artist target, resolved here so
// the client never needs to know the difference.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("targetType") as PortfolioRequestTargetType | null;
  const targetId = searchParams.get("targetId");

  if (targetType !== "company" && targetType !== "artist") {
    return NextResponse.json({ success: false, error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (!targetId) {
    return NextResponse.json({ success: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  try {
    let resolvedId = targetId;
    if (targetType === "artist" && !UUID_RE.test(targetId)) {
      const supabase = getSupabaseServer();
      const { data } = await supabase.from("artists" as any).select("id").eq("slug", targetId).maybeSingle();
      if (!data) {
        return NextResponse.json({ success: true, data: { isLoggedIn: false, artist: null, existingRequestStatus: null, isSelf: false } });
      }
      resolvedId = String((data as any).id);
    }

    const state = await getPortfolioRequestViewerState({ type: targetType, id: resolvedId });
    return NextResponse.json({ success: true, data: state });
  } catch (err: any) {
    console.error("[GET /api/portfolio-requests/viewer-state] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
