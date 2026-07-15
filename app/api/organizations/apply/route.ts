import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TODO: rate limit this public endpoint if abuse is observed (no rate-limit infra in this project yet)

const BUCKET = "org-applications";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB — matches client validation + Storage bucket fileSizeLimit
const GENERIC_ERROR = "신청 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SHORT_FIELD_MAX = 200; // org_name / contact_name / instagram
const MEDIUM_FIELD_MAX = 300; // email / phone / website
const DESCRIPTION_MAX = 2000;

function devError(label: string, err: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(label, err);
  }
}

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
  let uploadedPath: string | null = null;

  try {
    const formData = await req.formData();

    // Honeypot: real users never see or fill this field. If it has a value,
    // treat the submission as spam — respond as if it succeeded so bots get
    // no signal, but don't touch the database or Storage.
    const honeypot = getString(formData, "company_website");
    if (honeypot) {
      return NextResponse.json({ success: true });
    }

    const orgName = getString(formData, "org_name");
    const contactName = getString(formData, "contact_name");
    const email = getString(formData, "email");
    const phone = getString(formData, "phone");
    const instagram = getString(formData, "instagram");
    const website = getString(formData, "website");
    const description = getString(formData, "description");
    const file = formData.get("file") as File | null;

    if (!orgName || !contactName || !email || !phone || !instagram) {
      return NextResponse.json({ success: false, error: "필수 항목을 모두 입력해 주세요." }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, error: "올바른 이메일 주소를 입력해 주세요." }, { status: 400 });
    }
    if (orgName.length > SHORT_FIELD_MAX || contactName.length > SHORT_FIELD_MAX || instagram.length > SHORT_FIELD_MAX) {
      return NextResponse.json({ success: false, error: "입력하신 내용이 너무 깁니다." }, { status: 400 });
    }
    if (email.length > MEDIUM_FIELD_MAX || phone.length > MEDIUM_FIELD_MAX || website.length > MEDIUM_FIELD_MAX) {
      return NextResponse.json({ success: false, error: "입력하신 내용이 너무 깁니다." }, { status: 400 });
    }
    if (description.length > DESCRIPTION_MAX) {
      return NextResponse.json({ success: false, error: "단체 소개가 너무 깁니다." }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    let resumeFilePath: string | null = null;
    let resumeFileName: string | null = null;

    if (file) {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        return NextResponse.json({ success: false, error: "PDF 파일만 업로드할 수 있습니다." }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, error: "파일 크기는 20MB를 초과할 수 없습니다." }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      // Storage path is UUID-only — the user's original filename is never used
      // in the path, only kept for display in resume_file_name below.
      const filePath = `applications/${randomUUID()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, buffer, { contentType: "application/pdf", upsert: false });

      if (uploadError) {
        devError("[POST /api/organizations/apply] Storage upload error:", uploadError);
        return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 500 });
      }

      uploadedPath = filePath;
      resumeFilePath = filePath;
      resumeFileName = file.name.slice(0, 255);
    }

    const { error: insertError } = await supabase.from("organization_applications" as any).insert({
      org_name: orgName,
      contact_name: contactName,
      email,
      phone,
      instagram,
      website: website || null,
      description: description || null,
      resume_file_path: resumeFilePath,
      resume_file_name: resumeFileName,
    } as any);

    if (insertError) {
      devError("[POST /api/organizations/apply] Insert error:", insertError);
      if (uploadedPath) {
        const { error: removeError } = await supabase.storage.from(BUCKET).remove([uploadedPath]);
        if (removeError) devError("[POST /api/organizations/apply] Cleanup remove error:", removeError);
      }
      return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    devError("[POST /api/organizations/apply] Catch error:", err);
    return NextResponse.json({ success: false, error: GENERIC_ERROR }, { status: 500 });
  }
}
