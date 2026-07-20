import { NextResponse } from "next/server";
import { createServerSupabaseClient, getSupabaseServer } from "@/lib/supabaseServer";
import {
  cleanArtistEducationForPayload,
  cleanArtistCurrentActivityForPayload,
  cleanArtistAffiliationsForPayload,
  cleanArtistAwardsForPayload,
  cleanArtistCompetitionsForPayload,
} from "@/lib/artist-profile";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      displayName,
      username,
      genre,
      role,
      bio,
      bio_short,
      works,
      affiliations,
      current_activity,
      awards,
      competitions,
      education,
      links
    } = body;

    // /onboarding is individual-artist-only — organizations apply via
    // /api/organizations/apply instead, so profileType is fixed here rather
    // than trusted from the client.
    const profileType = "artist";

    if (!displayName || !username || !genre || !role) {
      return NextResponse.json({ success: false, error: "모든 항목을 입력해 주세요." }, { status: 400 });
    }

    // 1. Validate username rules
    const usernameRegex = /^[a-z0-9-]+$/;
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || !usernameRegex.test(cleanUsername)) {
      return NextResponse.json({ success: false, error: "주소 형식이 올바르지 않습니다." }, { status: 400 });
    }

    const reservedWords = [
      "admin", "api", "auth", "login", "signup", "artists", "submit", "recommend", "onboarding", "my-popok"
    ];
    if (reservedWords.includes(cleanUsername)) {
      return NextResponse.json({ success: false, error: "사용할 수 없는 주소 이름입니다." }, { status: 400 });
    }

    // 2. Perform duplicate checks using admin client (to bypass SELECT RLS restriction on profiles)
    const adminSupabase = getSupabaseServer();

    const { data: existingProfile } = await adminSupabase
      .from("profiles")
      .select("username")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({ success: false, error: "이미 사용 중인 주소입니다." }, { status: 400 });
    }

    const { data: existingArtist } = await adminSupabase
      .from("artists")
      .select("slug")
      .eq("slug", cleanUsername)
      .maybeSingle();

    if (existingArtist) {
      return NextResponse.json({ success: false, error: "이미 사용 중인 주소입니다." }, { status: 400 });
    }

    // 3. Update profiles table using User Client (respecting RLS)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        profile_type: profileType,
        display_name: displayName.trim(),
        username: cleanUsername,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("[Onboarding API] Profile update error:", profileError);
      return NextResponse.json({ success: false, error: "계정 정보 업데이트에 실패했습니다." }, { status: 500 });
    }

    // 4. Create new artist record using User Client (respecting RLS)
    const newArtist = {
      owner_id: user.id,
      name: displayName.trim(),
      slug: cleanUsername,
      genre: genre.trim(),
      role: role.trim(),
      status: "draft",
      verified: false,
      bio: typeof bio === "string" ? bio : null,
      bio_short: typeof bio_short === "string" ? bio_short : null,
      works: Array.isArray(works) ? works : [],
      affiliations: cleanArtistAffiliationsForPayload(affiliations),
      current_activity: cleanArtistCurrentActivityForPayload(current_activity),
      awards: cleanArtistAwardsForPayload(awards),
      competitions: cleanArtistCompetitionsForPayload(competitions),
      education: cleanArtistEducationForPayload(education),
      links: Array.isArray(links) ? links : [],
    };

    const { data: artistData, error: artistError } = await supabase
      .from("artists")
      .insert(newArtist)
      .select("id")
      .single();

    if (artistError) {
      console.error("[Onboarding API] Artist insert error:", artistError);
      // Rollback profile onboarding status
      await supabase
        .from("profiles")
        .update({ onboarding_completed: false })
        .eq("id", user.id);

      return NextResponse.json({ success: false, error: "아티스트 정보 생성에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true, artistId: artistData?.id });
  } catch (err: any) {
    console.error("[Onboarding API] Catch error:", err);
    return NextResponse.json({ success: false, error: err.message || "서버 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
