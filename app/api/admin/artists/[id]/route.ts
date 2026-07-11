import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
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
