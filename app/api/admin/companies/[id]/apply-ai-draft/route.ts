import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { mergeCurrentActivity, mergeWorks, mergeAwards, mergeLinks } from "@/lib/mergeCompanyArrays";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

// Matches the "단일 필드" comparison list in the admin UI — deliberately
// excludes `name` (the AI draft may suggest one, but it's not offered as an
// applicable field here).
const SINGLE_FIELDS = ["name_en", "genre", "category", "city_or_region", "bio_short", "bio"] as const;

const ARRAY_MERGERS: Record<string, (existing: any[], incoming: any[]) => any[]> = {
  current_activity: mergeCurrentActivity,
  works: mergeWorks,
  awards: mergeAwards,
  links: mergeLinks,
};

type ArrayMode = "skip" | "merge" | "replace";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const requestedFields: string[] = Array.isArray(body?.fields) ? body.fields : [];
    const requestedArrays: Record<string, ArrayMode> = body?.arrays && typeof body.arrays === "object" ? body.arrays : {};

    const supabase = getSupabaseServer();
    const { data: company, error: fetchError } = await supabase
      .from("companies" as any)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error(`[POST /api/admin/companies/${id}/apply-ai-draft]`, fetchError);
      return NextResponse.json({ success: false, error: "단체 정보를 가져오는 데 실패했습니다." }, { status: 500 });
    }
    if (!company) {
      return NextResponse.json({ success: false, error: "단체를 찾을 수 없습니다." }, { status: 404 });
    }

    const c = company as any;
    // Server always reads its own stored ai_draft — the client only ever
    // sends field/array *names* and modes, never AI content itself.
    const draft = c.ai_draft;
    if (!draft || !["ready", "applied"].includes(c.ai_draft_status)) {
      return NextResponse.json({ success: false, error: "적용할 수 있는 AI 초안이 없습니다. 먼저 AI 구조화를 실행해 주세요." }, { status: 400 });
    }

    const update: Record<string, any> = {};

    for (const field of SINGLE_FIELDS) {
      if (!requestedFields.includes(field)) continue;
      const aiValue = typeof draft[field] === "string" ? draft[field].trim() : "";
      // Never overwrite an existing value with an empty AI suggestion.
      if (aiValue) update[field] = aiValue;
    }

    for (const [arrayField, merger] of Object.entries(ARRAY_MERGERS)) {
      const mode = requestedArrays[arrayField] || "skip";
      if (mode === "skip") continue;

      const existing = Array.isArray(c[arrayField]) ? c[arrayField] : [];
      const incoming = Array.isArray(draft[arrayField]) ? draft[arrayField] : [];

      if (mode === "merge") {
        update[arrayField] = merger(existing, incoming);
      } else if (mode === "replace") {
        // Never replace existing data with an empty AI result.
        if (incoming.length > 0) update[arrayField] = incoming;
      }
    }

    update.ai_draft_status = "applied";

    const { error: updateError } = await (supabase.from("companies" as any) as any)
      .update(update)
      .eq("id", id);

    if (updateError) {
      console.error(`[POST /api/admin/companies/${id}/apply-ai-draft] update error:`, updateError);
      return NextResponse.json({ success: false, error: "AI 초안 적용에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[POST /api/admin/companies/${id}/apply-ai-draft]`, err);
    return NextResponse.json({ success: false, error: "AI 초안 적용 중 오류가 발생했습니다." }, { status: 500 });
  }
}
