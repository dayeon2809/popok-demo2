import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const pathPrefix = (formData.get("path") as string || "submissions").trim().replace(/^\/+|\/+$/g, "");
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

    // Create a unique filename
    const fileExt = file.name.split(".").pop() || "jpg";
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    const filePath = pathPrefix ? `${pathPrefix}/${cleanFileName}` : cleanFileName;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("[Upload] Supabase Storage upload error:", error);
      return NextResponse.json(
        { success: false, error: `스토리지 업로드 실패: ${error.message}` },
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
    console.error("[POST /api/upload] Error:", err);
    return NextResponse.json(
      { success: false, error: "서버 업로드 처리 중 오류가 발생했습니다.", detail: String(err) },
      { status: 500 }
    );
  }
}
