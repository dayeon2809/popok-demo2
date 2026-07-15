import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const GENERIC_ERROR = "조회수를 기록하지 못했습니다.";

// Atomic: increment_artist_view_count() does the "published + exists" check
// and the "+1" in a single UPDATE, so there's no read-then-write race between
// concurrent requests. See supabase/migrations/add_artist_view_count.sql.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const identifier = decodeURIComponent(id).trim();

  if (!identifier) {
    return NextResponse.json({ success: false, error: "아티스트 식별자가 필요합니다." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await (supabase.rpc as any)("increment_artist_view_count", { identifier });

    if (error) {
      console.error(`[POST /api/artists/${identifier}/view] RPC error:`, error);
      return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 500 });
    }

    // NULL means no published row matched — draft artist or nonexistent id/slug.
    if (data == null) {
      return NextResponse.json({ success: false, error: "조회수를 기록할 수 없는 아티스트입니다." }, { status: 404 });
    }

    return NextResponse.json({ success: true, view_count: data });
  } catch (err: any) {
    console.error(`[POST /api/artists/${identifier}/view] Catch error:`, err);
    return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 500 });
  }
}
