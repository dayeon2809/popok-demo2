import { NextRequest, NextResponse } from "next/server";
import { createSubmission } from "@/lib/supabaseSubmissions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch (parseErr) {
      return NextResponse.json(
        { success: false, error: "요청 본문이 올바르지 않은 JSON 형식입니다.", detail: String(parseErr) },
        { status: 400 }
      );
    }

    // 필수값 검증
    const name  = (body?.name  ?? "").trim();
    const email = (body?.email ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { success: false, error: "이름은 필수 항목입니다." },
        { status: 400 }
      );
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "올바른 이메일 주소를 입력해주세요." },
        { status: 400 }
      );
    }

    const result = await createSubmission({
      name,
      email,
      instagram:     (body?.instagram     ?? "").trim(),
      website:       (body?.website        ?? "").trim(),
      bio:           (body?.bio            ?? "").trim(),
      works:         (body?.works          ?? "").trim(),
      portfolio_url: (body?.portfolio_url  ?? "").trim(),
      name_en:       (body?.name_en        ?? "").trim(),
      city_or_region:(body?.city_or_region ?? "").trim(),
      bio_short:     (body?.bio_short      ?? "").trim(),
      portfolio_works: body?.portfolio_works || [],
    });

    return NextResponse.json({ success: true, id: result.id }, { status: 200 });
  } catch (err: any) {
    console.error("[POST /api/submit]", err);

    let errorMsg = "신청 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    let detailMsg = String(err);
    let status = 500;

    if (err && typeof err === "object") {
      if (err.code) {
        detailMsg = `SupabaseError [${err.code}]: ${err.message || "Database operation failed"}`;
      } else if (err.message) {
        detailMsg = `SupabaseError: ${err.message}`;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        detail: detailMsg,
      },
      { status }
    );
  }
}

