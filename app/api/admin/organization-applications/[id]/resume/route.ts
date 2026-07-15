import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const BUCKET = "org-applications";
const SIGNED_URL_TTL_SECONDS = 60;

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const supabase = getSupabaseServer();
    const { data: application, error: fetchError } = await supabase
      .from("organization_applications" as any)
      .select("resume_file_path")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error(`[GET /api/admin/organization-applications/${id}/resume] Fetch error:`, fetchError);
      return NextResponse.json({ success: false, error: "파일을 불러오지 못했습니다." }, { status: 500 });
    }

    const resumeFilePath = (application as any)?.resume_file_path;
    if (!resumeFilePath) {
      return NextResponse.json({ success: false, error: "첨부된 파일이 없습니다." }, { status: 404 });
    }

    const { data: signed, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(resumeFilePath, SIGNED_URL_TTL_SECONDS);

    if (signError || !signed) {
      console.error(`[GET /api/admin/organization-applications/${id}/resume] Sign error:`, signError);
      return NextResponse.json({ success: false, error: "파일을 불러오지 못했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: signed.signedUrl });
  } catch (err: any) {
    console.error(`[GET /api/admin/organization-applications/${id}/resume] Catch error:`, err);
    return NextResponse.json({ success: false, error: "파일을 불러오지 못했습니다." }, { status: 500 });
  }
}
