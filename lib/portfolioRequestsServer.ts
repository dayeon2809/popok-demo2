import { createServerSupabaseClient, getSupabaseServer } from "@/lib/supabaseServer";

export type PortfolioRequestTargetType = "company" | "artist";

export interface PortfolioRequestViewerArtist {
  id: string;
  name: string;
  role: string | null;
  profile_image_url: string | null;
  slug: string | null;
}

export interface PortfolioRequestViewerState {
  isLoggedIn: boolean;
  artist: PortfolioRequestViewerArtist | null;
  existingRequestStatus: string | null;
  /** Viewing your own company (owner_id match) or your own artist profile. */
  isSelf: boolean;
}

const EMPTY_STATE: PortfolioRequestViewerState = {
  isLoggedIn: false,
  artist: null,
  existingRequestStatus: null,
  isSelf: false,
};

/**
 * Single source of truth for "what should the 포퐄 보내기 CTA show this
 * viewer" — used both server-side (app/companies/[slug]/page.tsx, rendered
 * before first paint) and via the /api/portfolio-requests/viewer-state route
 * (app/artists/[id]/page.tsx is a client component, so it fetches this
 * instead of computing it in a server component). Never throws — every
 * failure path (including company_portfolio_requests/artist_portfolio_requests
 * not existing yet because a migration hasn't been run) degrades to "not
 * sent" rather than breaking the page.
 */
export async function getPortfolioRequestViewerState(
  target: { type: PortfolioRequestTargetType; id: string }
): Promise<PortfolioRequestViewerState> {
  try {
    const supabaseUserClient = await createServerSupabaseClient();
    const { data: { user } } = await supabaseUserClient.auth.getUser();
    if (!user) return EMPTY_STATE;

    const supabase = getSupabaseServer();

    const { data: artistRow } = await supabase
      .from("artists" as any)
      .select("id, name, role, genre, profile_image_url, slug")
      .eq("owner_id", user.id)
      .maybeSingle();

    const isSelfForCompany = async (): Promise<boolean> => {
      const { data: company } = await supabase
        .from("companies" as any)
        .select("owner_id")
        .eq("id", target.id)
        .maybeSingle();
      return !!company && !!(company as any).owner_id && String((company as any).owner_id) === user.id;
    };

    if (!artistRow) {
      const isSelf = target.type === "company" ? await isSelfForCompany() : false;
      return { isLoggedIn: true, artist: null, existingRequestStatus: null, isSelf };
    }

    const artist: PortfolioRequestViewerArtist = {
      id: String((artistRow as any).id),
      name: (artistRow as any).name || "",
      role: (artistRow as any).role || (artistRow as any).genre || null,
      profile_image_url: (artistRow as any).profile_image_url || null,
      slug: (artistRow as any).slug || null,
    };

    const isSelf = target.type === "artist" ? artist.id === target.id : await isSelfForCompany();

    let existingRequestStatus: string | null = null;
    try {
      if (target.type === "company") {
        const { data: existing } = await supabase
          .from("company_portfolio_requests" as any)
          .select("status")
          .eq("artist_id", artist.id)
          .eq("company_id", target.id)
          .in("status", ["pending", "viewed"])
          .maybeSingle();
        existingRequestStatus = existing ? (existing as any).status : null;
      } else {
        const { data: existing } = await supabase
          .from("artist_portfolio_requests" as any)
          .select("status")
          .eq("sender_artist_id", artist.id)
          .eq("recipient_artist_id", target.id)
          .in("status", ["pending", "viewed"])
          .maybeSingle();
        existingRequestStatus = existing ? (existing as any).status : null;
      }
    } catch {
      // Table not migrated in yet — treat as "not sent".
    }

    return { isLoggedIn: true, artist, existingRequestStatus, isSelf };
  } catch {
    return EMPTY_STATE;
  }
}
