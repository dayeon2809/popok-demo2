import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const supabase = getSupabaseServer();
    const { data: company, error } = await supabase
      .from("companies" as any)
      .select("id, name, slug, bio_short, bio")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`[POST /api/admin/companies/${id}/publish]`, error);
      return NextResponse.json({ success: false, error: "단체 정보를 확인하지 못했습니다." }, { status: 500 });
    }
    if (!company) {
      return NextResponse.json({ success: false, error: "단체를 찾을 수 없습니다." }, { status: 404 });
    }

    const c = company as any;
    const missing: string[] = [];
    if (!c.name || !String(c.name).trim()) missing.push("단체명");
    if (!c.slug || !String(c.slug).trim()) missing.push("slug (단체 주소)");

    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `공개하려면 다음 항목이 필요합니다: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    if (c.slug) {
      const { data: dupe } = await supabase
        .from("companies" as any)
        .select("id")
        .eq("slug", c.slug)
        .neq("id", id)
        .maybeSingle();
      if (dupe) {
        return NextResponse.json({ success: false, error: "다른 단체가 이미 같은 slug를 사용하고 있습니다." }, { status: 400 });
      }
    }

    const { error: updateError } = await (supabase.from("companies" as any) as any)
      .update({ status: "published" })
      .eq("id", id);

    if (updateError) {
      console.error(`[POST /api/admin/companies/${id}/publish] update error:`, updateError);
      return NextResponse.json({ success: false, error: "공개 처리에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[POST /api/admin/companies/${id}/publish]`, err);
    return NextResponse.json({ success: false, error: "공개 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
