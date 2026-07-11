import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { isSupportedMotionVideoUrl } from "@/lib/videoLinks";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch (parseErr) {
      return NextResponse.json(
        { success: false, error: "요청 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const name = (body.name || "").trim();
    const genre = (body.genre || "").trim();
    const instagram = (body.instagram || "").trim();
    const email = (body.email || "").trim();
    const profileImageUrls = Array.isArray(body.profileImageUrls) ? body.profileImageUrls : [];
    const profileImageUrl = profileImageUrls[0] || (body.profileImageUrl || "").trim();
    const motionVideoUrl = (body.motionVideoUrl || "").trim();
    const additionalRequests = (body.additionalRequests || body.additional_requests || "").trim();
    const youtubePreviewStart = typeof body.youtubePreviewStart === "number" ? body.youtubePreviewStart : 0;
    const youtubePreviewEnd = typeof body.youtubePreviewEnd === "number" ? body.youtubePreviewEnd : 15;

    if (!name || !genre || !instagram || !email) {
      return NextResponse.json(
        { success: false, error: "이름, 장르, 인스타그램 링크, 이메일은 모두 필수 항목입니다." },
        { status: 400 }
      );
    }

    if (motionVideoUrl && !isSupportedMotionVideoUrl(motionVideoUrl)) {
      return NextResponse.json(
        { success: false, error: "Motion Profile Video는 YouTube 또는 Vimeo 링크만 입력할 수 있습니다." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    
    // Insert into 'submissions' table
    const { data, error } = await (supabase.from("submissions" as any) as any)
      .insert({
        name: name,
        genre: genre,
        instagram: instagram,
        email: email,
        status: "pending", // Pending approval / review
        additional_requests: additionalRequests || null,
        profile_image_url: profileImageUrl || null,
        profile_image_urls: profileImageUrls,
        youtube_url: motionVideoUrl || null,
        youtube_preview_start: youtubePreviewStart,
        youtube_preview_end: youtubePreviewEnd,
        works: profileImageUrl || motionVideoUrl ? [
          {
            kind: "popok_registration_media",
            profile_image_url: profileImageUrl || null,
            motion_video_url: motionVideoUrl || null,
            motion_video_provider: motionVideoUrl.includes("vimeo.com") ? "vimeo" : motionVideoUrl ? "youtube" : null,
          },
        ] : null,
      } as any)
      .select("id")
      .single();

    if (error) {
      console.error("[POST /api/popok-submit] Supabase error:", error);
      return NextResponse.json(
        { success: false, error: "데이터 저장 중 오류가 발생했습니다.", detail: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "등록된 ID를 가져오지 못했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err: any) {
    console.error("[POST /api/popok-submit] Internal error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
