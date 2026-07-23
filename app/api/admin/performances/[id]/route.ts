import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { PERFORMANCE_POSTER_BUCKET, extractPerformancePosterPath } from "@/lib/performances";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

const URL_PATTERN = /^https?:\/\/.+/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// PATCH — partial update. Used for both the full edit form and the list's
// quick toggles (공개/메인 노출/노출 순서), which all send a partial body
// through this same endpoint.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, error: "유효하지 않은 공연 ID입니다." }, { status: 400 });
  }

  try {
    const body = await req.json();
    const supabase = getSupabaseServer();

    const { data: existing, error: fetchError } = await supabase
      .from("performances" as any)
      .select("id, start_date, end_date, external_url, ticket_url, status, featured, poster_url")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error(`[PATCH /api/admin/performances/${id}] Fetch error:`, fetchError);
      return NextResponse.json({ success: false, error: "공연 정보를 확인하지 못했습니다." }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ success: false, error: "공연을 찾을 수 없습니다." }, { status: 404 });
    }
    const current = existing as any;

    const updateData: Record<string, any> = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json({ success: false, error: "공연명을 입력해 주세요." }, { status: 400 });
      }
      updateData.title = title;
    }

    // Effective (post-patch) date/url/publish values, for cross-field validation.
    const effectiveStart =
      body.startDate !== undefined ? (body.startDate || null) : current.start_date;
    const effectiveEnd =
      body.endDate !== undefined ? (body.endDate || null) : current.end_date;

    if (body.startDate !== undefined) {
      if (effectiveStart && !DATE_PATTERN.test(effectiveStart)) {
        return NextResponse.json({ success: false, error: "시작일 형식이 올바르지 않습니다." }, { status: 400 });
      }
      updateData.start_date = effectiveStart;
    }
    if (body.endDate !== undefined) {
      if (effectiveEnd && !DATE_PATTERN.test(effectiveEnd)) {
        return NextResponse.json({ success: false, error: "종료일 형식이 올바르지 않습니다." }, { status: 400 });
      }
      updateData.end_date = effectiveEnd;
    }
    if (effectiveStart && effectiveEnd && effectiveEnd < effectiveStart) {
      return NextResponse.json({ success: false, error: "종료일은 시작일보다 빠를 수 없습니다." }, { status: 400 });
    }

    let effectiveExternalUrl = current.external_url || "";
    if (body.externalUrl !== undefined) {
      const url = typeof body.externalUrl === "string" ? body.externalUrl.trim() : "";
      if (url && !URL_PATTERN.test(url)) {
        return NextResponse.json({ success: false, error: "외부 링크는 http:// 또는 https://로 시작해야 합니다." }, { status: 400 });
      }
      updateData.external_url = url || null;
      effectiveExternalUrl = url;
    }

    if (body.ticketUrl !== undefined) {
      const url = typeof body.ticketUrl === "string" ? body.ticketUrl.trim() : "";
      if (url && !URL_PATTERN.test(url)) {
        return NextResponse.json({ success: false, error: "예매 링크는 http:// 또는 https://로 시작해야 합니다." }, { status: 400 });
      }
      updateData.ticket_url = url || null;
    }

    const effectivePublished =
      body.isPublished !== undefined ? !!body.isPublished : current.status === "published";
    const effectiveFeatured =
      body.isFeatured !== undefined ? !!body.isFeatured : !!current.featured;

    const companyId = body.companyId !== undefined ? (typeof body.companyId === "string" && body.companyId ? body.companyId : null) : current.company_id;

    let isCompanyEvent = false;
    if (companyId) {
      // 1. Verify company exists in database
      const { data: companyExists, error: companyCheckError } = await supabase
        .from("companies" as any)
        .select("id")
        .eq("id", companyId)
        .maybeSingle();
      
      if (companyCheckError) {
        console.error(`[PATCH /api/admin/performances/${id}] Company check error:`, companyCheckError);
      }
      if (companyExists) {
        isCompanyEvent = true;
      } else {
        return NextResponse.json({ success: false, error: "존재하지 않는 단체 ID입니다." }, { status: 400 });
      }
    }

    if ((effectivePublished || effectiveFeatured) && !effectiveExternalUrl) {
      if (effectiveFeatured || !isCompanyEvent) {
        return NextResponse.json({ success: false, error: "공개 또는 메인 노출을 하려면 외부 링크가 필요합니다." }, { status: 400 });
      }
    }

    if (effectiveFeatured && !effectivePublished) {
      return NextResponse.json({ success: false, error: "메인 노출은 공개 상태에서만 설정할 수 있습니다. 먼저 공개로 전환해 주세요." }, { status: 400 });
    }

    if (body.isPublished !== undefined) updateData.status = effectivePublished ? "published" : "draft";
    if (body.isFeatured !== undefined) updateData.featured = effectiveFeatured;

    if (typeof body.venue === "string") updateData.venue = body.venue.trim() || null;
    if (typeof body.description === "string") updateData.description = body.description.trim() || null;
    if (typeof body.genre === "string") updateData.genre = body.genre.trim() || null;
    if (typeof body.organizer === "string") updateData.organizer = body.organizer.trim() || null;
    if (body.companyId !== undefined) {
      updateData.company_id = companyId;
    }

    let previousPosterPath: string | null = null;
    if (body.posterUrl !== undefined) {
      const newPosterUrl = typeof body.posterUrl === "string" ? body.posterUrl.trim() || null : null;
      updateData.poster_url = newPosterUrl;
      if (current.poster_url && current.poster_url !== newPosterUrl) {
        previousPosterPath = extractPerformancePosterPath(current.poster_url);
      }
    }

    if (body.displayOrder !== undefined) {
      const n = Number(body.displayOrder);
      if (!Number.isInteger(n)) {
        return NextResponse.json({ success: false, error: "노출 순서는 정수여야 합니다." }, { status: 400 });
      }
      updateData.display_order = n;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: "수정할 내용이 없습니다." }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { error: updateError } = await (supabase.from("performances" as any) as any)
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      console.error(`[PATCH /api/admin/performances/${id}] Update error:`, updateError);
      return NextResponse.json({ success: false, error: `수정 실패: ${updateError.message}` }, { status: 500 });
    }

    // Helper function for server-side revalidation
    const triggerRevalidation = async (compId: string | null) => {
      try {
        revalidatePath("/");
        if (compId) {
          const { data: comp } = await supabase
            .from("companies" as any)
            .select("slug")
            .eq("id", compId)
            .maybeSingle();
          if ((comp as any)?.slug) {
            revalidatePath(`/companies/${(comp as any).slug}`);
          }
          revalidatePath(`/admin/companies/${compId}`);
        }
      } catch (e) {
        console.error("Revalidation error:", e);
      }
    };

    // Revalidate paths on successful update
    if (current.company_id) {
      await triggerRevalidation(current.company_id);
    }
    if (companyId && companyId !== current.company_id) {
      await triggerRevalidation(companyId);
    }
    if (!current.company_id && !companyId) {
      try {
        revalidatePath("/");
      } catch {}
    }

    // Old poster is only removed after the new reference is safely committed.
    if (previousPosterPath) {
      const { error: removeError } = await supabase.storage.from(PERFORMANCE_POSTER_BUCKET).remove([previousPosterPath]);
      if (removeError) {
        console.error(`[PATCH /api/admin/performances/${id}] Previous poster cleanup error:`, removeError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[PATCH /api/admin/performances/${id}] Server error:`, err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// DELETE — removes the row, then best-effort removes its poster from
// Storage. DB is the source of truth: a leftover Storage object after a
// failed cleanup is a nit (logged), not a reason to report failure —
// same philosophy as [id]/source-file's DELETE.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, error: "유효하지 않은 공연 ID입니다." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    const { data: existing, error: fetchError } = await supabase
      .from("performances" as any)
      .select("poster_url, company_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error(`[DELETE /api/admin/performances/${id}] Fetch error:`, fetchError);
      return NextResponse.json({ success: false, error: "공연 정보를 확인하지 못했습니다." }, { status: 500 });
    }

    const posterPath = extractPerformancePosterPath((existing as any)?.poster_url);

    const { error: deleteError } = await supabase
      .from("performances" as any)
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error(`[DELETE /api/admin/performances/${id}] Delete error:`, deleteError);
      return NextResponse.json({ success: false, error: `삭제 실패: ${deleteError.message}` }, { status: 500 });
    }

    // Trigger revalidations
    try {
      revalidatePath("/");
      const companyId = (existing as any)?.company_id;
      if (companyId) {
        const { data: comp } = await supabase
          .from("companies" as any)
          .select("slug")
          .eq("id", companyId)
          .maybeSingle();
        
        if ((comp as any)?.slug) {
          revalidatePath(`/companies/${(comp as any).slug}`);
        }
        revalidatePath(`/admin/companies/${companyId}`);
      }
    } catch (revalErr) {
      console.error(`[DELETE /api/admin/performances/${id}] Revalidation error:`, revalErr);
    }

    if (posterPath) {
      const { error: removeError } = await supabase.storage.from(PERFORMANCE_POSTER_BUCKET).remove([posterPath]);
      if (removeError) {
        console.error(`[DELETE /api/admin/performances/${id}] Poster cleanup error:`, removeError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[DELETE /api/admin/performances/${id}] Server error:`, err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
