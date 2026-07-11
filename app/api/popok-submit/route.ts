import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { isSupportedMotionVideoUrl } from "@/lib/videoLinks";

export const dynamic = "force-dynamic";

function generateClaimCode(): string {
  const randomHex = Math.random().toString(16).substring(2, 10);
  return `poc_${randomHex}`;
}

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
    const { bio_short } = body;

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

    // works는 submissions 테이블에서 NOT NULL(jsonb) 컬럼이므로 항상 배열로 정규화한다.
    // 클라이언트가 별도로 works를 보내지 않는 한(현재 /submit 플로우), 업로드된 프로필 이미지 /
    // 모션 영상을 popok_registration_media 항목으로 기록해 둔다.
    const works = Array.isArray(body.works)
      ? body.works
      : profileImageUrl || motionVideoUrl
      ? [
          {
            kind: "popok_registration_media",
            profile_image_url: profileImageUrl || null,
            motion_video_url: motionVideoUrl || null,
            motion_video_provider: motionVideoUrl.includes("vimeo.com") ? "vimeo" : motionVideoUrl ? "youtube" : null,
          },
        ]
      : [];

    const supabase = getSupabaseServer();

    // Insert into 'submissions' table — 현재 Supabase 스키마에 실제로 존재하는 컬럼만 사용한다.
    const { data, error } = await (supabase.from("submissions" as any) as any)
      .insert({
        name,
        email,
        genre,
        instagram,
        profile_image_url: profileImageUrl || null,
        profile_image_urls: Array.isArray(profileImageUrls) ? profileImageUrls : [],
        motion_video_url: motionVideoUrl || null,
        bio_short: typeof bio_short === "string" ? bio_short.trim() || null : null,
        works: Array.isArray(works) ? works : [],
        additional_requests: additionalRequests || null,
        claim_code: generateClaimCode(),
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[POST /api/popok-submit] Supabase insert error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        {
          success: false,
          error: "등록 저장에 실패했습니다.",
          code: error.code,
          message: error.message,
        },
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
