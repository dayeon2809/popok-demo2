import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { isSafeRelativeRedirect } from "@/lib/safeRedirect";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectParam = searchParams.get("redirect");
  const returnPath = isSafeRelativeRedirect(redirectParam) ? redirectParam : null;

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "popok.kr";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const origin = `${proto}://${host}`;

  // 예전에는 여기서부터 흐름 전체를 console.error 로 찍었고, 그 안에는
  // exchangeCodeForSession 이 돌려준 사용자 객체(이메일·메타데이터)와 artists
  // 행이 통째로 들어갔다. 로그는 배포 플랫폼에 남고 보존 기간도 우리가 정하지
  // 않으므로, 개인정보는 넣지 않는다. 진단에 필요한 것은 "어느 갈래로 갔는가"
  // 뿐이라 그것만 남긴다.

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (authError) {
      console.error("[Auth Callback] exchangeCodeForSession failed:", authError.message);
    }

    if (!authError && authData?.user) {
      // Query artists table to determine onboarding redirect
      const { data: artist, error: artistError } = await supabase
        .from("artists")
        .select("id")
        .eq("owner_id", authData.user.id)
        .maybeSingle();

      if (artistError) {
        console.error("[Auth Callback] artists lookup failed:", artistError.message);
      }

      if (artistError || !artist) {
        let reason = "unknown";
        if (artistError) reason = "artist_query_error";
        else if (!artist) reason = "artist_not_found";

        console.log("[Auth Callback] -> /onboarding:", reason);
        return NextResponse.redirect(`${origin}${returnPath || "/onboarding"}`);
      }

      const destination = returnPath || "/my-popok";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Redirect to an error page if auth fails
  console.warn("[Auth Callback] failed — code present:", !!code);
  return NextResponse.redirect(`${origin}/auth?error=auth_callback_failed`);
}
