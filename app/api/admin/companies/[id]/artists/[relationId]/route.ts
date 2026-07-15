import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { findConflictingPrimaryCompany, clearPrimaryFlagForArtist } from "@/lib/companies";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; relationId: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id: companyId, relationId } = await params;

  try {
    const supabase = getSupabaseServer();
    const { data: existing, error: fetchError } = await supabase
      .from("artist_companies" as any)
      .select("artist_id")
      .eq("id", relationId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json({ success: false, error: "관계를 찾을 수 없습니다." }, { status: 404 });
    }

    const artistId = (existing as any).artist_id;
    const body = await req.json();

    const update: Record<string, any> = {};
    if ("role" in body) update.role = typeof body.role === "string" ? body.role.trim() || null : null;
    if ("start_year" in body) update.start_year = Number.isFinite(Number(body.start_year)) ? Number(body.start_year) : null;
    if ("end_year" in body) update.end_year = Number.isFinite(Number(body.end_year)) ? Number(body.end_year) : null;
    if ("is_current" in body) update.is_current = !!body.is_current;
    if ("is_primary" in body) update.is_primary = !!body.is_primary;

    const willBeCurrent = "is_current" in update ? update.is_current : undefined;
    const willBePrimary = "is_primary" in update ? update.is_primary : undefined;
    const confirmReplacePrimary = body?.confirmReplacePrimary === true;

    if (willBeCurrent !== false && willBePrimary === true) {
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

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: "수정할 내용이 없습니다." }, { status: 400 });
    }

    const { error: updateError } = await (supabase.from("artist_companies" as any) as any)
      .update(update)
      .eq("id", relationId);

    if (updateError) {
      console.error(`[PATCH /api/admin/companies/${companyId}/artists/${relationId}]`, updateError);
      return NextResponse.json({ success: false, error: "관계 수정에 실패했습니다." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[PATCH /api/admin/companies/${companyId}/artists/${relationId}]`, err);
    return NextResponse.json({ success: false, error: "관계 수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; relationId: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id: companyId, relationId } = await params;

  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from("artist_companies" as any)
      .delete()
      .eq("id", relationId)
      .eq("company_id", companyId);

    if (error) {
      console.error(`[DELETE /api/admin/companies/${companyId}/artists/${relationId}]`, error);
      return NextResponse.json({ success: false, error: "관계 삭제에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[DELETE /api/admin/companies/${companyId}/artists/${relationId}]`, err);
    return NextResponse.json({ success: false, error: "관계 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
