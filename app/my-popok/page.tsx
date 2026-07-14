import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import MyPopokClient from "./MyPopokClient";

export const dynamic = "force-dynamic";

export default async function MyPopokPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth");
  }

  // Query artists table for owner_id = user.id
  const { data: artist, error: artistError } = await supabase
    .from("artists")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (artistError) {
    console.error("[MyPopokPage] Query artist error:", artistError);
  }

  if (!artist) {
    redirect("/onboarding");
  }

  // profile_type (개인/단체) is chosen during onboarding step 1 but only ever
  // saved to profiles.profile_type, never copied onto the artists row — fetch
  // it separately so the dashboard can show what the user picked.
  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_type")
    .eq("id", user.id)
    .maybeSingle();

  return <MyPopokClient initialArtist={artist} profileType={profile?.profile_type ?? null} />;
}
