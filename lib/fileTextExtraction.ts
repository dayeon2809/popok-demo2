// Shared PDF/DOCX/TXT -> plain text extraction, used by both the personal
// resume importer (app/api/profile/parse/route.ts) and the admin company
// AI-structuring route (app/api/admin/companies/[id]/ai-structure). Callers
// running this must use the Node.js runtime — pdf-parse and mammoth rely on
// Node-only APIs (Buffer, fs) and don't work on the Edge runtime.

import { detectResumeFileExtension } from "./resumeFileTypes";

export class FileExtractionError extends Error {
  code: "UNSUPPORTED_FILE_TYPE" | "FILE_EXTRACTION_FAILED";
  constructor(code: "UNSUPPORTED_FILE_TYPE" | "FILE_EXTRACTION_FAILED", message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Extracts plain text from a PDF, DOCX, or TXT file buffer. Throws
 * FileExtractionError with `.code` set to either "UNSUPPORTED_FILE_TYPE"
 * (unrecognized extension/mime type) or "FILE_EXTRACTION_FAILED" (recognized
 * type but parsing itself threw, e.g. a corrupted PDF).
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<string> {
  const ext = detectResumeFileExtension(fileName, mimeType);

  if (!ext) {
    throw new FileExtractionError(
      "UNSUPPORTED_FILE_TYPE",
      "지원하지 않는 파일 형식입니다. (PDF, DOCX, TXT만 지원)"
    );
  }

  try {
    if (ext === "pdf") {
      // pdf-parse v2 dropped the old `pdf(buffer)` function export in favor
      // of a `PDFParse` class (require("pdf-parse") no longer returns a
      // callable function). pageJoiner is set to "" so page-boundary
      // markers aren't injected into the extracted text.
      const { PDFParse } = require("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText({ pageJoiner: "" });
        return result.text || "";
      } finally {
        await parser.destroy();
      }
    }

    if (ext === "docx") {
      const mammoth = require("mammoth");
      const parsedDocx = await mammoth.extractRawText({ buffer });
      return parsedDocx.value || "";
    }

    // ext === "txt"
    return buffer.toString("utf8");
  } catch (err: any) {
    if (err instanceof FileExtractionError) throw err;
    throw new FileExtractionError(
      "FILE_EXTRACTION_FAILED",
      "파일에서 텍스트를 추출하지 못했습니다. 파일이 손상되었거나 지원하지 않는 형식일 수 있습니다."
    );
  }
}
