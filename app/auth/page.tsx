import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import AuthClient from "./AuthClient";
import { isSafeRelativeRedirect } from "@/lib/safeRedirect";

export const dynamic = "force-dynamic";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectParam } = await searchParams;
  const returnPath = isSafeRelativeRedirect(redirectParam) ? redirectParam! : null;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Already logged in and landed on /auth anyway (e.g. an already-authenticated
    // tab following a "포퐄 보내기" login link) — check onboarding state to
    // decide where to send them, honoring the return path when there is one.
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.onboarding_completed) {
      redirect(returnPath || "/my-popok");
    } else {
      redirect("/onboarding");
    }
  }

  return <AuthClient returnPath={returnPath} />;
}
