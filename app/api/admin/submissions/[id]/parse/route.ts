import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { parseSubmissionWithAI } from "@/lib/aiParser";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

// POST /api/admin/submissions/[id]/parse
// submission 원문(이름/장르/bio_short/additional_requests)을 AI로 구조화해
// submissions.parsed_profile에 "임시 저장"한다. artists 테이블은 절대 건드리지 않는다.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id } = await params;
  const numericId = Number(id);
  const supabase = getSupabaseServer();

  try {
    // 1. submission 원문 조회
    const { data: subData, error: subErr } = await (supabase.from("submissions" as any) as any)
      .select("*")
      .eq("id", numericId)
      .single();

    if (subErr || !subData) {
      return NextResponse.json({ success: false, error: "등록 신청서 데이터를 찾지 못했습니다." }, { status: 404 });
    }

    // 2. parser_status를 parsing으로 표시
    await (supabase.from("submissions" as any) as any)
      .update({ parser_status: "parsing", parser_error: null })
      .eq("id", numericId);

    // 3. AI Parser 호출 (+ 내부적으로 JSON 유효성 검증까지 수행)
    const result = await parseSubmissionWithAI({
      name: subData.name,
      genre: subData.genre,
      instagram: subData.instagram,
      bioShort: subData.bio_short,
      additionalRequests: subData.additional_requests,
    });

    if (!result.success || !result.profile) {
      await (supabase.from("submissions" as any) as any)
        .update({ parser_status: "error", parser_error: result.error || "알 수 없는 오류" })
        .eq("id", numericId);

      return NextResponse.json(
        { success: false, error: result.error || "AI 정리에 실패했습니다." },
        { status: 502 }
      );
    }

    // 4. 성공 — parsed_profile에 임시 저장, parser_status = parsed
    //    (artists 테이블은 여기서 절대 수정하지 않는다 — 관리자 검수 후 "공개 승인"에서만 반영)
    const nowIso = new Date().toISOString();
    const { error: updateErr } = await (supabase.from("submissions" as any) as any)
      .update({
        parsed_profile: result.profile,
        parsed_at: nowIso,
        parser_status: "parsed",
        parser_error: null,
      })
      .eq("id", numericId);

    if (updateErr) {
      return NextResponse.json(
        { success: false, error: "정리 결과 저장에 실패했습니다.", detail: updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, parsed_profile: result.profile, parser_status: "parsed" });
  } catch (err: any) {
    console.error(`[POST /api/admin/submissions/${id}/parse]`, err);
    try {
      await (supabase.from("submissions" as any) as any)
        .update({ parser_status: "error", parser_error: String(err?.message || err) })
        .eq("id", numericId);
    } catch {
      // best-effort — 원래 에러를 그대로 반환한다
    }
    return NextResponse.json(
      { success: false, error: "AI 정리 처리 중 오류가 발생했습니다.", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
