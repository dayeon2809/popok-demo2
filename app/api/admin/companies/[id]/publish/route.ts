import { requireAdminApi } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getOrganizationApplicationByCompanyId } from "@/lib/companies";
import { notifyCompanyProfileApproved } from "@/lib/email/notify";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

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

    // This is the moment the company page actually goes live — the real
    // "단체 등록 승인" event a rep would expect an email about (as opposed to
    // the earlier organization_applications "approved" step, which only
    // creates a still-invisible draft company). No auth.users account is
    // linked to the application at this point either, so this sends to the
    // application's own contact email, not an account email. Awaited so it
    // completes before this function returns, but never turns a successful
    // publish into an error response.
    const application = await getOrganizationApplicationByCompanyId(id).catch(() => null);
    await notifyCompanyProfileApproved({
      companyId: id,
      applicantEmail: application?.email || "",
      recipientName: application?.contact_name || c.name || "대표자",
      companyName: c.name || "단체",
    }).catch((err) => console.error(`[POST /api/admin/companies/${id}/publish] Notification error:`, err));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[POST /api/admin/companies/${id}/publish]`, err);
    return NextResponse.json({ success: false, error: "공개 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
