import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const supabaseUserClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    // Verify company & ownership
    const { data: company, error: fetchError } = await supabase
      .from("companies" as any)
      .select("owner_id")
      .eq("id", companyId)
      .maybeSingle();

    if (fetchError || !company) {
      return NextResponse.json({ success: false, error: "단체를 찾을 수 없습니다." }, { status: 404 });
    }

    if (String((company as any).owner_id) !== user.id) {
      return NextResponse.json({ success: false, error: "이 단체의 일정을 조회할 권한이 없습니다." }, { status: 403 });
    }

    // Fetch all performances for this company
    const { data: performances, error: perfError } = await supabase
      .from("performances" as any)
      .select("*")
      .eq("company_id", companyId)
      .order("start_date", { ascending: true });

    if (perfError) {
      console.error(`[GET /api/companies/${companyId}/performances] Supabase error:`, perfError);
      return NextResponse.json({ success: false, error: "일정 조회 실패" }, { status: 500 });
    }

    const mapped = (performances || []).map((row: any) => ({
      id: String(row.id),
      title: row.title || "",
      startDate: row.start_date || null,
      endDate: row.end_date || null,
      venue: row.venue || null,
      description: row.description || null,
      genre: row.genre || null,
      category: row.category || null,
      posterUrl: row.poster_url || null,
      organizer: row.organizer || null,
      externalUrl: row.external_url || null,
      ticketUrl: row.ticket_url || null,
      sourceUrl: row.source_url || null,
      companyId: row.company_id || null,
      isPublished: row.status === "published",
      isFeatured: !!row.featured,
      displayOrder: typeof row.display_order === "number" ? row.display_order : 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (err: any) {
    console.error("[GET /api/companies/[id]/performances] Unexpected error:", err);
    return NextResponse.json({ success: false, error: "서버 오류" }, { status: 500 });
  }
}
