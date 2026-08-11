import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// "보낸 포퐄" — merges both request types the viewer has sent, tagged
// `type: "company" | "artist"`. Includes withdrawn requests (own history).
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

    const { data: companyData, error: companyErr } = await supabase
      .from("company_portfolio_requests" as any)
      .select("id, message, status, created_at, updated_at, companies(id, name, slug, profile_image_url, brand_color)")
      .eq("artist_id", myArtistId)
      .order("created_at", { ascending: false });

    if (companyErr) {
      console.error("[GET /api/portfolio-requests/sent] company query error:", companyErr);
    }

    const companyRequests = (companyData || []).map((r: any) => ({
      type: "company" as const,
      id: String(r.id),
      message: r.message || null,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      to: r.companies
        ? { id: String(r.companies.id), name: r.companies.name || "", slug: r.companies.slug || null, profile_image_url: r.companies.profile_image_url || null }
        : null,
    }));

    const { data: artistData, error: artistErr } = await supabase
      .from("artist_portfolio_requests" as any)
      .select("id, message, status, created_at, updated_at, artists!recipient_artist_id(id, name, slug, role, genre, profile_image_url)")
      .eq("sender_artist_id", myArtistId)
      .order("created_at", { ascending: false });

    if (artistErr) {
      console.error("[GET /api/portfolio-requests/sent] artist query error:", artistErr);
    }

    const artistRequests = (artistData || []).map((r: any) => ({
      type: "artist" as const,
      id: String(r.id),
      message: r.message || null,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      to: r.artists
        ? { id: String(r.artists.id), name: r.artists.name || "", slug: r.artists.slug || null, profile_image_url: r.artists.profile_image_url || null }
        : null,
    }));

    const merged = [...companyRequests, ...artistRequests].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ success: true, data: merged });
  } catch (err: any) {
    console.error("[GET /api/portfolio-requests/sent] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
