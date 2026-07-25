import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import {
  buildArtistUpdateFromPayload,
  normalizeArtistRepresentativeImages,
} from "@/lib/artist-profile";
import { normalizeWorks } from "@/lib/works";

export const dynamic = "force-dynamic";

// GET: Retrieve the logged-in user's artist profile
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { data: artist, error: artistError } = await supabase
      .from("artists")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (artistError) {
      console.error("[GET /api/artists/me] DB query error:", artistError);
      return NextResponse.json({ success: false, error: "아티스트 조회에 실패했습니다." }, { status: 500 });
    }

    if (artist) {
      artist.profile_image_urls = normalizeArtistRepresentativeImages(artist.profile_image_urls);
      artist.works = normalizeWorks(artist.works);
    }

    return NextResponse.json({ success: true, data: artist });
  } catch (err: any) {
    console.error("[GET /api/artists/me] Catch error:", err);
    return NextResponse.json({ success: false, error: "서버 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST: Update the logged-in user's artist profile
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const updatePayload = await request.json();

    // Query to check if the user actually owns the artist profile they are trying to update
    const { data: existingArtist, error: existingError } = await supabase
      .from("artists")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (existingError || !existingArtist) {
      return NextResponse.json({ success: false, error: "수정할 아티스트 프로필이 존재하지 않습니다." }, { status: 404 });
    }

    const { updateData, error: buildError } = buildArtistUpdateFromPayload(updatePayload);
    if (buildError) {
      return NextResponse.json({ success: false, error: buildError }, { status: 400 });
    }

    // Apply strict check on owner_id to prevent users from updating other records
    const { data: updatedArtist, error: updateError } = await supabase
      .from("artists")
      .update(updateData)
      .eq("id", existingArtist.id)
      .eq("owner_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("[POST /api/artists/me] Update error:", updateError);
      return NextResponse.json({ success: false, error: "아티스트 프로필 수정에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updatedArtist });
  } catch (err: any) {
    console.error("[POST /api/artists/me] Catch error:", err);
    return NextResponse.json({ success: false, error: "서버 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

