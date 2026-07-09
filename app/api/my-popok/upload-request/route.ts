import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "올바르지 않은 JSON 형식입니다." },
        { status: 400 }
      );
    }

    const submissionId = body.submissionId;
    const artistId = body.artistId || null;
    const requestType = body.requestType;
    const message = (body.message || "").trim();
    const contactEmail = body.contactEmail || null;

    if (!submissionId || !requestType || !message) {
      return NextResponse.json(
        { success: false, error: "필수 입력 항목(submissionId, requestType, message)이 누락되었습니다." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { error } = await (supabase.from("popok_upload_requests" as any) as any).insert({
      submission_id: Number(submissionId),
      artist_id: artistId || null,
      request_type: requestType,
      message: message,
      contact_email: contactEmail,
      status: "pending"
    });

    if (error) {
      console.error("[POST /api/my-popok/upload-request] Supabase error:", error);
      return NextResponse.json(
        { success: false, error: `요청 저장 실패: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[POST /api/my-popok/upload-request] Server error:", err);
    return NextResponse.json(
      { success: false, error: "서버 처리 중 오류가 발생했습니다.", detail: String(err) },
      { status: 500 }
    );
  }
}
