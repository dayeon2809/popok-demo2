import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import AuthClient from "./AuthClient";

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // If user is already authenticated, check onboarding state to redirect
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.onboarding_completed) {
      redirect("/my-popok");
    } else {
      redirect("/onboarding");
    }
  }

  return <AuthClient />;
}
