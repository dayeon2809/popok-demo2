import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import OnboardingClient from "./OnboardingClient";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth");
  }

  // Fetch onboarding state from artists and profiles table
  const { data: artist } = await supabase
    .from("artists")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (artist) {
    redirect("/my-popok");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const defaultEmail = profile?.email || user.email || "";
  const defaultDisplayName = profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || "";

  return (
    <OnboardingClient
      defaultEmail={defaultEmail}
      defaultDisplayName={defaultDisplayName}
    />
  );
}
