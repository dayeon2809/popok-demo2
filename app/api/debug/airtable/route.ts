import { NextRequest, NextResponse } from "next/server";
import Airtable from "airtable";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const hasApiKey = !!process.env.AIRTABLE_API_KEY;
  const hasBaseId = !!process.env.AIRTABLE_BASE_ID;

  const tables: Record<string, string> = {
    Artists: "unknown",
    Works: "unknown",
    Submissions: "unknown",
  };

  if (hasApiKey && hasBaseId) {
    const api_key = process.env.AIRTABLE_API_KEY!;
    const base_id = process.env.AIRTABLE_BASE_ID!;
    const base = new Airtable({ apiKey: api_key }).base(base_id);

    const artistTable = process.env.AIRTABLE_ARTISTS_TABLE || "Artists";
    const worksTable = process.env.AIRTABLE_WORKS_TABLE || "Works";
    const submissionsTable = process.env.AIRTABLE_SUBMISSIONS_TABLE || "Submissions";

    // Artists 테이블 체크
    try {
      await base(artistTable).select({ maxRecords: 1 }).firstPage();
      tables.Artists = "ok";
    } catch (err: any) {
      console.error(`[debug/airtable] Artists 테이블 조회 실패:`, err);
      if (err.statusCode === 403 || err.error === 'NOT_AUTHORIZED') {
        tables.Artists = "not authorized or not found";
      } else {
        tables.Artists = err.message || String(err);
      }
    }

    // Works 테이블 체크
    try {
      await base(worksTable).select({ maxRecords: 1 }).firstPage();
      tables.Works = "ok";
    } catch (err: any) {
      console.error(`[debug/airtable] Works 테이블 조회 실패:`, err);
      if (err.statusCode === 403 || err.error === 'NOT_AUTHORIZED') {
        tables.Works = "not authorized or not found";
      } else {
        tables.Works = err.message || String(err);
      }
    }

    // Submissions 테이블 체크 (테이블 존재 및 권한 체크)
    try {
      await base(submissionsTable).select({ maxRecords: 1 }).firstPage();
      tables.Submissions = "ok";
    } catch (err: any) {
      console.error(`[debug/airtable] Submissions 테이블 조회 실패:`, err);
      if (err.statusCode === 403 || err.error === 'NOT_AUTHORIZED') {
        tables.Submissions = "not authorized or not found";
      } else {
        tables.Submissions = err.message || String(err);
      }
    }
  }

  return NextResponse.json({
    hasApiKey,
    hasBaseId,
    tables,
  });
}
