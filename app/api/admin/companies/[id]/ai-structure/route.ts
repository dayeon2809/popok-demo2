import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import {
  getOrganizationApplicationByCompanyId,
  downloadResumeBuffer,
  downloadCompanySourceFileBuffer,
} from "@/lib/companies";
import { structureCompanyDataWithAI, type CompanySourceMaterial } from "@/lib/companyAiDraft";
import { extractTextFromBuffer } from "@/lib/fileTextExtraction";

export const dynamic = "force-dynamic";
// pdf-parse/mammoth (via extractTextFromBuffer) require Node-only APIs.
export const runtime = "nodejs";

const MIN_RESUME_TEXT_LENGTH = 30;

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServer();

  // CAS lock: only a request that actually flips the status away from
  // 'processing' wins — a second concurrent/duplicate click sees 0 rows
  // updated and bails out with 409 instead of racing the first request.
  const { data: locked, error: lockError } = await (supabase.from("companies" as any) as any)
    .update({ ai_draft_status: "processing" })
    .eq("id", id)
    .neq("ai_draft_status", "processing")
    .select("*")
    .maybeSingle();

  if (lockError) {
    console.error(`[POST /api/admin/companies/${id}/ai-structure] lock error:`, lockError);
    return NextResponse.json({ success: false, error: "단체 정보를 확인하지 못했습니다." }, { status: 500 });
  }
  if (!locked) {
    return NextResponse.json({ success: false, error: "이미 처리 중입니다." }, { status: 409 });
  }

  const company = locked as any;

  const failRun = async (message: string, detail?: unknown) => {
    console.error(`[POST /api/admin/companies/${id}/ai-structure] failed:`, detail ?? message);
    // Deliberately does NOT include ai_draft in this UPDATE — a failed
    // re-run must never clear or blank out a previously successful draft.
    await (supabase.from("companies" as any) as any)
      .update({ ai_draft_status: "failed", ai_draft_error: message })
      .eq("id", id);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  };

  try {
    const application = await getOrganizationApplicationByCompanyId(id);

    // [최초 첨부 이력서] — the applicant's original upload.
    const applicationResume: CompanySourceMaterial = { text: "", insufficient: false };
    if (application?.resume_file_path) {
      let buffer: Buffer;
      try {
        buffer = await downloadResumeBuffer(application.resume_file_path);
      } catch (err) {
        // Per policy: a resume that's on record but unreadable is a hard
        // failure of the whole run — not the same as "no resume attached".
        return await failRun("이력서 파일을 불러오지 못했습니다.", err);
      }

      try {
        applicationResume.text = await extractTextFromBuffer(buffer, application.resume_file_name || "resume.pdf");
      } catch (err) {
        // Extraction (as opposed to download) failing is treated as "no
        // usable text" — soft continue, not a hard failure.
        console.error(`[POST /api/admin/companies/${id}/ai-structure] resume extraction error:`, err);
        applicationResume.text = "";
      }

      if (applicationResume.text.trim().length < MIN_RESUME_TEXT_LENGTH) {
        applicationResume.insufficient = true;
      }
    }

    // [관리자 최신 첨부 파일] — same download/extract policy as the
    // applicant's resume above: a file on record but unreadable is a hard
    // failure, extraction failure is a soft "insufficient text" continue.
    const adminSourceFile: CompanySourceMaterial = { text: "", insufficient: false };
    if (company.source_file_path) {
      let buffer: Buffer;
      try {
        buffer = await downloadCompanySourceFileBuffer(company.source_file_path);
      } catch (err) {
        return await failRun("관리자 첨부 파일을 불러오지 못했습니다.", err);
      }

      try {
        adminSourceFile.text = await extractTextFromBuffer(buffer, company.source_file_name || "source.pdf");
      } catch (err) {
        console.error(`[POST /api/admin/companies/${id}/ai-structure] admin file extraction error:`, err);
        adminSourceFile.text = "";
      }

      if (adminSourceFile.text.trim().length < MIN_RESUME_TEXT_LENGTH) {
        adminSourceFile.insufficient = true;
      }
    }

    // Two uploads with identical extracted text (e.g. the admin re-uploaded
    // the same document) — read once, not twice.
    const adminFileDuplicatesApplicationResume =
      !!applicationResume.text.trim() &&
      !!adminSourceFile.text.trim() &&
      applicationResume.text.trim() === adminSourceFile.text.trim();

    const adminSourceText: string = typeof company.source_text === "string" ? company.source_text : "";

    // Snapshot of what actually went into THIS run — lets the admin UI show
    // "마지막 분석에 사용한 자료 정보" even after source_text/files change later.
    const { draft, sourceSummary } = await structureCompanyDataWithAI({
      application,
      existingCompany: {
        name: company.name,
        name_en: company.name_en,
        genre: company.genre,
        category: company.category,
        city_or_region: company.city_or_region,
        bio_short: company.bio_short,
        bio: company.bio,
        current_activity: Array.isArray(company.current_activity) ? company.current_activity : [],
        works: Array.isArray(company.works) ? company.works : [],
        awards: Array.isArray(company.awards) ? company.awards : [],
        links: Array.isArray(company.links) ? company.links : [],
      },
      applicationResume,
      adminSourceText,
      adminSourceFile,
      adminSourceFileMeta: {
        filePath: company.source_file_path || null,
        fileName: company.source_file_name || null,
        fileSize: typeof company.source_file_size === "number" ? company.source_file_size : null,
        uploadedAt: company.source_file_uploaded_at || null,
      },
      adminFileDuplicatesApplicationResume,
    });

    const { error: saveError } = await (supabase.from("companies" as any) as any)
      .update({
        ai_draft: draft,
        ai_draft_status: "ready",
        ai_draft_generated_at: new Date().toISOString(),
        ai_draft_error: null,
        ai_draft_source_summary: sourceSummary,
      })
      .eq("id", id);

    if (saveError) {
      return await failRun("AI 초안 저장에 실패했습니다.", saveError);
    }

    return NextResponse.json({ success: true, data: draft });
  } catch (err: any) {
    return await failRun("AI 구조화 중 오류가 발생했습니다.", err);
  }
}
