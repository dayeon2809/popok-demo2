import type { Metadata } from "next";
import { headers } from "next/headers";
import { getArtistById, getArtistBySlug } from "@/lib/artists";
import { localizePath, localizedRecord, type Locale } from "@/lib/i18n/locale";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const artist = await getArtistBySlug(decoded) || await getArtistById(decoded);
  if (!artist) return {};
  const headerStore = await headers();
  const locale = (headerStore.get("x-popok-locale") === "en" ? "en" : "ko") as Locale;
  const display = localizedRecord(artist as any, locale);
  const pathname = `/artists/${encodeURIComponent(artist.slug || artist.id)}`;
  const description = display.bio_short || display.bio || artist.bio_short || artist.bio || "POPOK artist portfolio";
  return {
    title: `${display.name} | POPOK`,
    description,
    alternates: { canonical: localizePath(pathname, locale), languages: { ko: localizePath(pathname, "ko"), en: localizePath(pathname, "en") } },
    openGraph: { title: `${display.name} | POPOK`, description, url: localizePath(pathname, locale), images: artist.profile_image_url ? [artist.profile_image_url] : undefined },
  };
}

export default function ArtistDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
