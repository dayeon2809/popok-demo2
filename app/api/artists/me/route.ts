import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

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

    const {
      name,
      name_en,
      bio,
      bio_short,
      genre,
      role,
      profile_image_url,
      motion_video_url,
      youtube_url,
      instagram,
      website,
      works,
      affiliations,
      education,
      awards,
      competitions,
      links,
      slug
    } = updatePayload;

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (name_en !== undefined) updateData.name_en = name_en;
    if (bio !== undefined) updateData.bio = bio;
    if (bio_short !== undefined) updateData.bio_short = bio_short;
    if (genre !== undefined) updateData.genre = genre;
    if (role !== undefined) updateData.role = role;
    if (profile_image_url !== undefined) updateData.profile_image_url = profile_image_url;
    if (motion_video_url !== undefined) updateData.motion_video_url = motion_video_url;
    if (youtube_url !== undefined) updateData.youtube_url = youtube_url;
    if (instagram !== undefined) updateData.instagram = instagram;
    if (website !== undefined) updateData.website = website;
    if (works !== undefined) updateData.works = works;
    if (affiliations !== undefined) updateData.affiliations = affiliations;
    if (education !== undefined) updateData.education = education;
    if (awards !== undefined) updateData.awards = awards;
    if (competitions !== undefined) updateData.competitions = competitions;
    if (links !== undefined) updateData.links = links;
    
    if (slug !== undefined) {
      // Validate slug format
      const cleanSlug = slug.trim().toLowerCase();
      const slugRegex = /^[a-z0-9-]+$/;
      if (cleanSlug.length < 3 || !slugRegex.test(cleanSlug)) {
        return NextResponse.json({ success: false, error: "주소 형식이 올바르지 않습니다. (최소 3자, 영문 소문자/숫자/하이픈만 가능)" }, { status: 400 });
      }
      updateData.slug = cleanSlug;
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
