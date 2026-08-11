const DEFAULT_PUBLIC_SITE_URL = "https://popok.kr";

export function getPublicSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL).replace(/\/+$/, "");
}

export function getArtistPath(slugOrId: string): string {
  return `/artists/${encodeURIComponent(slugOrId)}`;
}

export function getCompanyPath(slugOrId: string): string {
  return `/companies/${encodeURIComponent(slugOrId)}`;
}

export function getArtistPublicUrl(slugOrId: string): string {
  return `${getPublicSiteUrl()}${getArtistPath(slugOrId)}`;
}

export function getCompanyPublicUrl(slugOrId: string): string {
  return `${getPublicSiteUrl()}${getCompanyPath(slugOrId)}`;
}
