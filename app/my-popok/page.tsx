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

  return <MyPopokClient initialArtist={artist} />;
}
