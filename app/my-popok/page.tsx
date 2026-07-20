import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { mapCompanyRowToCompany } from "@/lib/companies";
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

  // Fetch profile details
  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_type")
    .eq("id", user.id)
    .maybeSingle();

  // Fetch companies owned by this user
  const { data: ownedCompaniesRows, error: companiesError } = await supabase
    .from("companies" as any)
    .select("*")
    .eq("owner_id", user.id)
    .order("name", { ascending: true });

  if (companiesError) {
    console.error("[MyPopokPage] Query owned companies error:", companiesError);
  }

  const initialOwnedCompanies = (ownedCompaniesRows || []).map(mapCompanyRowToCompany);

  return (
    <MyPopokClient
      initialArtist={artist}
      profileType={profile?.profile_type ?? null}
      initialOwnedCompanies={initialOwnedCompanies}
    />
  );
}
