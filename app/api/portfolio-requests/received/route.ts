import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// "받은 포퐄" — merges company_portfolio_requests (sent to a company the
// viewer is CURRENTLY the primary+current rep of) and artist_portfolio_requests
// (sent directly to the viewer's own artist profile) into one list, each
// tagged `type: "company" | "artist"`.
//
// Deliberately does NOT bulk-mark pending -> viewed just because this list
// was fetched — that used to happen here and got flagged as wrong: opening
// the inbox tab shouldn't silently mark everything read. Marking viewed now
// only happens via PATCH /api/portfolio-requests/[id] (status: "viewed"),
// triggered by the client when an individual card is actually opened/clicked
// or "포퐄 보기" is followed.
export async function GET(req: NextRequest) {
  try {
    const supabaseUserClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    const { data: myArtist } = await supabase
      .from("artists" as any)
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!myArtist) {
      return NextResponse.json({ success: true, data: [] });
    }
    const myArtistId = String((myArtist as any).id);

    // ── Company requests: companies I'm currently the primary+current rep of ──
    const { data: repRelations } = await supabase
      .from("artist_companies" as any)
      .select("company_id")
      .eq("artist_id", myArtistId)
      .eq("is_current", true)
      .eq("is_primary", true);

    const companyIds = Array.from(new Set((repRelations || []).map((r: any) => String(r.company_id))));

    let companyRequests: any[] = [];
    if (companyIds.length > 0) {
      const { data, error } = await supabase
        .from("company_portfolio_requests" as any)
        .select(
          "id, company_id, artist_id, message, status, created_at, updated_at, " +
            "artists!artist_id(id, name, name_en, slug, role, genre, profile_image_url), " +
            "companies(id, name, profile_image_url, brand_color)"
        )
        .in("company_id", companyIds)
        .neq("status", "withdrawn")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[GET /api/portfolio-requests/received] company query error:", error);
      } else {
        companyRequests = (data || []).map((r: any) => ({
          type: "company" as const,
          id: String(r.id),
          message: r.message || null,
          status: r.status,
          created_at: r.created_at,
          updated_at: r.updated_at,
          from: r.artists
            ? {
                id: String(r.artists.id),
                name: r.artists.name || "",
                slug: r.artists.slug || null,
                role: r.artists.role || r.artists.genre || null,
                profile_image_url: r.artists.profile_image_url || null,
              }
            : null,
          via: r.companies
            ? { id: String(r.companies.id), name: r.companies.name || "", profile_image_url: r.companies.profile_image_url || null }
            : null,
        }));
      }
    }

    // ── Artist requests: sent directly to my own artist profile ──
    const { data: artistData, error: artistErr } = await supabase
      .from("artist_portfolio_requests" as any)
      .select(
        "id, sender_artist_id, message, status, created_at, updated_at, " +
          "artists!sender_artist_id(id, name, name_en, slug, role, genre, profile_image_url)"
      )
      .eq("recipient_artist_id", myArtistId)
      .neq("status", "withdrawn")
      .order("created_at", { ascending: false });

    if (artistErr) {
      console.error("[GET /api/portfolio-requests/received] artist query error:", artistErr);
    }

    const artistRequests = (artistData || []).map((r: any) => ({
      type: "artist" as const,
      id: String(r.id),
      message: r.message || null,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      from: r.artists
        ? {
            id: String(r.artists.id),
            name: r.artists.name || "",
            slug: r.artists.slug || null,
            role: r.artists.role || r.artists.genre || null,
            profile_image_url: r.artists.profile_image_url || null,
          }
        : null,
      via: null,
    }));

    const merged = [...companyRequests, ...artistRequests].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ success: true, data: merged });
  } catch (err: any) {
    console.error("[GET /api/portfolio-requests/received] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
