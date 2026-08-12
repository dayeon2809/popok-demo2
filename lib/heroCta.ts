// Shared by the Home and About page Heroes so the "what should the primary
// CTA say and link to" decision is made in exactly one place.

export interface HeroCta {
  href: string;
  label: string;
}

/**
 * logged out or logged in without a linked artist profile -> onboarding,
 * logged in with a profile -> manage it. Authentication is requested only
 * after the guest has completed the onboarding preview.
 * owner_id check app/my-popok/page.tsx uses as its source of truth.
 */
export function getHeroCta(isLoggedIn: boolean, myArtistSlug: string | null): HeroCta {
  if (!isLoggedIn) return { href: "/onboarding", label: "내 포퐄 만들기" };
  if (!myArtistSlug) return { href: "/onboarding", label: "내 포퐄 만들기" };
  return { href: "/my-popok", label: "내 포퐄 관리" };
}
