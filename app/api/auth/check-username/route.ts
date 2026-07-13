import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim().toLowerCase();

  if (!username) {
    return NextResponse.json({ available: false, message: "주소를 입력해 주세요." });
  }

  // Enforce format rules:
  // - 영문 소문자, 숫자, 하이픈(-), 최소 3자, 공백 불가
  const usernameRegex = /^[a-z0-9-]+$/;
  if (username.length < 3) {
    return NextResponse.json({ available: false, message: "최소 3자 이상 입력해 주세요." });
  }

  if (!usernameRegex.test(username)) {
    return NextResponse.json({ available: false, message: "영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다." });
  }

  const reservedWords = [
    "admin", "api", "auth", "login", "signup", "artists", "submit", "recommend", "onboarding", "my-popok"
  ];
  if (reservedWords.includes(username)) {
    return NextResponse.json({ available: false, message: "사용할 수 없는 예약어입니다." });
  }

  try {
    const adminSupabase = getSupabaseServer();

    // Check profiles.username
    const { data: existingProfile, error: profileErr } = await adminSupabase
      .from("profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (profileErr) {
      return NextResponse.json({ available: false, message: "검사 중 오류가 발생했습니다." });
    }

    if (existingProfile) {
      return NextResponse.json({ available: false, message: "이미 사용 중인 주소입니다." });
    }

    // Check artists.slug
    const { data: existingArtist, error: artistErr } = await adminSupabase
      .from("artists")
      .select("slug")
      .eq("slug", username)
      .maybeSingle();

    if (artistErr) {
      return NextResponse.json({ available: false, message: "검사 중 오류가 발생했습니다." });
    }

    if (existingArtist) {
      return NextResponse.json({ available: false, message: "이미 사용 중인 주소입니다." });
    }

    return NextResponse.json({ available: true, message: "사용 가능한 주소입니다." });
  } catch (err: any) {
    return NextResponse.json({ available: false, message: "서버 오류가 발생했습니다." });
  }
}
