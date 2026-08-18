import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServer, createServerSupabaseClient } from "@/lib/supabaseServer";
import { detectResumeFileExtension, mimeTypeForExtension } from "@/lib/resumeFileTypes";
import { isAdminAuthenticated } from "@/lib/admin";
import { checkRateLimit } from "@/lib/simpleRateLimit";
import {
  decideImageUpload,
  ORG_RESUME_BUCKET,
  RESUME_MAX_FILE_SIZE,
} from "@/lib/uploadPolicy";

export const dynamic = "force-dynamic";

const UPLOAD_FAILURE_MESSAGE = "이미지 업로드에 실패했어요. 다시 시도해주세요.";
const RESUME_UPLOAD_FAILURE_MESSAGE = "파일 업로드에 실패했어요. 다시 시도해주세요.";
// Organization application resumes go to their own private bucket (never
// the public "artist-media" bucket logos use) so a public URL is never
// generated for them — only the storage path, which is later read back via
// a short-lived signed URL in /api/admin/organization-applications/[id]/resume.
// The bucket name and the size cap now live in lib/uploadPolicy.ts alongside
// the image rules, so there is one place that says what this route accepts.
const ORG_RESUME_PATH_PREFIX = "organizations/resumes";

// This endpoint writes with the service role key, so nothing downstream
// limits how often it can be called. Without a ceiling a single client can
// fill the bucket — that is storage cost and egress, not just clutter.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_UPLOADS = 60;

function getClientKey(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `upload:${ip}`;
}

/**
 * 관리자 세션이거나 로그인한 사용자면 true.
 *
 * 관리자 화면은 Supabase 로그인 없이 별도 비밀번호 세션으로 들어오므로 둘 다 본다.
 */
async function isAuthenticatedRequest(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) return true;
  } catch {
    // 세션이 없거나 쿠키를 읽지 못한 경우 — 관리자 세션을 마저 확인한다.
  }
  return isAdminAuthenticated();
}

function devError(label: string, err: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(label, err);
  }
}

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(getClientKey(req), {
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_UPLOADS,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "업로드 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) } }
    );
  }

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

    // 버킷·경로·용량·형식·로그인 여부를 한 번에 판단한다. 규칙은 lib/uploadPolicy.ts.
    // 확장자와 Content-Type 은 브라우저가 신고한 값이 아니라 파일 앞머리에서 정해진다.
    const decision = decideImageUpload({
      bucket,
      path: rawPathPrefix,
      declaredMime: file.type || "",
      size: file.size,
      head: new Uint8Array(bytes.slice(0, 16)),
      isAuthenticated: await isAuthenticatedRequest(),
    });

    if (!decision.ok) {
      return NextResponse.json({ success: false, error: decision.error }, { status: decision.status });
    }

    const supabase = getSupabaseServer();

    // 파일명은 사용자가 올린 원본 파일명을 절대 사용하지 않고 랜덤 UUID로 대체한다.
    const safeFileName = `${randomUUID()}.${decision.extension}`;
    const filePath = `${decision.pathPrefix}/${safeFileName}`;

    const { error } = await supabase.storage
      .from(decision.bucket)
      .upload(filePath, buffer, {
        contentType: decision.contentType,
        cacheControl: "31536000",
        upsert: false,
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
      .from(decision.bucket)
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
