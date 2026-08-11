// Single source of truth for "is this a PDF/DOCX/TXT resume file", shared by
// client-side file-picker validation (app/organizations/apply,
// app/admin/companies/[id]) AND server-side upload validation
// (app/api/organizations/apply, app/api/admin/companies/[id]/source-file)
// AND lib/fileTextExtraction.ts's extraction routing — one detection rule
// used everywhere instead of three drifting copies of it.
//
// Deliberately has zero Node-only imports (no fs/Buffer/dynamic requires) so
// it's safe to import from "use client" components without pulling
// pdf-parse/mammoth into the browser bundle.

export type ResumeFileExtension = "pdf" | "docx" | "txt";

export const RESUME_FILE_ACCEPT = ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

export const RESUME_FILE_TYPE_LABEL = "PDF, DOCX, TXT";

const MIME_BY_EXTENSION: Record<ResumeFileExtension, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

/**
 * Detects a PDF/DOCX/TXT file from its name and (optional) MIME type.
 * Extension is checked first and is sufficient on its own — browsers and
 * operating systems frequently hand over an empty MIME type or the generic
 * "application/octet-stream" for these formats, so requiring a MIME match
 * would wrongly reject legitimate files. MIME is only consulted as a
 * fallback when the extension itself isn't one of the three recognized
 * ones. Returns null for anything else (including empty/octet-stream MIME
 * with no matching extension).
 */
export function detectResumeFileExtension(fileName: string, mimeType?: string | null): ResumeFileExtension | null {
  const lowerName = (fileName || "").toLowerCase();
  const type = (mimeType || "").toLowerCase();

  if (lowerName.endsWith(".pdf")) return "pdf";
  if (lowerName.endsWith(".docx")) return "docx";
  if (lowerName.endsWith(".txt")) return "txt";

  if (type === "application/pdf") return "pdf";
  if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  // Broader than an exact "text/plain" match on purpose — matches
  // lib/fileTextExtraction.ts's pre-existing isTxt behavior so this refactor
  // doesn't narrow what already worked.
  if (type === "text/plain" || type.startsWith("text/")) return "txt";

  return null;
}

export function mimeTypeForExtension(ext: ResumeFileExtension): string {
  return MIME_BY_EXTENSION[ext];
}
