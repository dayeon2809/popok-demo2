import { getSupabaseServer } from "@/lib/supabaseServer";

/**
 * Resolves an `auth.users.id` to its signup email. Supabase's REST client
 * can't query `auth.users` as a regular table — this requires the Admin API
 * (`auth.admin.getUserById`), which needs the service-role client
 * (getSupabaseServer() already uses the service role key).
 *
 * Per the spec: this is the ONLY correct way to get an artist/rep's "가입
 * 이메일" — never `artists.email` (that's a public contact address that may
 * differ from the account's login email).
 */
export async function getAccountEmailByOwnerId(ownerId: string): Promise<string | null> {
  if (!ownerId) return null;
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.auth.admin.getUserById(ownerId);
    if (error || !data?.user?.email) return null;
    return data.user.email;
  } catch (err) {
    console.error("[getAccountEmailByOwnerId] Unexpected error:", err);
    return null;
  }
}
