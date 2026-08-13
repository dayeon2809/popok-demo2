import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import OnboardingClient from "./OnboardingClient";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ resume?: string; type?: string }> }) {
  const { resume, type } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // Guests can finish the draft and preview before Google authentication.
  const { data: artist } = user ? await supabase
    .from("artists")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle() : { data: null };

  if (artist) {
    redirect("/my-popok");
  }

  const { data: profile } = user ? await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .maybeSingle() : { data: null };

  const defaultEmail = profile?.email || user?.email || "";
  const defaultDisplayName = profile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "";

  return (
    <OnboardingClient
      defaultEmail={defaultEmail}
      defaultDisplayName={defaultDisplayName}
      isLoggedIn={Boolean(user)}
      shouldResume={resume === "1"}
      startAsIndividual={type === "individual"}
    />
  );
}
