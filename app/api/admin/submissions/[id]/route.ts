import { NextRequest, NextResponse } from "next/server";
import { updateSubmissionStatus, updateSubmission, createArtistFromSubmission } from "@/lib/supabaseSubmissions";

export const dynamic = "force-dynamic";

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

  try {
    const body = await req.json();
    const action = body?.action; // "approve" | "reject" | "update"

    if (action === "approve") {
      const artistData = body?.artistData;
      if (!artistData || !artistData.name) {
        return NextResponse.json({ success: false, error: "승인할 아티스트 정보가 부족합니다." }, { status: 400 });
      }

      // Parse works array if it was passed as string or raw
      let parsedWorks: string[] = [];
      if (Array.isArray(artistData.works)) {
        parsedWorks = artistData.works;
      } else if (typeof artistData.works === "string") {
        parsedWorks = artistData.works.split(",").map((w: string) => w.trim()).filter(Boolean);
      }

      // 1. Create artist record in artists2
      const artistResult = await createArtistFromSubmission({
        name: artistData.name,
        company: artistData.company,
        works: parsedWorks,
        field: artistData.field,
        genre: artistData.genre,
        instagram: artistData.instagram,
        website: artistData.website,
        email: artistData.email,
        name_en: artistData.name_en,
        city_or_region: artistData.city_or_region,
        bio_short: artistData.bio_short,
        portfolio_works: artistData.portfolio_works,
      });

      // 2. Set submission status to approved
      await updateSubmissionStatus(id, "approved");


      return NextResponse.json({ success: true, artistId: artistResult.id });
    } 
    
    else if (action === "reject") {
      await updateSubmissionStatus(id, "rejected");
      return NextResponse.json({ success: true });
    } 
    
    else if (action === "update") {
      const fields = body?.fields;
      if (!fields) {
        return NextResponse.json({ success: false, error: "수정할 데이터가 존재하지 않습니다." }, { status: 400 });
      }

      await updateSubmission(id, fields);
      return NextResponse.json({ success: true });
    } 
    
    else {
      return NextResponse.json({ success: false, error: "올바르지 않은 작업 액션입니다." }, { status: 400 });
    }
  } catch (err: any) {
    console.error(`[POST /api/admin/submissions/${id}]`, err);
    return NextResponse.json({ success: false, error: "작업 처리 중 오류가 발생했습니다.", detail: String(err) }, { status: 500 });
  }
}
