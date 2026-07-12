import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { parsedArtistProfileSchema } from "@/lib/parsedProfile";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

// PATCH /api/admin/submissions/[id]/parsed-profile
// 관리자가 검수/수정한 parsed_profile을 저장한다 ("정리 결과 저장" 버튼).
// 이 요청은 submissions.parsed_profile만 갱신하며 artists 테이블은 절대 수정하지 않는다.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id } = await params;
  const numericId = Number(id);

  try {
    const body = await req.json();
    const validated = parsedArtistProfileSchema.safeParse(body?.parsed_profile);

    if (!validated.success) {
      const detail = validated.error.issues
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { success: false, error: `저장할 데이터가 올바르지 않습니다: ${detail}` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { error } = await (supabase.from("submissions" as any) as any)
      .update({
        parsed_profile: validated.data,
        parsed_at: new Date().toISOString(),
        parser_status: "reviewed",
      })
      .eq("id", numericId);

    if (error) {
      console.error("Update parsed_profile error:", error);
      return NextResponse.json(
        { success: false, error: "정리 결과 저장에 실패했습니다.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, parser_status: "reviewed" });
  } catch (err: any) {
    console.error(`[PATCH /api/admin/submissions/${id}/parsed-profile]`, err);
    return NextResponse.json(
      { success: false, error: "저장 처리 중 오류가 발생했습니다.", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
