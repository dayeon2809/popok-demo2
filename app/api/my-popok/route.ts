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

    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const code = (body.code || "").trim();

    if (!name && !email && !code) {
      return NextResponse.json(
        { success: false, error: "조회를 위해 이름, 이메일 혹은 등록번호를 입력해 주세요." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    let dbQuery = (supabase.from("submissions" as any) as any).select("*");

    let orConditions: string[] = [];

    // 1. (name AND email) 매치 또는 개별 매치
    if (name && email) {
      orConditions.push(`and(name.eq.${name},email.eq.${email})`);
    } else if (name) {
      orConditions.push(`name.eq.${name}`);
    } else if (email) {
      orConditions.push(`email.eq.${email}`);
    }

    // 2. 등록코드 / 번호 매치
    if (code) {
      const numericId = Number(code);
      if (!isNaN(numericId) && code !== "") {
        orConditions.push(`id.eq.${numericId}`);
      }
      orConditions.push(`claim_code.eq.${code}`);
    }

    if (orConditions.length > 0) {
      dbQuery = dbQuery.or(orConditions.join(","));
    }

    const { data, error } = await dbQuery
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[POST /api/my-popok] Supabase error:", error);
      return NextResponse.json(
        { success: false, error: `조회 실패: ${error.message}` },
        { status: 500 }
      );
    }

    // If submission found, check if it has a published artist associated
    let artistSlug: string | null = null;
    if (data) {
      const { data: artistData, error: artistErr } = await (supabase.from("artists" as any) as any)
        .select("slug")
        .eq("submission_id", data.id)
        .eq("status", "published")
        .maybeSingle();
      
      if (!artistErr && artistData?.slug) {
        artistSlug = artistData.slug;
      }
    }

    return NextResponse.json({
      success: true,
      data: data || null,
      artistSlug,
    });
  } catch (err: any) {
    console.error("[POST /api/my-popok] Server error:", err);
    return NextResponse.json(
      { success: false, error: "서버 내부 처리 오류가 발생했습니다.", detail: String(err) },
      { status: 500 }
    );
  }
}
