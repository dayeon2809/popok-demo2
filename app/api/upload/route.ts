import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { detectResumeFileExtension, mimeTypeForExtension } from "@/lib/resumeFileTypes";

export const dynamic = "force-dynamic";

const UPLOAD_FAILURE_MESSAGE = "이미지 업로드에 실패했어요. 다시 시도해주세요.";
const RESUME_UPLOAD_FAILURE_MESSAGE = "파일 업로드에 실패했어요. 다시 시도해주세요.";
const RESUME_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB — matches organizations/apply's resume limit

// Organization application resumes go to their own private bucket (never
// the public "artist-media" bucket logos use) so a public URL is never
// generated for them — only the storage path, which is later read back via
// a short-lived signed URL in /api/admin/organization-applications/[id]/resume.
const ORG_RESUME_BUCKET = "org-applications";
const ORG_RESUME_PATH_PREFIX = "organizations/resumes";

function devError(label: string, err: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(label, err);
  }
}

// Storage object key에는 영문 소문자 / 숫자 / 하이픈 / 언더스코어 / 슬래시만 남기고,
// 사용자가 입력한 이름 등 원본 문자열이 섞여 들어와도 항상 안전한 경로만 생성되도록 한다.
function sanitizeStoragePath(input: string): string {
  return input
    .toLowerCase()
    .split("/")
    .map((segment) =>
      segment
        .replace(/[^a-z0-9\-_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
    )
    .filter(Boolean)
    .join("/");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const uploadType = ((formData.get("type") as string) || "").trim();

    if (!file) {
      return NextResponse.json(
        { success: false, error: "업로드할 파일이 전송되지 않았습니다." },
        { status: 400 }
      );
    }

    if (uploadType === "organization-resume") {
      return uploadOrganizationResume(file);
    }

    const rawPathPrefix = (formData.get("path") as string) || "submissions";
    const bucket = (formData.get("bucket") as string || "artist-media").trim();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const supabase = getSupabaseServer();

    // 파일명은 사용자가 올린 원본 파일명을 절대 사용하지 않고 랜덤 UUID로 대체한다.
    const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const safeFileName = `${randomUUID()}.${fileExt}`;

    const pathPrefix = sanitizeStoragePath(rawPathPrefix) || "submissions";
    const filePath = `${pathPrefix}/${safeFileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      devError("[Upload] Supabase Storage upload error:", error);
      return NextResponse.json(
        { success: false, error: UPLOAD_FAILURE_MESSAGE },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (err: any) {
    devError("[POST /api/upload] Error:", err);
    return NextResponse.json(
      { success: false, error: UPLOAD_FAILURE_MESSAGE },
      { status: 500 }
    );
  }
}

// Uploads an organization application resume (PDF/DOCX/TXT) to the private
// org-applications bucket and returns storage metadata only — no file bytes
// are ever sent back to, or through, /api/organizations/apply.
async function uploadOrganizationResume(file: File) {
  const ext = detectResumeFileExtension(file.name, file.type);
  if (!ext) {
    return NextResponse.json(
      { success: false, error: "PDF, DOCX, TXT 파일만 업로드할 수 있습니다." },
      { status: 400 }
    );
  }
  if (file.size > RESUME_MAX_FILE_SIZE) {
    return NextResponse.json(
      { success: false, error: "파일 크기는 20MB를 초과할 수 없습니다." },
      { status: 413 }
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const supabase = getSupabaseServer();

    // Storage path is UUID-only — the user's original filename is never
    // used in the path, only returned separately for display purposes.
    const filePath = `${ORG_RESUME_PATH_PREFIX}/${randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from(ORG_RESUME_BUCKET)
      .upload(filePath, buffer, { contentType: mimeTypeForExtension(ext), upsert: false });

    if (error) {
      devError("[Upload] Organization resume Storage upload error:", error);
      return NextResponse.json(
        { success: false, error: RESUME_UPLOAD_FAILURE_MESSAGE },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      path: filePath,
      fileName: file.name.slice(0, 255),
      fileSize: file.size,
    });
  } catch (err: any) {
    devError("[POST /api/upload] Organization resume error:", err);
    return NextResponse.json(
      { success: false, error: RESUME_UPLOAD_FAILURE_MESSAGE },
      { status: 500 }
    );
  }
}
