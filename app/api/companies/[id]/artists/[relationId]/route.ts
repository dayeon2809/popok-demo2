import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getSupabaseServer } from "@/lib/supabaseServer";
import { findConflictingPrimaryCompany, clearPrimaryFlagForArtist } from "@/lib/companies";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; relationId: string }> }
) {
  try {
    const { id: companyId, relationId } = await params;
    const supabaseUserClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    // Verify company ownership
    const { data: company, error: companyError } = await supabase
      .from("companies" as any)
      .select("id, owner_id")
      .eq("id", companyId)
      .maybeSingle();

    if (companyError || !company) {
      return NextResponse.json({ success: false, error: "단체 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    if (String((company as any).owner_id) !== user.id) {
      return NextResponse.json({ success: false, error: "이 단체를 관리할 권한이 없습니다." }, { status: 403 });
    }

    const { data: existingRel, error: fetchRelError } = await supabase
      .from("artist_companies" as any)
      .select("id, artist_id, company_id")
      .eq("id", relationId)
      .maybeSingle();

    if (fetchRelError || !existingRel) {
      return NextResponse.json({ success: false, error: "소속 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    const body = await req.json();
    const artistId = (existingRel as any).artist_id;

    const role = typeof body.role === "string" ? body.role.trim() || null : null;
    const startYear = Number.isFinite(Number(body.start_year)) ? Number(body.start_year) : null;
    const endYear = Number.isFinite(Number(body.end_year)) ? Number(body.end_year) : null;
    const isCurrent = typeof body.is_current === "boolean" ? body.is_current : true;
    const isPrimary = typeof body.is_primary === "boolean" ? body.is_primary : false;
    const confirmReplacePrimary = body.confirmReplacePrimary === true;

    if (isCurrent && isPrimary) {
      const conflict = await findConflictingPrimaryCompany(artistId, companyId);
      if (conflict && String(conflict.id) !== companyId && !confirmReplacePrimary) {
        return NextResponse.json(
          {
            success: false,
            needsConfirmation: true,
            conflictingCompanyName: conflict.name,
            error: "이 아티스트는 이미 다른 단체를 현재 대표 소속으로 설정했습니다.",
          },
          { status: 409 }
        );
      }
      if (conflict && String(conflict.id) !== companyId && confirmReplacePrimary) {
        await clearPrimaryFlagForArtist(artistId, companyId);
      }
    }

    const { error: updateError } = await (supabase.from("artist_companies" as any) as any)
      .update({
        role,
        start_year: startYear,
        end_year: endYear,
        is_current: isCurrent,
        is_primary: isPrimary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", relationId);

    if (updateError) {
      console.error("[PUT /api/companies/[id]/artists/[relationId]] DB Error:", updateError);
      return NextResponse.json({ success: false, error: "소속 정보 수정에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "소속 정보가 수정되었습니다." });
  } catch (err: any) {
    console.error("[PUT /api/companies/[id]/artists/[relationId]] Error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; relationId: string }> }
) {
  try {
    const { id: companyId, relationId } = await params;
    const supabaseUserClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    // Verify company ownership
    const { data: company, error: companyError } = await supabase
      .from("companies" as any)
      .select("id, owner_id")
      .eq("id", companyId)
      .maybeSingle();

    if (companyError || !company) {
      return NextResponse.json({ success: false, error: "단체 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    if (String((company as any).owner_id) !== user.id) {
      return NextResponse.json({ success: false, error: "이 단체를 관리할 권한이 없습니다." }, { status: 403 });
    }

    const { error } = await supabase
      .from("artist_companies" as any)
      .delete()
      .eq("id", relationId);

    if (error) {
      console.error("[DELETE /api/companies/[id]/artists/[relationId]] DB Error:", error);
      return NextResponse.json({ success: false, error: "소속 아티스트 연결 해제에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "소속 아티스트 연결이 해제되었습니다." });
  } catch (err: any) {
    console.error("[DELETE /api/companies/[id]/artists/[relationId]] Error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
