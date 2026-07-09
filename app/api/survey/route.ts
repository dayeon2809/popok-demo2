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

    const { genre, field, contact, feedback } = body;

    if (!genre || !String(genre).trim()) {
      return NextResponse.json(
        { success: false, error: "원하는 장르명은 필수 입력 항목입니다." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { error } = await (supabase.from("genre_requests") as any).insert({
      genre: String(genre).trim(),
      field: field ? String(field).trim() : null,
      contact: contact ? String(contact).trim() : null,
      feedback: feedback ? String(feedback).trim() : null,
    });

    if (error) {
      console.error("[POST /api/survey] Supabase Error:", error);
      return NextResponse.json(
        { success: false, error: `데이터베이스 저장 실패: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[POST /api/survey] Server error:", err);
    return NextResponse.json(
      { success: false, error: "서버 처리 중 오류가 발생했습니다.", detail: String(err) },
      { status: 500 }
    );
  }
}
