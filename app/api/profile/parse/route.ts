import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { parseProfileTextWithAI } from "@/lib/profileParser";
import { extractTextFromBuffer, FileExtractionError } from "@/lib/fileTextExtraction";

export const dynamic = "force-dynamic";
// pdf-parse (pdfjs-dist) and mammoth use Node.js-only APIs (Buffer, fs) and
// must not run on the Edge runtime.
export const runtime = "nodejs";

// Basic in-memory rate limiting map (userId -> lastRequestTimestamp)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_COOLDOWN_MS = 3000; // 3 seconds

export async function POST(request: Request) {
  // 1. Session verification
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: "로그인이 필요합니다." }, { status: 401 });
  }

  // 2. Simple Rate Limiting check
  const now = Date.now();
  const lastRequest = rateLimitMap.get(user.id);
  if (lastRequest && now - lastRequest < RATE_LIMIT_COOLDOWN_MS) {
    return NextResponse.json(
      { success: false, error: "요청이 너무 빠릅니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 }
    );
  }
  rateLimitMap.set(user.id, now);

  try {
    const contentType = request.headers.get("content-type") || "";
    let textToParse = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: "업로드된 파일이 없습니다." }, { status: 400 });
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "파일 크기는 최대 10MB까지만 허용됩니다." },
          { status: 400 }
        );
      }

      if (file.size === 0) {
        return NextResponse.json({ success: false, error: "빈 파일은 업로드할 수 없습니다." }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      try {
        textToParse = await extractTextFromBuffer(buffer, file.name, file.type);
      } catch (extractErr: any) {
        console.error("[Profile Parser API] File text extraction failed:", {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          message: extractErr?.message,
          stack: extractErr?.stack,
        });
        if (extractErr instanceof FileExtractionError && extractErr.code === "UNSUPPORTED_FILE_TYPE") {
          return NextResponse.json(
            { success: false, error: extractErr.message, code: "UNSUPPORTED_FILE_TYPE" },
            { status: 400 }
          );
        }
        return NextResponse.json(
          {
            success: false,
            error: "파일에서 텍스트를 추출하지 못했습니다. 파일이 손상되었거나 지원하지 않는 형식일 수 있습니다. 다른 파일을 사용하거나 텍스트를 직접 붙여넣어 주세요.",
            code: "FILE_EXTRACTION_FAILED",
          },
          { status: 422 }
        );
      }
    } else {
      // Direct JSON text payload
      const body = await request.json();
      textToParse = body.text || "";
    }

    // 3. String content checks
    if (!textToParse.trim()) {
      return NextResponse.json(
        { success: false, error: "내용을 자동으로 정리하지 못했어요. 다른 파일을 사용하거나 텍스트를 직접 붙여넣어 주세요." },
        { status: 400 }
      );
    }

    // Limit maximum text length to prevent tokens blowing up (max 50,000 characters)
    if (textToParse.length > 50000) {
      return NextResponse.json(
        { success: false, error: "텍스트 분량이 너무 많습니다. 50,000자 이하의 문서만 파싱 가능합니다." },
        { status: 400 }
      );
    }

    // 4. Parse using OpenAI (utilizes strictly server-side process.env.OPENAI_API_KEY)
    const profileData = await parseProfileTextWithAI(textToParse);
    return NextResponse.json({ success: true, data: profileData });

  } catch (err: any) {
    console.error("[Profile Parser API Error]:", { message: err?.message, stack: err?.stack });
    return NextResponse.json(
      {
        success: false,
        error: "내용을 자동으로 정리하지 못했어요. 다른 파일을 사용하거나 텍스트를 직접 붙여넣어 주세요.",
        code: "AI_PARSE_FAILED",
      },
      { status: 500 }
    );
  }
}
