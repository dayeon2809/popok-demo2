import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import {
  getPublishedCompanyById,
  getPublishedCompanyBySlug,
  getConnectedArtistsByCompanyId,
  getRelatedCompanies,
} from "@/lib/companies";
import { getUpcomingPerformancesByCompanyId } from "@/lib/performances";
import { getPortfolioRequestViewerState } from "@/lib/portfolioRequestsServer";
import { getCompanyStories } from "@/lib/instagram";
import CompanyClientView from "./CompanyClientView";
import { localizedCareer, localizedRecord, localizedWork, type Locale, localizePath } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadCompany(slug: string) {
  const decoded = decodeURIComponent(slug).trim();
  return UUID_RE.test(decoded) ? getPublishedCompanyById(decoded) : getPublishedCompanyBySlug(decoded);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const company = await loadCompany(slug);
  if (!company) return {};
  const headerStore = await headers();
  const locale = (headerStore.get("x-popok-locale") === "en" ? "en" : "ko") as Locale;
  const display = localizedRecord(company as any, locale);
  const pathname = `/companies/${encodeURIComponent(company.slug || company.id)}`;
  const description = display.bio_short || display.bio || company.bio_short || company.bio || "POPOK company portfolio";
  return { title: `${display.name} | POPOK`, description, alternates: { canonical: localizePath(pathname, locale), languages: { ko: localizePath(pathname, "ko"), en: localizePath(pathname, "en") } }, openGraph: { title: `${display.name} | POPOK`, description, url: localizePath(pathname, locale) } };
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await loadCompany(slug);

  if (!company) {
    notFound();
  }

  // Fetch connected artists, related companies, upcoming performances,
  // viewer's state, and any @popok.official Instagram posts tagged with this
  // company's dedicated tag (see lib/instagram.ts) in parallel
  const [fetchedArtists, relatedCompanies, upcomingPerformances, sendPortfolioViewerState, instagramStories] = await Promise.all([
    getConnectedArtistsByCompanyId(company.id),
    getRelatedCompanies(company.id),
    getUpcomingPerformancesByCompanyId(company.id),
    getPortfolioRequestViewerState({ type: "company", id: company.id }),
    getCompanyStories(company.name),
  ]);

  // Derive representative artist: admin-designated is_primary relation is the single source of truth
  const primaryArtists = fetchedArtists.filter((a: any) => a.artistCompany?.is_primary === true);
  const repArtist =
    primaryArtists.find((a: any) => a.artistCompany?.is_current !== false) ||
    primaryArtists[0] ||
    null;

  const representativeArtist = repArtist
    ? {
        artist: repArtist,
        is_primary: repArtist.artistCompany?.is_primary === true,
        is_current: true,
        role: repArtist.artistCompany?.role || null,
      }
    : null;

  if (process.env.NODE_ENV !== "production") {
    console.log("[company page representative]", {
      companyId: company.id,
      companySlug: company.slug,
      artistId: representativeArtist?.artist?.id,
      artistName: representativeArtist?.artist?.name,
      isPrimary: representativeArtist?.is_primary,
    });
  }

  // Mockup: 공원(GONGWON) — add placeholder "연결 아티스트" cards for design/demo
  // purposes only, alongside whatever real artist_companies rows already exist.
  const mockArtists =
    company.slug === "gongwon"
      ? [
          { id: "mock-ahn-seyoung", name: "안세영", name_en: "Ahn Se-young", profile_image_url: null, slug: null, role: "소속 아티스트", is_current: true, is_primary: false },
          { id: "mock-baek-seohyun", name: "백서현", name_en: "Baek Seo-hyun", profile_image_url: null, slug: null, role: "소속 아티스트", is_current: true, is_primary: false },
          { id: "mock-lee-changmin", name: "이창민", name_en: "Lee Chang-min", profile_image_url: null, slug: null, role: "소속 아티스트", is_current: true, is_primary: false },
        ]
      : [];
  const artists = [...fetchedArtists, ...mockArtists];
  const headerStore = await headers();
  const locale = (headerStore.get("x-popok-locale") === "en" ? "en" : "ko") as Locale;
  const displayCompany = {
    ...localizedRecord(company as any, locale),
    works: Array.isArray(company.works) ? company.works.map((work: any) => localizedWork(work, locale)) : [],
    awards: Array.isArray(company.awards) ? company.awards.map((item: any) => localizedCareer(item, locale)) : [],
    history: Array.isArray(company.history) ? company.history.map((item: any) => localizedCareer(item, locale)) : [],
    current_activity: Array.isArray(company.current_activity) ? company.current_activity.map((item: any) => typeof item === "object" ? localizedCareer(item, locale) : item) : [],
  };

  return (
    <CompanyClientView
      company={displayCompany}
      artists={artists}
      relatedCompanies={relatedCompanies}
      upcomingPerformances={upcomingPerformances}
      sendPortfolioViewerState={sendPortfolioViewerState}
      representativeArtist={representativeArtist}
      instagramStories={instagramStories}
    />
  );
}
