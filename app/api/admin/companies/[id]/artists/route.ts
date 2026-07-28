import { requireAdminApi } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { findConflictingPrimaryCompany, clearPrimaryFlagForArtist } from "@/lib/companies";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id: companyId } = await params;
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("artist_companies" as any)
    .select("id, artist_id, role, start_year, end_year, is_current, is_primary, created_at, artists(id, name, name_en, slug, profile_image_url, role, genre)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: "소속 아티스트를 불러오지 못했습니다." }, { status: 500 });
  }
  return NextResponse.json({ success: true, artists: data || [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  const { id: companyId } = await params;

  try {
    const body = await req.json();
    const artistId = body?.artist_id;
    if (!artistId || typeof artistId !== "string") {
      return NextResponse.json({ success: false, error: "아티스트를 선택해 주세요." }, { status: 400 });
    }

    const role = typeof body?.role === "string" ? body.role.trim() || null : null;
    const startYear = Number.isFinite(Number(body?.start_year)) ? Number(body.start_year) : null;
    const endYear = Number.isFinite(Number(body?.end_year)) ? Number(body.end_year) : null;
    const isCurrent = body?.is_current !== false; // default true
    const isPrimary = body?.is_primary === true;
    const confirmReplacePrimary = body?.confirmReplacePrimary === true;

    if (isCurrent && isPrimary) {
      const conflict = await findConflictingPrimaryCompany(artistId, companyId);
      if (conflict && !confirmReplacePrimary) {
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
      if (conflict && confirmReplacePrimary) {
        await clearPrimaryFlagForArtist(artistId, companyId);
      }
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("artist_companies" as any)
      .insert({
        artist_id: artistId,
        company_id: companyId,
        role,
        start_year: startYear,
        end_year: endYear,
        is_current: isCurrent,
        is_primary: isPrimary,
      } as any)
      .select("id")
      .single();

    if (error) {
      console.error(`[POST /api/admin/companies/${companyId}/artists]`, error);
      const message = (error as any).code === "23505"
        ? "이미 등록된 관계입니다."
        : "관계 생성에 실패했습니다.";
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    return NextResponse.json({ success: true, relationId: String((data as any).id) });
  } catch (err: any) {
    console.error(`[POST /api/admin/companies/${companyId}/artists]`, err);
    return NextResponse.json({ success: false, error: "관계 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
