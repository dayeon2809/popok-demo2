import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import AccountClient from "./AccountClient";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth");
  }

  const [{ data: artist }, { data: profile }] = await Promise.all([
    supabase.from("artists").select("id, name, slug, status").eq("owner_id", user.id).maybeSingle(),
    supabase.from("profiles").select("display_name, email, username").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <AccountClient
      email={user.email || profile?.email || ""}
      artist={artist || null}
      displayName={profile?.display_name || ""}
    />
  );
}
