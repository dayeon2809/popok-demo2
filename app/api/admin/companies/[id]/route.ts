import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

// Fields an admin may edit directly. `status` is deliberately excluded —
// publish/unpublish/archive each have their own validation and must go
// through app/api/admin/companies/[id]/publish|unpublish|archive instead.
const EDITABLE_FIELDS = [
  "name", "name_en", "slug", "verified", "genre", "category", "city_or_region",
  "bio_short", "bio", "profile_image_url", "motion_video_url", "email",
  "instagram", "website", "portfolio_url",
  "profile_image_urls", "current_activity", "works", "awards", "review_links", "links",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

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
      .select("id, role, start_year, end_year, is_current, is_primary, created_at, artists(id, name, slug, profile_image_url)")
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
            slug: row.artists.slug,
            profileImage: row.artists.profile_image_url,
          }
        : null,
    }));

    return NextResponse.json({ success: true, data: { ...(company as any), connectedArtists } });
  } catch (err: any) {
    console.error(`[GET /api/admin/companies/${id}]`, err);
    return NextResponse.json({ success: false, error: "단체 정보를 가져오는 데 실패했습니다." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const update: Record<string, any> = {};
    for (const field of EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        update[field] = body[field];
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: "수정할 내용이 없습니다." }, { status: 400 });
    }

    const supabase = getSupabaseServer();
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

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[PATCH /api/admin/companies/${id}]`, err);
    return NextResponse.json({ success: false, error: "단체 정보 수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

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
