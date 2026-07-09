import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const UPLOAD_FAILURE_MESSAGE = "이미지 업로드에 실패했어요. 다시 시도해주세요.";

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
    const rawPathPrefix = (formData.get("path") as string) || "submissions";
    const bucket = (formData.get("bucket") as string || "artist-media").trim();

    if (!file) {
      return NextResponse.json(
        { success: false, error: "업로드할 파일이 전송되지 않았습니다." },
        { status: 400 }
      );
    }

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
