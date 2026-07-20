import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getSupabaseServer } from "@/lib/supabaseServer";
import { mapCompanyRowToCompany } from "@/lib/companies";
import { cleanWorksForPayload } from "@/lib/company-works";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabaseUserClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    // Verify company & ownership
    const { data: existingCompany, error: fetchError } = await supabase
      .from("companies" as any)
      .select("*")
      .eq("id", companyId)
      .maybeSingle();

    if (fetchError || !existingCompany) {
      return NextResponse.json({ success: false, error: "수정할 단체를 찾을 수 없습니다." }, { status: 404 });
    }

    if (String((existingCompany as any).owner_id) !== user.id) {
      return NextResponse.json({ success: false, error: "이 단체를 수정할 권한이 없습니다." }, { status: 403 });
    }

    const body = await req.json();

    // Clean and validate update fields (excluding slug)
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.name === "string") updateData.name = body.name.trim();
    if (body.name_en !== undefined) updateData.name_en = typeof body.name_en === "string" ? body.name_en.trim() || null : null;
    if (body.genre !== undefined) updateData.genre = typeof body.genre === "string" ? body.genre.trim() || null : null;
    if (body.category !== undefined) updateData.category = typeof body.category === "string" ? body.category.trim() || null : null;
    if (body.city_or_region !== undefined) updateData.city_or_region = typeof body.city_or_region === "string" ? body.city_or_region.trim() || null : null;
    if (body.founded_year !== undefined) updateData.founded_year = typeof body.founded_year === "number" ? body.founded_year : (body.founded_year ? parseInt(String(body.founded_year), 10) || null : null);
    
    if (body.mission !== undefined) updateData.mission = typeof body.mission === "string" ? body.mission.trim() || null : null;
    if (body.vision !== undefined) updateData.vision = typeof body.vision === "string" ? body.vision.trim() || null : null;
    if (Array.isArray(body.core_values)) updateData.core_values = body.core_values;
    if (Array.isArray(body.values)) updateData.core_values = body.values;

    if (body.bio_short !== undefined) updateData.bio_short = typeof body.bio_short === "string" ? body.bio_short.trim() || null : null;
    if (body.bio !== undefined) updateData.bio = typeof body.bio === "string" ? body.bio.trim() || null : null;
    if (body.brand_color !== undefined) updateData.brand_color = typeof body.brand_color === "string" ? body.brand_color.trim() || null : null;

    // NOTE: logo_url / hero_image_url are NOT accepted here — confirmed absent
    // from the live Supabase schema (see types/index.ts Company.logo_url /
    // .hero_image_url deprecation notes). Sending them makes the whole UPDATE
    // statement fail with 42703. Re-add only after an actual migration lands.
    if (body.profile_image_url !== undefined) updateData.profile_image_url = typeof body.profile_image_url === "string" ? body.profile_image_url.trim() || null : null;
    if (Array.isArray(body.profile_image_urls)) updateData.profile_image_urls = body.profile_image_urls;

    if (body.email !== undefined) updateData.email = typeof body.email === "string" ? body.email.trim() || null : null;
    if (body.instagram !== undefined) updateData.instagram = typeof body.instagram === "string" ? body.instagram.trim() || null : null;
    if (body.website !== undefined) updateData.website = typeof body.website === "string" ? body.website.trim() || null : null;
    if (body.portfolio_url !== undefined) updateData.portfolio_url = typeof body.portfolio_url === "string" ? body.portfolio_url.trim() || null : null;

    // Server-side backstop: whatever shape the caller sent, only the canonical
    // images[]/structured-credits[] shape (never legacy image/image_url/string
    // credits) is ever persisted — same contract for the CMS and the admin editor.
    if (Array.isArray(body.works)) updateData.works = cleanWorksForPayload(body.works);
    if (Array.isArray(body.current_activity)) updateData.current_activity = body.current_activity;
    if (Array.isArray(body.history)) updateData.history = body.history;
    if (Array.isArray(body.review_links)) updateData.review_links = body.review_links;
    if (Array.isArray(body.links)) updateData.links = body.links;

    const { data: updatedRow, error: updateError } = await (supabase.from("companies" as any) as any)
      .update(updateData)
      .eq("id", companyId)
      .select("*")
      .single();

    if (updateError) {
      // 42703 = undefined_column — a field in updateData doesn't exist on the live
      // table (schema drift between this allowlist and the connected DB). Logging
      // the attempted keys here is what would have caught the slogan/logo_url/
      // hero_image_url drift immediately instead of failing every save silently.
      if ((updateError as any).code === "42703") {
        console.error(
          "[PUT /api/companies/[id]/update] Undefined column — schema drift between this route's allowlist and the live DB. Attempted keys:",
          Object.keys(updateData),
          updateError.message
        );
      } else {
        console.error("[PUT /api/companies/[id]/update] DB Error:", updateError);
      }
      return NextResponse.json({ success: false, error: "단체 정보 저장에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      company: mapCompanyRowToCompany(updatedRow),
      message: "단체 정보가 성공적으로 저장되었습니다.",
    });
  } catch (err: any) {
    console.error("[PUT /api/companies/[id]/update] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
