import { createServerSupabaseClient } from "./supabaseServer";

export interface ViewerHeroState {
  isLoggedIn: boolean;
  /** The logged-in user's own artist slug (or id if no slug), or null when
   *  they have no linked profile yet. Always null when isLoggedIn is false. */
  myArtistSlug: string | null;
}

/**
 * Server-side auth + "do they already have an artist profile" lookup shared
 * by every page that renders an auth-aware Hero CTA (Home, About). Mirrors
 * app/my-popok/page.tsx's own owner_id query so the two never disagree.
 */
export async function getViewerHeroState(): Promise<ViewerHeroState> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { isLoggedIn: false, myArtistSlug: null };

  const { data: myArtist } = await supabase
    .from("artists")
    .select("id, slug")
    .eq("owner_id", user.id)
    .maybeSingle();

  const artist = myArtist as { id: string; slug: string | null } | null;
  return { isLoggedIn: true, myArtistSlug: artist?.slug || artist?.id || null };
}
