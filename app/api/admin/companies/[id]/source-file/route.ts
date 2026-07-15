import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { detectResumeFileExtension, mimeTypeForExtension } from "@/lib/resumeFileTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only "AI 분석용 자료" resume upload/replace/delete — kept entirely
// separate from the applicant's original org-applications upload (see
// lib/companies.ts's downloadCompanySourceFileBuffer for the read side).
const BUCKET = "company-source-files";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB — actual file limit, matches org-applications' resume upload
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
    const { data: company, error: fetchError } = await supabase
      .from("companies" as any)
      .select("source_file_path")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error(`[GET /api/admin/companies/${id}/source-file] Fetch error:`, fetchError);
      return NextResponse.json({ success: false, error: "파일을 불러오지 못했습니다." }, { status: 500 });
    }

    const sourceFilePath = (company as any)?.source_file_path;
    if (!sourceFilePath) {
      return NextResponse.json({ success: false, error: "첨부된 파일이 없습니다." }, { status: 404 });
    }

    const { data: signed, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(sourceFilePath, SIGNED_URL_TTL_SECONDS);

    if (signError || !signed) {
      console.error(`[GET /api/admin/companies/${id}/source-file] Sign error:`, signError);
      return NextResponse.json({ success: false, error: "파일을 불러오지 못했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: signed.signedUrl });
  } catch (err: any) {
    console.error(`[GET /api/admin/companies/${id}/source-file] Catch error:`, err);
    return NextResponse.json({ success: false, error: "파일을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id } = await params;
  let uploadedPath: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "업로드할 파일을 선택해 주세요." }, { status: 400 });
    }

    const ext = detectResumeFileExtension(file.name, file.type);
    if (!ext) {
      return NextResponse.json({ success: false, error: "PDF, DOCX, TXT 파일만 업로드할 수 있습니다." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "파일 크기는 20MB를 초과할 수 없습니다." }, { status: 413 });
    }

    const supabase = getSupabaseServer();

    const { data: existing, error: existingError } = await supabase
      .from("companies" as any)
      .select("source_file_path")
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      console.error(`[POST /api/admin/companies/${id}/source-file] Fetch existing error:`, existingError);
      return NextResponse.json({ success: false, error: "단체 정보를 확인하지 못했습니다." }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ success: false, error: "단체를 찾을 수 없습니다." }, { status: 404 });
    }

    const previousPath = (existing as any).source_file_path as string | null;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    // Storage path is UUID-based, scoped under the company id — never the
    // admin's original filename (kept only for display in source_file_name).
    const filePath = `admin/${id}/${randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, { contentType: mimeTypeForExtension(ext), upsert: false });

    if (uploadError) {
      console.error(`[POST /api/admin/companies/${id}/source-file] Upload error:`, uploadError);
      return NextResponse.json({ success: false, error: "파일 업로드에 실패했습니다." }, { status: 500 });
    }
    uploadedPath = filePath;

    const now = new Date().toISOString();
    const { error: updateError } = await (supabase.from("companies" as any) as any)
      .update({
        source_file_path: filePath,
        source_file_name: file.name.slice(0, 255),
        source_file_size: file.size,
        source_file_uploaded_at: now,
        source_material_updated_at: now,
      })
      .eq("id", id);

    if (updateError) {
      console.error(`[POST /api/admin/companies/${id}/source-file] DB update error:`, updateError);
      // New file saved successfully but DB failed — clean up the orphaned
      // upload rather than leaving it dangling in Storage.
      const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([filePath]);
      if (cleanupError) console.error(`[POST /api/admin/companies/${id}/source-file] Cleanup error:`, cleanupError);
      return NextResponse.json({ success: false, error: "파일 정보 저장에 실패했습니다." }, { status: 500 });
    }

    // Only remove the previous file after the new one is fully saved and
    // committed — never delete-then-upload.
    if (previousPath && previousPath !== filePath) {
      const { error: removeError } = await supabase.storage.from(BUCKET).remove([previousPath]);
      if (removeError) {
        console.error(`[POST /api/admin/companies/${id}/source-file] Previous file cleanup error:`, removeError);
      }
    }

    return NextResponse.json({
      success: true,
      data: { source_file_path: filePath, source_file_name: file.name.slice(0, 255), source_file_size: file.size },
    });
  } catch (err: any) {
    console.error(`[POST /api/admin/companies/${id}/source-file] Catch error:`, err);
    if (uploadedPath) {
      const supabase = getSupabaseServer();
      const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([uploadedPath]);
      if (cleanupError) console.error(`[POST /api/admin/companies/${id}/source-file] Cleanup error:`, cleanupError);
    }
    return NextResponse.json({ success: false, error: "파일 업로드 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const supabase = getSupabaseServer();
    const { data: existing, error: fetchError } = await supabase
      .from("companies" as any)
      .select("source_file_path")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error(`[DELETE /api/admin/companies/${id}/source-file] Fetch error:`, fetchError);
      return NextResponse.json({ success: false, error: "단체 정보를 확인하지 못했습니다." }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ success: false, error: "단체를 찾을 수 없습니다." }, { status: 404 });
    }

    const sourceFilePath = (existing as any).source_file_path as string | null;
    if (!sourceFilePath) {
      return NextResponse.json({ success: false, error: "삭제할 파일이 없습니다." }, { status: 404 });
    }

    const { error: updateError } = await (supabase.from("companies" as any) as any)
      .update({
        source_file_path: null,
        source_file_name: null,
        source_file_size: null,
        source_file_uploaded_at: null,
        source_material_updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error(`[DELETE /api/admin/companies/${id}/source-file] DB update error:`, updateError);
      return NextResponse.json({ success: false, error: "파일 삭제에 실패했습니다." }, { status: 500 });
    }

    const { error: removeError } = await supabase.storage.from(BUCKET).remove([sourceFilePath]);
    if (removeError) {
      // DB is already cleared — a leftover Storage object is a cleanup nit,
      // not a reason to report failure to the admin.
      console.error(`[DELETE /api/admin/companies/${id}/source-file] Storage remove error:`, removeError);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[DELETE /api/admin/companies/${id}/source-file] Catch error:`, err);
    return NextResponse.json({ success: false, error: "파일 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
