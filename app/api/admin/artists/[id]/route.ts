import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { checkAdminAuth } from "@/lib/adminAuth";
import { buildArtistUpdateFromPayload, normalizeArtistRepresentativeImages } from "@/lib/artist-profile";
import { normalizeWorks } from "@/lib/works";

export const dynamic = "force-dynamic";

const checkAuth = checkAdminAuth;

// GET: Full artist row for the admin profile editor (app/admin/artists/[id]/edit),
// plus the owner's display_name/email (if any) so that screen can show
// "연결된 사용자 있음" vs "소유자 없는 프로필" without exposing anything beyond
// what /admin/artists already surfaces per-row.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id: artistId } = await params;
  if (!artistId) {
    return NextResponse.json({ success: false, error: "유효하지 않은 아티스트 ID입니다." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();
    const { data: artist, error } = await (supabase.from("artists") as any)
      .select("*")
      .eq("id", artistId)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/admin/artists/[id]] Query error:", error);
      return NextResponse.json({ success: false, error: `아티스트 조회 실패: ${error.message}` }, { status: 500 });
    }
    if (!artist) {
      return NextResponse.json({ success: false, error: "아티스트를 찾을 수 없습니다." }, { status: 404 });
    }

    let ownerProfile: { display_name: string | null; email: string | null } | null = null;
    if (artist.owner_id) {
      const { data: profile } = await (supabase.from("profiles") as any)
        .select("display_name, email")
        .eq("id", artist.owner_id)
        .maybeSingle();
      ownerProfile = profile ? { display_name: profile.display_name || null, email: profile.email || null } : null;
    }

    artist.profile_image_urls = normalizeArtistRepresentativeImages(artist.profile_image_urls);
    artist.works = normalizeWorks(artist.works);

    return NextResponse.json({ success: true, data: artist, ownerProfile });
  } catch (err: any) {
    console.error("[GET /api/admin/artists/[id]] Server error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  // artists.id는 uuid 문자열이다 — Number()로 변환하지 않고 그대로 다룬다.
  const { id: artistId } = await params;

  if (!artistId) {
    return NextResponse.json({ success: false, error: "유효하지 않은 아티스트 ID입니다." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    // performances 테이블은 현재 스키마에 존재하지 않으므로 연결 해제 단계는 더 이상 필요하지 않다.

    const { error: deleteErr } = await supabase
      .from("artists")
      .delete()
      .eq("id", artistId);

    if (deleteErr) {
      console.error("[DELETE /api/admin/artists/[id]] Delete artist error:", deleteErr);
      return NextResponse.json({ success: false, error: `아티스트 삭제 실패: ${deleteErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/admin/artists/[id]] Server error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다.", detail: String(err) }, { status: 500 });
  }
}

// Whitelisted, real-column-only partial edit. Admin-override write path for
// artists.owner_id — deliberately does NOT filter by owner_id (unlike POST
// /api/artists/me), since an admin may edit any artist including ones with
// no owner. owner_id itself is never part of the whitelist below, so an
// admin edit can never reassign or clear an existing connection.
//
// Two callers share this handler:
//  - The quick inline edit on /admin/artists (name/name_en/genre/role/
//    bio_short/status only) — those five fields keep their original
//    server-side `.trim()` below so that path's behavior is unchanged.
//  - The full profile editor at /admin/artists/[id]/edit (reuses
//    MyPopokClient), which can send the same full field set POST
//    /api/artists/me accepts — buildArtistUpdateFromPayload (shared with
//    that route) applies the identical JSONB normalizers so an admin save
//    merges/persists data exactly like a self-serve save does.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id: artistId } = await params;
  if (!artistId) {
    return NextResponse.json({ success: false, error: "유효하지 않은 아티스트 ID입니다." }, { status: 400 });
  }

  try {
    const body = await req.json();

    const { updateData, error: buildError } = buildArtistUpdateFromPayload(body);
    if (buildError) {
      return NextResponse.json({ success: false, error: buildError }, { status: 400 });
    }

    // Legacy quick-edit contract: these five fields are trimmed server-side,
    // overriding the untrimmed values buildArtistUpdateFromPayload set above
    // (that function mirrors /api/artists/me, whose caller already trims
    // client-side, so it deliberately doesn't trim itself).
    if (typeof body.name === "string") updateData.name = body.name.trim();
    if (typeof body.name_en === "string") updateData.name_en = body.name_en.trim();
    if (typeof body.genre === "string") updateData.genre = body.genre.trim();
    if (typeof body.role === "string") updateData.role = body.role.trim();
    if (typeof body.bio_short === "string") updateData.bio_short = body.bio_short.trim();

    if (body.status !== undefined) {
      if (body.status !== "published" && body.status !== "draft") {
        return NextResponse.json({ success: false, error: "status는 published 또는 draft만 허용됩니다." }, { status: 400 });
      }
      updateData.status = body.status;
    }

    // updateData always carries updated_at (set by buildArtistUpdateFromPayload)
    // — anything beyond that one key means a real field was actually submitted.
    if (Object.keys(updateData).length <= 1) {
      return NextResponse.json({ success: false, error: "수정할 내용이 없습니다." }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: updated, error: updateErr } = await (supabase.from("artists") as any)
      .update(updateData)
      .eq("id", artistId)
      .select()
      .maybeSingle();

    if (updateErr) {
      console.error("[PATCH /api/admin/artists/[id]] Update error:", updateErr);
      return NextResponse.json({ success: false, error: `수정 실패: ${updateErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("[PATCH /api/admin/artists/[id]] Server error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다.", detail: String(err) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  // artists.id는 uuid 문자열이다 — Number()로 변환하지 않고 그대로 다룬다.
  const { id: artistId } = await params;

  if (!artistId) {
    return NextResponse.json({ success: false, error: "유효하지 않은 아티스트 ID입니다." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    // Generate a random claim code: poc_xxxxxxxx
    const randomHex = Math.random().toString(16).substring(2, 10);
    const generatedCode = `poc_${randomHex}`;

    const { error: updateErr } = await (supabase.from("artists") as any)
      .update({ claim_code: generatedCode })
      .eq("id", artistId);

    if (updateErr) {
      console.error("[POST /api/admin/artists/[id]] Generate claim code error:", updateErr);
      return NextResponse.json({ success: false, error: `인증 코드 생성 실패: ${updateErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, claimCode: generatedCode });
  } catch (err: any) {
    console.error("[POST /api/admin/artists/[id]] Server error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다.", detail: String(err) }, { status: 500 });
  }
}
