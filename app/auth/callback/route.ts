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

  console.log("[Auth Callback] Received request. Code presence:", !!code, "Computed Origin:", origin);

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

      const destination = returnPath || "/my-popok";
      console.error("[Auth Callback] Redirecting to", destination, ". Reason: artist exists");
      return NextResponse.redirect(`${origin}${destination}`);
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
