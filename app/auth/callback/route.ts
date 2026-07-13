import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  console.log("[Auth Callback] Received request. Code presence:", !!code);

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);

    console.error("[Auth Callback] exchangeCodeForSession() Auth Error:", authError);
    console.error("[Auth Callback] exchangeCodeForSession() User:", authData?.user);

    if (!authError && authData?.user) {
      // Query artists table to determine onboarding redirect
      const { data: artist, error: artistError } = await supabase
        .from("artists")
        .select("id")
        .eq("owner_id", authData.user.id)
        .maybeSingle();

      console.error("[Auth Callback] Artists query error:", artistError);
      console.error("[Auth Callback] Artists query data:", artist);

      if (artistError || !artist) {
        let reason = "unknown";
        if (artistError) reason = "artist_query_error";
        else if (!artist) reason = "artist_not_found";

        console.error("[Auth Callback] Redirecting to /onboarding. Reason:", reason);
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      console.error("[Auth Callback] Redirecting to /my-popok. Reason: artist exists");
      return NextResponse.redirect(`${origin}/my-popok`);
    } else {
      console.error("[Auth Callback] Failed: authError is present or user is null.");
    }
  } else {
    console.error("[Auth Callback] Failed: No code provided in URL search params.");
  }

  // Redirect to an error page if auth fails
  console.error("[Auth Callback] Redirecting to /auth?error=auth_callback_failed");
  return NextResponse.redirect(`${origin}/auth?error=auth_callback_failed`);
}
