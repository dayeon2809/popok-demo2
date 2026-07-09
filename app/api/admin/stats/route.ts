import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSubmissions } from "@/lib/supabaseSubmissions";


export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  try {
    // 1. Get submissions statistics
    const submissions = await getSubmissions();
    const totalSubmissions = submissions.length;

    // 2. Get published artists count
    let publishedArtists = 0;
    try {
      const artistsPath = path.join(process.cwd(), "data/artists.json");
      if (fs.existsSync(artistsPath)) {
        const fileContent = fs.readFileSync(artistsPath, "utf8");
        const artists = JSON.parse(fileContent);
        publishedArtists = artists.filter((a: any) => !a.status || a.status === "published").length;
      }
    } catch (err) {
      console.warn("Failed to read artists.json for statistics", err);
    }

    // 3. Get last sync metadata
    let lastSync = null;
    try {
      const metaPath = path.join(process.cwd(), "data/sync-meta.json");
      if (fs.existsSync(metaPath)) {
        const fileContent = fs.readFileSync(metaPath, "utf8");
        const meta = JSON.parse(fileContent);
        lastSync = meta.lastSync || null;
      }
    } catch (err) {
      console.warn("Failed to read sync-meta.json", err);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalSubmissions,
        publishedArtists,
        lastSync
      }
    });
  } catch (err: any) {
    console.error("[GET /api/admin/stats]", err);
    return NextResponse.json(
      { success: false, error: "통계 정보를 가져오는 중 오류가 발생했습니다.", detail: String(err) },
      { status: 500 }
    );
  }
}
