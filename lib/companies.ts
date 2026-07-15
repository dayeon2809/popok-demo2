import { getSupabaseServer } from "./supabaseServer";
import { toStringArray } from "./normalize";
import type { Company, ConnectedCompany } from "@/types";

export function mapCompanyRowToCompany(record: any): Company {
  if (!record) return {} as Company;
  return {
    id: String(record.id),
    name: record.name || "",
    name_en: record.name_en || null,
    slug: record.slug || null,
    status: record.status || "draft",
    verified: !!record.verified,
    genre: record.genre || null,
    category: record.category || null,
    city_or_region: record.city_or_region || null,
    bio_short: record.bio_short || null,
    bio: record.bio || null,
    profile_image_url: record.profile_image_url || null,
    profile_image_urls: Array.isArray(record.profile_image_urls) ? record.profile_image_urls : [],
    motion_video_url: record.motion_video_url || null,
    email: record.email || null,
    instagram: record.instagram || null,
    website: record.website || null,
    portfolio_url: record.portfolio_url || null,
    current_activity: toStringArray(record.current_activity),
    createdAt: record.created_at || null,
    updatedAt: record.updated_at || null,
  };
}

/** Every published company, alphabetical by name — for the /companies list. */
export async function getPublishedCompanies(): Promise<Company[]> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("companies" as any)
      .select("*")
      .eq("status", "published")
      .order("name", { ascending: true });

    if (error) {
      console.error("[getPublishedCompanies] Supabase error:", error);
      return [];
    }
    return (data || []).map(mapCompanyRowToCompany);
  } catch (err) {
    console.error("[getPublishedCompanies] Unexpected error:", err);
    return [];
  }
}

export async function getPublishedCompanyBySlug(slug: string): Promise<Company | null> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("companies" as any)
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error("[getPublishedCompanyBySlug] Supabase error:", error);
      return null;
    }
    return data ? mapCompanyRowToCompany(data) : null;
  } catch (err) {
    console.error("[getPublishedCompanyBySlug] Unexpected error:", err);
    return null;
  }
}

export async function getPublishedCompanyById(id: string): Promise<Company | null> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("companies" as any)
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error("[getPublishedCompanyById] Supabase error:", error);
      return null;
    }
    return data ? mapCompanyRowToCompany(data) : null;
  } catch (err) {
    console.error("[getPublishedCompanyById] Unexpected error:", err);
    return null;
  }
}

/**
 * artist_companies rows for this artist, joined with their linked company —
 * only relations pointing at a published company are returned (a draft
 * company shouldn't surface on someone's public profile).
 */
export async function getConnectedCompaniesByArtistId(artistId: string): Promise<ConnectedCompany[]> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("artist_companies" as any)
      .select("role, start_year, end_year, is_current, is_primary, created_at, companies(*)")
      .eq("artist_id", artistId);

    if (error) {
      console.error("[getConnectedCompaniesByArtistId] Supabase error:", error);
      return [];
    }

    return (data || [])
      .filter((row: any) => row.companies && row.companies.status === "published")
      .map((row: any) => ({
        company: mapCompanyRowToCompany(row.companies),
        role: row.role || null,
        start_year: typeof row.start_year === "number" ? row.start_year : null,
        end_year: typeof row.end_year === "number" ? row.end_year : null,
        is_current: !!row.is_current,
        is_primary: !!row.is_primary,
        created_at: row.created_at || null,
      }));
  } catch (err) {
    console.error("[getConnectedCompaniesByArtistId] Unexpected error:", err);
    return [];
  }
}

/**
 * Picks the one company to show in CONNECTED ORGANIZATION:
 *   1. is_current && is_primary
 *   2. else is_current
 *   3. else null — a past (is_current = false) relation is never shown here.
 *      CONNECTED ORGANIZATION is a "where do they belong right now" card;
 *      past affiliations belong in Activity Timeline / affiliations instead.
 */
export async function getPrimaryConnectedCompanyByArtistId(artistId: string): Promise<ConnectedCompany | null> {
  try {
    const connections = await getConnectedCompaniesByArtistId(artistId);
    if (connections.length === 0) return null;

    const primaryCurrent = connections.find((c) => c.is_primary && c.is_current);
    if (primaryCurrent) return primaryCurrent;

    const current = connections.find((c) => c.is_current);
    if (current) return current;

    return null;
  } catch (err) {
    console.error("[getPrimaryConnectedCompanyByArtistId] Unexpected error:", err);
    return null;
  }
}

/**
 * Best-effort org-name -> slug for a brand-new draft company. This codebase
 * has no full Korean romanizer, so a run of Hangul collapses to a single
 * "co" token rather than being dropped — uniqueness against existing slugs
 * is the caller's job (see createDraftCompanyFromApplication), not this
 * function's.
 */
export function generateCompanySlug(name: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "company";

  const withTokens = trimmed.replace(/[가-힣]+/g, " co ");
  const slug = withTokens
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "company";
}

export interface OrganizationApplicationForApproval {
  id: string;
  org_name: string;
  email: string;
  instagram: string;
  website: string | null;
  description: string | null;
}

/**
 * Inserts a draft companies row from an approved application. Fields not
 * present on the application (works, awards, links, ...) get the safe empty
 * defaults from the schema — nothing is invented. Retries with a numeric
 * slug suffix on a unique-constraint collision (popok-dance, popok-dance-2, ...).
 */
export async function createDraftCompanyFromApplication(
  application: OrganizationApplicationForApproval
): Promise<string> {
  const supabase = getSupabaseServer();
  const baseSlug = generateCompanySlug(application.org_name);
  const bioShort = application.description ? application.description.trim().slice(0, 80) || null : null;

  const MAX_ATTEMPTS = 5;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const attemptSlug = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`;

    const { data, error } = await supabase
      .from("companies" as any)
      .insert({
        name: application.org_name,
        slug: attemptSlug,
        status: "draft",
        verified: false,
        email: application.email || null,
        instagram: application.instagram || null,
        website: application.website || null,
        bio: application.description || null,
        bio_short: bioShort,
        profile_image_urls: [],
        current_activity: [],
        works: [],
        awards: [],
        review_links: [],
        links: [],
      } as any)
      .select("id")
      .single();

    if (!error && data) return String((data as any).id);

    // 23505 = unique_violation — only the slug collision is worth retrying.
    if (error && (error as any).code === "23505") continue;

    throw new Error(error?.message || "단체 초안 생성에 실패했습니다.");
  }

  throw new Error("고유한 단체 주소(slug)를 생성하지 못했습니다.");
}

/**
 * Approves an application: creates its draft company (idempotent — if
 * company_id is already set, returns it as-is) and links the two.
 *
 * Concurrency: two near-simultaneous calls (double-click, retry) could both
 * pass the "company_id is null" read below before either writes. Rather
 * than a DB transaction (awkward over the Supabase JS client), the actual
 * duplicate-prevention guard is the `.is("company_id", null)` condition on
 * the UPDATE — only one concurrent caller's UPDATE can match a row, since
 * the first one to land clears that condition for everyone else. The loser
 * detects 0 rows updated, deletes the company it speculatively created, and
 * returns the winner's company_id instead.
 */
export async function approveOrganizationApplication(applicationId: string): Promise<{ companyId: string }> {
  const supabase = getSupabaseServer();

  const { data: application, error: fetchError } = await supabase
    .from("organization_applications" as any)
    .select("id, org_name, email, instagram, website, description, company_id")
    .eq("id", applicationId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!application) throw new Error("신청서를 찾을 수 없습니다.");

  const existingCompanyId = (application as any).company_id;
  if (existingCompanyId) {
    // Already approved previously — idempotent no-op, just make sure status reflects it.
    await (supabase.from("organization_applications" as any) as any)
      .update({ status: "approved" })
      .eq("id", applicationId);
    return { companyId: String(existingCompanyId) };
  }

  const companyId = await createDraftCompanyFromApplication(application as any);

  const { data: updated } = await (supabase.from("organization_applications" as any) as any)
    .update({ company_id: companyId, status: "approved" })
    .eq("id", applicationId)
    .is("company_id", null)
    .select("id")
    .maybeSingle();

  if (!updated) {
    // Lost the race — a concurrent call already set company_id first.
    await supabase.from("companies" as any).delete().eq("id", companyId);
    const { data: reFetched } = await supabase
      .from("organization_applications" as any)
      .select("company_id")
      .eq("id", applicationId)
      .maybeSingle();
    const winningCompanyId = (reFetched as any)?.company_id;
    if (winningCompanyId) return { companyId: String(winningCompanyId) };
    throw new Error("승인 처리 중 충돌이 발생했습니다. 다시 시도해주세요.");
  }

  return { companyId };
}

export async function rejectOrganizationApplication(applicationId: string): Promise<void> {
  const supabase = getSupabaseServer();
  const { error } = await (supabase.from("organization_applications" as any) as any)
    .update({ status: "rejected" })
    .eq("id", applicationId);

  if (error) throw new Error(error.message);
}

/**
 * Finds this artist's current "is_current && is_primary" relation at a
 * *different* company, if any — used before saving a new primary-current
 * relation so the admin UI can ask for confirmation instead of silently
 * having two "current primary" companies (which the DB's partial unique
 * index would reject anyway, but this gives a friendly warning first).
 */
export async function findConflictingPrimaryCompany(
  artistId: string,
  excludeCompanyId?: string
): Promise<{ id: string; name: string } | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("artist_companies" as any)
    .select("company_id, companies(id, name)")
    .eq("artist_id", artistId)
    .eq("is_current", true)
    .eq("is_primary", true);

  if (error || !data) return null;

  const conflict = (data as any[]).find(
    (row) => !excludeCompanyId || String(row.company_id) !== String(excludeCompanyId)
  );
  if (!conflict) return null;

  return {
    id: String(conflict.company_id),
    name: conflict.companies?.name || "다른 단체",
  };
}

/** Demotes any other "current primary" relation this artist has, so a new one can take its place. */
export async function clearPrimaryFlagForArtist(artistId: string, excludeCompanyId?: string): Promise<void> {
  const supabase = getSupabaseServer();
  let query = (supabase.from("artist_companies" as any) as any)
    .update({ is_primary: false })
    .eq("artist_id", artistId)
    .eq("is_current", true)
    .eq("is_primary", true);

  if (excludeCompanyId) {
    query = query.neq("company_id", excludeCompanyId);
  }

  await query;
}
