import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TODO: rate limit this public endpoint if abuse is observed (no rate-limit infra in this project yet)

// The resume file itself is uploaded separately through POST /api/upload
// (type=organization-resume) before this route is ever called — this route
// only ever receives the resulting storage metadata below, never the file
// binary. That keeps this request body small regardless of resume size,
// avoiding Next.js's ~10MB FormData parsing limit that a 20MB resume
// attached directly here used to hit ("Request body exceeded 10MB").
const BUCKET = "org-applications";
// Must match the path /api/upload's organization-resume handler writes to.
const RESUME_FILE_PATH_PATTERN = /^organizations\/resumes\/[0-9a-f-]{36}\.(pdf|docx|txt)$/;
const RESUME_FILE_SIZE_MAX = 20 * 1024 * 1024; // 20MB — matches /api/upload's resume limit
const GENERIC_ERROR = "신청 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SHORT_FIELD_MAX = 200; // org_name / contact_name / instagram
const MEDIUM_FIELD_MAX = 300; // email / phone
const LOGO_URL_MAX = 2000;
const PORTFOLIO_TEXT_MAX = 30000;
const RESUME_FILE_NAME_MAX = 255;

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
    const portfolioText = getString(formData, "portfolio_text");
    const logoUrl = getString(formData, "logo_url");
    const resumeFilePathRaw = getString(formData, "resume_file_path");
    const resumeFileNameRaw = getString(formData, "resume_file_name");
    const resumeFileSizeRaw = getString(formData, "resume_file_size");

    if (!orgName || !contactName || !email || !phone || !instagram) {
      return NextResponse.json({ success: false, error: "필수 항목을 모두 입력해 주세요." }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ success: false, error: "올바른 이메일 주소를 입력해 주세요." }, { status: 400 });
    }
    if (orgName.length > SHORT_FIELD_MAX || contactName.length > SHORT_FIELD_MAX || instagram.length > SHORT_FIELD_MAX) {
      return NextResponse.json({ success: false, error: "입력하신 내용이 너무 깁니다." }, { status: 400 });
    }
    if (email.length > MEDIUM_FIELD_MAX || phone.length > MEDIUM_FIELD_MAX) {
      return NextResponse.json({ success: false, error: "입력하신 내용이 너무 깁니다." }, { status: 400 });
    }
    if (logoUrl.length > LOGO_URL_MAX) {
      return NextResponse.json({ success: false, error: "로고 이미지 업로드에 실패했습니다. 다시 시도해주세요." }, { status: 400 });
    }
    if (portfolioText.length > PORTFOLIO_TEXT_MAX) {
      return NextResponse.json({ success: false, error: "이력 및 활동 내용은 30,000자 이하로 입력해주세요." }, { status: 400 });
    }

    // The resume was already uploaded via /api/upload — this route only
    // accepts the storage path it returned (never arbitrary paths), so an
    // applicant can't point this at another applicant's file in the bucket.
    let resumeFilePath: string | null = null;
    let resumeFileName: string | null = null;
    let resumeFileSize: number | null = null;

    if (resumeFilePathRaw) {
      if (!RESUME_FILE_PATH_PATTERN.test(resumeFilePathRaw)) {
        return NextResponse.json({ success: false, error: "첨부된 파일 정보가 올바르지 않습니다. 파일을 다시 업로드해 주세요." }, { status: 400 });
      }
      const parsedSize = Number(resumeFileSizeRaw);
      if (!Number.isInteger(parsedSize) || parsedSize <= 0 || parsedSize > RESUME_FILE_SIZE_MAX) {
        return NextResponse.json({ success: false, error: "첨부된 파일 정보가 올바르지 않습니다. 파일을 다시 업로드해 주세요." }, { status: 400 });
      }

      resumeFilePath = resumeFilePathRaw;
      resumeFileName = (resumeFileNameRaw || resumeFilePathRaw).slice(0, RESUME_FILE_NAME_MAX);
      resumeFileSize = parsedSize;
    }

    const supabase = getSupabaseServer();

    const { error: insertError } = await supabase.from("organization_applications" as any).insert({
      org_name: orgName,
      contact_name: contactName,
      email,
      phone,
      instagram,
      logo_url: logoUrl || null,
      portfolio_text: portfolioText || null,
      resume_file_path: resumeFilePath,
      resume_file_name: resumeFileName,
      resume_file_size: resumeFileSize,
    } as any);

    if (insertError) {
      devError("[POST /api/organizations/apply] Insert error:", insertError);
      if (resumeFilePath) {
        const { error: removeError } = await supabase.storage.from(BUCKET).remove([resumeFilePath]);
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
