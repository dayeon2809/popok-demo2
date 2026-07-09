import { NextRequest, NextResponse } from "next/server";
import { syncArtistsFromAirtable } from "@/lib/syncArtists";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

export async function POST(req: NextRequest) {
  if (process.env.VERCEL === "1") {
    return NextResponse.json(
      {
        success: false,
        error: "Vercel Production 환경(서버리스 런타임)에서는 파일시스템이 읽기 전용이므로 파일 동기화(JSON 캐시 갱신)를 수행할 수 없습니다. 데이터 동기화는 로컬 개발 환경에서 완료한 뒤 다시 배포해주시기 바랍니다."
      },
      { status: 400 }
    );
  }

  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") || "all";

  try {
    let artistResult = { success: false, totalRecords: 0, savedArtists: 0, lastSync: "" };
    let syncError: string | null = null;

    // 1. Sync Artists
    if (type === "all" || type === "artists") {
      try {
        artistResult = await syncArtistsFromAirtable();
      } catch (artistErr: any) {
        console.error("Artist sync error:", artistErr.message || artistErr);
        syncError = artistErr.message || "아티스트 동기화 실패";
        if (type === "artists") {
          return NextResponse.json({ success: false, error: syncError }, { status: 500 });
        }
      }
    }

    // If "all" was requested and both failed, return error
    if (type === "all" && !artistResult.success) {
      return NextResponse.json({ success: false, error: syncError || "동기화 실패" }, { status: 500 });
    }

    const lastSync = new Date().toISOString();
    
    // Save combined sync metadata to sync-meta.json
    const metaPath = path.join(process.cwd(), 'data/sync-meta.json');
    let currentMeta: any = {};
    if (fs.existsSync(metaPath)) {
      try {
        currentMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      } catch (e) {}
    }

    const savedArtists = artistResult.success ? artistResult.savedArtists : (currentMeta.savedArtists || 0);
    const totalRecords = artistResult.success ? artistResult.totalRecords : 0;

    fs.writeFileSync(metaPath, JSON.stringify({
      lastSync,
      savedArtists,
      totalRecords
    }, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      totalRecords,
      savedArtists,
      lastSync
    });
  } catch (err: any) {
    console.error("[POST /api/admin/sync]", err);
    return NextResponse.json(
      { success: false, error: err.message || "동기화 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

