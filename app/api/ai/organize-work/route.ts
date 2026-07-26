import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { organizeWorkWithAI } from "@/lib/aiWorkOrganizer";
import { checkRateLimit } from "@/lib/simpleRateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  const rateLimit = checkRateLimit(`ai-organize-work:${user.id}`, { windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX_REQUESTS });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) } }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const input = {
    title: typeof body?.title === "string" ? body.title.slice(0, 200) : "",
    description: typeof body?.description === "string" ? body.description.slice(0, 500) : "",
    role: typeof body?.role === "string" ? body.role.slice(0, 100) : "",
    year: typeof body?.year === "string" || typeof body?.year === "number" ? String(body.year) : "",
    fileName: typeof body?.fileName === "string" ? body.fileName.slice(0, 200) : "",
    artistGenre: typeof body?.artistGenre === "string" ? body.artistGenre.slice(0, 100) : "",
    artistBioShort: typeof body?.artistBioShort === "string" ? body.artistBioShort.slice(0, 300) : "",
  };

  try {
    const result = await Promise.race([
      organizeWorkWithAI(input),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("ORGANIZE_TIMEOUT")), 25_000)),
    ]);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "AI 정리에 실패했습니다." }, { status: 422 });
    }
    return NextResponse.json({ success: true, data: result.data });
  } catch (err: any) {
    const timedOut = err?.message === "ORGANIZE_TIMEOUT";
    console.error("[POST /api/ai/organize-work] Error:", err?.message || err);
    return NextResponse.json(
      { success: false, error: timedOut ? "응답 시간이 초과되었어요." : "AI 정리 중 오류가 발생했습니다." },
      { status: timedOut ? 504 : 500 }
    );
  }
}
