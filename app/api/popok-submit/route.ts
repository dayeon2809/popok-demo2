import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch (parseErr) {
      return NextResponse.json(
        { success: false, error: "요청 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const name = (body.name || "").trim();
    const genre = (body.genre || "").trim();
    const instagram = (body.instagram || "").trim();

    if (!name || !genre || !instagram) {
      return NextResponse.json(
        { success: false, error: "이름, 장르, 인스타그램 링크는 모두 필수 항목입니다." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    
    // Insert into 'submissions' table
    const { data, error } = await (supabase.from("submissions" as any) as any)
      .insert({
        name: name,
        genre: genre,
        instagram: instagram,
        email: `beta-${name.replace(/\s+/g, "").toLowerCase()}@popok.kr`, // Dummy email to satisfy any schema constraints
        status: "pending"
      } as any)
      .select("id")
      .single();

    if (error) {
      console.error("[POST /api/popok-submit] Supabase error:", error);
      return NextResponse.json(
        { success: false, error: "데이터 저장 중 오류가 발생했습니다.", detail: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "등록된 ID를 가져오지 못했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err: any) {
    console.error("[POST /api/popok-submit] Internal error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
