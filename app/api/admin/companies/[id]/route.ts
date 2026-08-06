import { requireAdminApi } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { clearPrimaryFlagForArtist, getOrganizationApplicationByCompanyId } from "@/lib/companies";
import { cleanWorksForPayload } from "@/lib/company-works";
import { normalizeCompanyRepresentativeImages, cleanCompanyAwardsForPayload } from "@/lib/company";

export const dynamic = "force-dynamic";

const SOURCE_TEXT_MAX = 30000;

async function syncOwnerRepresentative(companyId: string, ownerId: string | null): Promise<{ linked: boolean; warning?: string }> {
  const supabase = getSupabaseServer();
  if (!ownerId) {
    const { error } = await (supabase.from("artist_companies" as any) as any).update({ is_primary: false }).eq("company_id", companyId).eq("is_primary", true);
    if (error) throw error;
    return { linked: false };
  }
  const { data: ownedArtist, error: artistError } = await supabase.from("artists" as any).select("id").eq("owner_id", ownerId).maybeSingle();
  if (artistError) throw artistError;
  if (!ownedArtist) return { linked: false, warning: "\uB300\uD45C \uACC4\uC815\uC5D0 \uC5F0\uACB0\uB41C \uC544\uD2F0\uC2A4\uD2B8 \uD504\uB85C\uD544\uC774 \uC5C6\uC5B4 \uAD00\uB9AC \uAD8C\uD55C\uB9CC \uC5F0\uACB0\uB418\uC5C8\uC2B5\uB2C8\uB2E4." };
  const artistId = String((ownedArtist as any).id);
  await clearPrimaryFlagForArtist(artistId, companyId);
  const { data: existingRelations, error: relationReadError } = await supabase.from("artist_companies" as any).select("id").eq("artist_id", artistId).eq("company_id", companyId).order("created_at", { ascending: true }).limit(1);
  if (relationReadError) throw relationReadError;
  const existingRelationId = (existingRelations as any[] | null)?.[0]?.id;
  let representativeRelationId: string;
  if (existingRelationId) {
    const { error } = await (supabase.from("artist_companies" as any) as any).update({ is_current: true, is_primary: true }).eq("id", existingRelationId);
    if (error) throw error;
    representativeRelationId = String(existingRelationId);
  } else {
    const { data, error } = await (supabase.from("artist_companies" as any) as any).insert({ artist_id: artistId, company_id: companyId, is_current: true, is_primary: true }).select("id").single();
    if (error) throw error;
    representativeRelationId = String(data.id);
  }
  const { error: demoteError } = await (supabase.from("artist_companies" as any) as any).update({ is_primary: false }).eq("company_id", companyId).eq("is_primary", true).neq("id", representativeRelationId);
  if (demoteError) throw demoteError;
  return { linked: true };
}

// Fields an admin may edit directly. `status` is deliberately excluded —
// publish/unpublish/archive each have their own validation and must go
// through app/api/admin/companies/[id]/publish|unpublish|archive instead.
// `source_file_*` are deliberately excluded too — those are only ever
// written by app/api/admin/companies/[id]/source-file, never this generic PATCH.
const EDITABLE_FIELDS = [
  "name", "name_en", "slug", "verified", "owner_id", "genre", "category", "city_or_region",
  "bio_short", "bio", "bio_en", "introduction_en", "profile_image_url", "motion_video_url", "email",
  "instagram", "website", "portfolio_url",
  "profile_image_urls", "representative_images", "current_activity", "works", "awards", "review_links", "links",
  "source_text",
  "founded_year", "brand_color", "mission", "vision", "core_values", "history",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;

  try {
    const supabase = getSupabaseServer();
    const { data: company, error } = await supabase
      .from("companies" as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`[GET /api/admin/companies/${id}]`, error);
      return NextResponse.json({ success: false, error: "단체 정보를 가져오는 데 실패했습니다." }, { status: 500 });
    }
    if (!company) {
      return NextResponse.json({ success: false, error: "단체를 찾을 수 없습니다." }, { status: 404 });
    }

    const { data: relations, error: relError } = await supabase
      .from("artist_companies" as any)
      .select("id, role, start_year, end_year, is_current, is_primary, created_at, artists(id, name, name_en, slug, profile_image_url, instagram, website, email, owner_id)")
      .eq("company_id", id)
      .order("created_at", { ascending: false });

    if (relError) {
      console.error(`[GET /api/admin/companies/${id}] relations error:`, relError);
    }

    const connectedArtists = (relations || []).map((row: any) => ({
      relationId: String(row.id),
      role: row.role || null,
      start_year: row.start_year ?? null,
      end_year: row.end_year ?? null,
      is_current: !!row.is_current,
      is_primary: !!row.is_primary,
      artist: row.artists
        ? {
            id: String(row.artists.id),
            name: row.artists.name,
            name_en: row.artists.name_en || null,
            slug: row.artists.slug,
            profileImage: row.artists.profile_image_url,
            instagram: row.artists.instagram || null,
            website: row.artists.website || null,
            email: row.artists.email || null,
            owner_id: row.artists.owner_id || null,
          }
        : null,
    }));

    // Read-only view of the applicant's original submission — surfaced in
    // the admin "SOURCE MATERIALS" section, never editable through this route.
    const application = await getOrganizationApplicationByCompanyId(id);

    return NextResponse.json({
      success: true,
      data: {
        ...(company as any),
        connectedArtists,
        application: application
          ? {
              id: application.id,
              logo_url: application.logo_url,
              portfolio_text: application.portfolio_text,
              resume_file_name: application.resume_file_name,
            }
          : null,
      },
    });
  } catch (err: any) {
    console.error(`[GET /api/admin/companies/${id}]`, err);
    return NextResponse.json({ success: false, error: "단체 정보를 가져오는 데 실패했습니다." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;

  try {
    const body = await req.json();
    const update: Record<string, any> = {};
    for (const field of EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        update[field] = body[field];
      }
    }

    // Same save contract as the self-serve CMS (app/api/companies/[id]/update):
    // canonical images[]/structured-credits[] only, regardless of what shape the
    // admin editor's client state happens to hold — never legacy image/image_url
    // or a string credits value reach the DB.
    if (update.works !== undefined) {
      update.works = cleanWorksForPayload(update.works);
    }
    if (update.representative_images !== undefined) {
      update.representative_images = normalizeCompanyRepresentativeImages(update.representative_images);
    }
    if (update.awards !== undefined) {
      update.awards = cleanCompanyAwardsForPayload(update.awards);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: "수정할 내용이 없습니다." }, { status: 400 });
    }

    if (typeof update.source_text === "string") {
      if (update.source_text.length > SOURCE_TEXT_MAX) {
        return NextResponse.json({ success: false, error: "보충 자료는 30,000자 이하로 입력해주세요." }, { status: 400 });
      }
      update.source_material_updated_at = new Date().toISOString();
    }

    const supabase = getSupabaseServer();
    const ownerWasUpdated = Object.prototype.hasOwnProperty.call(update, "owner_id");
    if (ownerWasUpdated) update.owner_id = typeof update.owner_id === "string" ? update.owner_id.trim() || null : null;
    const { error } = await (supabase.from("companies" as any) as any)
      .update(update)
      .eq("id", id);

    if (error) {
      console.error(`[PATCH /api/admin/companies/${id}]`, error);
      const message = (error as any).code === "23505"
        ? "이미 사용 중인 slug입니다."
        : "단체 정보 수정에 실패했습니다.";
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    let representativeSync: { linked: boolean; warning?: string } | undefined;
    if (ownerWasUpdated) {
      try {
        representativeSync = await syncOwnerRepresentative(id, update.owner_id);
      } catch (syncError) {
        console.error(`[PATCH /api/admin/companies/${id}] representative sync error:`, syncError);
        return NextResponse.json({ success: false, error: "\uB300\uD45C \uAD00\uB9AC \uAD8C\uD55C\uC740 \uC800\uC7A5\uB410\uC9C0\uB9CC \uACF5\uAC1C \uB300\uD45C\uC790 \uC5F0\uACB0 \uBC18\uC601\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694." }, { status: 500 });
      }
    }
    return NextResponse.json({ success: true, representativeSync });
  } catch (err: any) {
    console.error(`[PATCH /api/admin/companies/${id}]`, err);
    return NextResponse.json({ success: false, error: "단체 정보 수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id } = await params;

  try {
    const supabase = getSupabaseServer();
    // artist_companies rows cascade-delete via FK — the client shows a
    // warning about this before calling DELETE.
    const { error } = await supabase.from("companies" as any).delete().eq("id", id);

    if (error) {
      console.error(`[DELETE /api/admin/companies/${id}]`, error);
      return NextResponse.json({ success: false, error: "단체 삭제에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[DELETE /api/admin/companies/${id}]`, err);
    return NextResponse.json({ success: false, error: "단체 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
