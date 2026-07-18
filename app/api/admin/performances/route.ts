import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getPerformanceLifecycleStatus, isPerformanceDeletionPending } from "@/lib/date";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

const URL_PATTERN = /^https?:\/\/.+/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// GET — the admin list. No pagination/search per the "간단한 Admin CMS" scope
// (see AGENTS.md/PR context: performances list is small, this is a
// homepage-curation tool, not a full performance archive).
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseServer();
    // source_url is set on every crawler-imported row (479/480 of the current
    // table — see the investigation report) and is never written by this
    // admin form. Filtering it out keeps this "간단한 Admin CMS" list to just
    // the performances the admin actually manages, without a new column.
    const { data, error } = await supabase
      .from("performances" as any)
      .select("id, title, start_date, end_date, venue, description, genre, poster_url, organizer, external_url, company_id, status, featured, display_order, created_at, updated_at, companies ( id, name )")
      .is("source_url", null)
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/performances] Supabase error:", error);
      return NextResponse.json({ success: false, error: `목록 조회 실패: ${error.message}` }, { status: 500 });
    }

    const mapped = (data || []).map((row: any) => ({
      id: String(row.id),
      title: row.title || "",
      startDate: row.start_date || null,
      endDate: row.end_date || null,
      venue: row.venue || null,
      description: row.description || null,
      genre: row.genre || null,
      posterUrl: row.poster_url || null,
      organizer: row.organizer || null,
      externalUrl: row.external_url || null,
      companyId: row.company_id || null,
      companyName: row.companies?.name || null,
      isPublished: row.status === "published",
      isFeatured: !!row.featured,
      displayOrder: typeof row.display_order === "number" ? row.display_order : 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lifecycleStatus: getPerformanceLifecycleStatus(row.start_date, row.end_date),
      deletionPending: isPerformanceDeletionPending(row.end_date),
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (err: any) {
    console.error("[GET /api/admin/performances] Server error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST — create. Shares the same publish/feature validation rules as PATCH
// (see [id]/route.ts) — kept in sync manually since this is a small,
// single-purpose CMS with no shared validation module yet.
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  try {
    const body = await req.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ success: false, error: "공연명을 입력해 주세요." }, { status: 400 });
    }

    const startDate = typeof body.startDate === "string" && body.startDate ? body.startDate : null;
    const endDate = typeof body.endDate === "string" && body.endDate ? body.endDate : null;
    if (startDate && !DATE_PATTERN.test(startDate)) {
      return NextResponse.json({ success: false, error: "시작일 형식이 올바르지 않습니다." }, { status: 400 });
    }
    if (endDate && !DATE_PATTERN.test(endDate)) {
      return NextResponse.json({ success: false, error: "종료일 형식이 올바르지 않습니다." }, { status: 400 });
    }
    if (startDate && endDate && endDate < startDate) {
      return NextResponse.json({ success: false, error: "종료일은 시작일보다 빠를 수 없습니다." }, { status: 400 });
    }

    const externalUrl = typeof body.externalUrl === "string" ? body.externalUrl.trim() : "";
    if (externalUrl && !URL_PATTERN.test(externalUrl)) {
      return NextResponse.json({ success: false, error: "외부 링크는 http:// 또는 https://로 시작해야 합니다." }, { status: 400 });
    }

    const isPublished = !!body.isPublished;
    let isFeatured = !!body.isFeatured;

    if ((isPublished || isFeatured) && !externalUrl) {
      return NextResponse.json({ success: false, error: "공개 또는 메인 노출을 하려면 외부 링크가 필요합니다." }, { status: 400 });
    }
    if (isFeatured && !isPublished) {
      return NextResponse.json({ success: false, error: "메인 노출은 공개 상태에서만 설정할 수 있습니다. 먼저 공개로 전환해 주세요." }, { status: 400 });
    }

    let displayOrder = 0;
    if (body.displayOrder !== undefined && body.displayOrder !== null && body.displayOrder !== "") {
      const n = Number(body.displayOrder);
      if (!Number.isInteger(n)) {
        return NextResponse.json({ success: false, error: "노출 순서는 정수여야 합니다." }, { status: 400 });
      }
      displayOrder = n;
    }

    const supabase = getSupabaseServer();

    const insertRow: Record<string, any> = {
      // A client-supplied id lets the admin UI upload a poster to
      // performances/{id}/... before the row exists yet — see
      // app/admin/performances/page.tsx.
      id: typeof body.id === "string" && body.id ? body.id : randomUUID(),
      title,
      start_date: startDate,
      end_date: endDate,
      venue: typeof body.venue === "string" ? body.venue.trim() || null : null,
      description: typeof body.description === "string" ? body.description.trim() || null : null,
      genre: typeof body.genre === "string" ? body.genre.trim() || null : null,
      poster_url: typeof body.posterUrl === "string" ? body.posterUrl.trim() || null : null,
      organizer: typeof body.organizer === "string" ? body.organizer.trim() || null : null,
      external_url: externalUrl || null,
      company_id: typeof body.companyId === "string" && body.companyId ? body.companyId : null,
      status: isPublished ? "published" : "draft",
      featured: isFeatured,
      display_order: displayOrder,
    };

    const { data: created, error: insertError } = await (supabase.from("performances" as any) as any)
      .insert(insertRow)
      .select("id")
      .single();

    if (insertError) {
      console.error("[POST /api/admin/performances] Insert error:", insertError);
      return NextResponse.json({ success: false, error: `등록 실패: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { id: created.id } });
  } catch (err: any) {
    console.error("[POST /api/admin/performances] Server error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
