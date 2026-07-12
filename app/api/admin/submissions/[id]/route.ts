import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { parsedArtistProfileSchema, type ParsedArtistProfile } from "@/lib/parsedProfile";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const passcode = req.headers.get("x-admin-passcode") || "";
  const adminPasscode = process.env.ADMIN_PASSCODE || "1234";
  return passcode.trim() === adminPasscode.trim();
}

function transliterateKoreanToRoman(text: string): string {
  const map: Record<string, string> = {
    "백": "baek", "연": "yeon", "김": "kim", "이": "lee", "박": "park",
    "최": "choi", "정": "jung", "강": "kang", "조": "cho", "윤": "yoon",
    "장": "jang", "임": "lim", "한": "han", "오": "oh", "서": "seo",
    "신": "shin", "권": "kwon", "황": "hwang", "안": "ahn", "송": "song",
    "전": "jeon", "홍": "hong", "유": "yoo", "고": "koh", "문": "moon"
  };
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (map[char]) {
      result += (result ? "-" : "") + map[char];
    } else {
      const code = char.charCodeAt(0);
      if (code >= 0xac00 && code <= 0xd7a3) {
        result += (result ? "-" : "") + "art";
      } else if (/[a-zA-Z0-9]/.test(char)) {
        result += char.toLowerCase();
      }
    }
  }
  return result.replace(/--+/g, "-").replace(/^-|-$/g, "");
}

function slugify(name: string, nameEn: string | null | undefined, id: number): string {
  let baseSlug = "";
  if (nameEn && typeof nameEn === "string" && nameEn.trim()) {
    baseSlug = nameEn.trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s\t]+/g, "-")
      .toLowerCase();
  } else {
    baseSlug = transliterateKoreanToRoman(name || "");
    if (!baseSlug) {
      baseSlug = "artist";
    }
  }
  return `${baseSlug}-${id}`;
}

// 1. POST handler - 업데이트 및 쇼룸 공개
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id } = await params;
  const numericId = Number(id);

  try {
    const body = await req.json();
    const action = body?.action; // "update" | "publish"

    const supabase = getSupabaseServer();

    if (action === "update") {
      const fields = body?.fields;
      if (!fields) {
        return NextResponse.json({ success: false, error: "수정할 데이터가 존재하지 않습니다." }, { status: 400 });
      }

      const { error } = await (supabase.from("submissions" as any) as any)
        .update({
          name: fields.name,
          genre: fields.genre,
          instagram: fields.instagram,
          email: fields.email || null,
          motion_video_url: fields.motion_video_url || null,
          profile_image_url: fields.profile_image_url || null,
          profile_image_urls: Array.isArray(fields.profile_image_urls) ? fields.profile_image_urls : [],
          additional_requests: fields.additional_requests || null,
          bio_short: typeof fields.bio_short === "string"
            ? fields.bio_short.trim() || null
            : null,
        })
        .eq("id", numericId);

      if (error) {
        console.error("Update submissions error:", error);
        return NextResponse.json({ success: false, error: "데이터 수정에 실패했습니다.", detail: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } 
    
    else if (action === "publish") {
      // 1. Fetch submission data
      const { data: subData, error: subErr } = await (supabase.from("submissions" as any) as any)
        .select("*")
        .eq("id", numericId)
        .single();

      if (subErr || !subData) {
        return NextResponse.json({ success: false, error: "등록 신청서 데이터를 찾지 못했습니다." }, { status: 404 });
      }

      // --- AI 검수 안전장치 ---
      // 이 submission이 "AI로 이력 정리하기"를 한 번이라도 거쳤다면(parsed_profile 존재),
      // 반드시 관리자 검수(parser_status === "reviewed")를 마친 뒤에만 공개를 허용한다.
      // 한 번도 AI 정리를 사용하지 않은 기존 submission은 기존 승인 흐름을 그대로 유지한다(#12 하위호환).
      let parsedProfile: ParsedArtistProfile | null = null;
      const hasParsedProfile = subData.parsed_profile != null;
      if (hasParsedProfile) {
        if (subData.parser_status !== "reviewed") {
          return NextResponse.json(
            { success: false, error: "AI로 정리한 내용을 먼저 검수하고 '정리 결과 저장'을 완료해야 공개할 수 있습니다." },
            { status: 400 }
          );
        }
        const validated = parsedArtistProfileSchema.safeParse(subData.parsed_profile);
        if (!validated.success) {
          return NextResponse.json(
            { success: false, error: "저장된 정리 결과가 올바른 형식이 아닙니다. 다시 정리하거나 수정해주세요." },
            { status: 400 }
          );
        }
        parsedProfile = validated.data as ParsedArtistProfile;
        if (!parsedProfile.artist.name.trim() && !(subData.name || "").trim()) {
          return NextResponse.json({ success: false, error: "이름이 비어 있어 공개할 수 없습니다." }, { status: 400 });
        }
        if (!parsedProfile.artist.genre.trim()) {
          return NextResponse.json({ success: false, error: "장르가 비어 있어 공개할 수 없습니다." }, { status: 400 });
        }
      }

      const name = (subData.name || parsedProfile?.artist.name || "").trim();
      // name_en 컬럼은 현재 submissions에 존재하지 않아 항상 undefined로 전달되며,
      // slugify()는 이 경우 한글 로마자 변환 경로로 자연히 폴백한다.
      const slug = slugify(name, subData.name_en, numericId);

      // 1. submissions.works를 그대로 복사한다 — artists.works의 source of truth
      //    (AI 정리 결과가 검수 완료된 경우, parsed_profile.works를 우선 사용한다)
      const works: any[] = parsedProfile
        ? parsedProfile.works.map((w, idx) => ({
            id: `${slug}-${String(idx + 1).padStart(3, "0")}`,
            title: w.title,
            year: w.year || "연도미상",
            description:
              w.description ||
              [w.organization, w.festival].filter(Boolean).join(" · ") ||
              undefined,
            role: w.role || undefined,
            type: w.type,
            image_url: null,
            video_url: null,
          }))
        : Array.isArray(subData.works)
          ? [...subData.works]
          : [];

      // 3. 중복 생성 방지: works가 이미 image_url/video_url(Work 규격)로 담고 있는 URL만 수집한다.
      //    submissions.works의 원본 항목(예: kind:"popok_registration_media")은 profile_image_url/motion_video_url
      //    키를 쓰므로 여기서는 매치되지 않고, 아래에서 image_url/video_url 규격의 호환 Work가 별도로 병합된다.
      const existingImageUrls = new Set<string>();
      const existingVideoUrls = new Set<string>();
      works.forEach((w: any) => {
        if (!w || typeof w !== "object") return;
        if (typeof w.image_url === "string" && w.image_url) existingImageUrls.add(w.image_url);
        if (typeof w.video_url === "string" && w.video_url) existingVideoUrls.add(w.video_url);
      });

      // 2. 대표 이미지 / 모션 영상은 기존 기능(artists 목록·상세 페이지의 대표 이미지 렌더링) 호환을 위해
      //    image_url/video_url 규격의 Work로 배열 뒤에 merge (동일 URL이 이미 있으면 생략)
      const mainImg = subData.profile_image_url || (Array.isArray(subData.profile_image_urls) ? subData.profile_image_urls[0] : null);
      const motionUrl = subData.motion_video_url || null;
      const needsImageWork = !!mainImg && !existingImageUrls.has(mainImg);
      const needsVideoWork = !!motionUrl && !existingVideoUrls.has(motionUrl);

      if (needsImageWork || needsVideoWork) {
        // works 배열에 이미 항목이 있을 수 있으므로(특히 parsed_profile.works),
        // id가 겹치지 않도록 현재 길이 기준으로 번호를 이어서 매긴다.
        works.push({
          id: `${slug}-${String(works.length + 1).padStart(3, "0")}`,
          slug: "official-motion-profile",
          title: "공식 모션 프로필",
          year: new Date().getFullYear().toString(),
          description: "POPOK 등록 모션 프로필 비디오 및 이미지 아카이브",
          role: "아티스트",
          image_url: needsImageWork ? mainImg : null,
          video_url: needsVideoWork ? motionUrl : null,
        });
      }

      // artists 테이블에 실제로 존재하는 컬럼만 사용한다.
      // attachment 컬럼은 더 이상 존재하지 않으므로 instagram/website 분리 컬럼에 각각 저장한다.
      // submissions에는 website 소스 컬럼이 없어 저장할 값이 없다 — 있을 때만 저장하라는 요구사항상 항상 null.
      //
      // genre 컬럼은 앱 전역에서 "field,genre" 콤마 포맷으로 파싱된다(/api/artists, /api/artists/[id] 등).
      // AI가 정리한 parsed_profile.artist.genre는 자유 텍스트이므로, 기존 컨벤션을 깨지 않도록
      // field는 이 신청 파이프라인의 고정값인 "dance"를 유지하고 genre 세그먼트만 AI 값으로 교체한다.
      const genreSegment = (parsedProfile?.artist.genre || "contemporary").replace(/,/g, " ").trim() || "contemporary";

      const artistPayload: Record<string, any> = {
        name,
        role: `<${parsedProfile?.artist.genre || subData.genre}>`,
        genre: `dance,${genreSegment}`,
        instagram: subData.instagram || null,
        website: null as string | null,
        email: subData.email || null,
        bio_short:
          parsedProfile?.artist.bio_short ||
          subData.bio_short ||
          subData.additional_requests ||
          `${name} 작가의 공식 POPOK 디지털 명함 카드 페이지입니다.`,
        profile_image_url: subData.profile_image_url || null,
        profile_image_urls: Array.isArray(subData.profile_image_urls) ? subData.profile_image_urls : [],
        motion_video_url: subData.motion_video_url || null,
        works,
        status: "published",
      };

      // AI 정리 결과가 검수 완료된 경우에만 확장 컬럼을 함께 저장한다.
      // (레거시 submission은 이 컬럼들을 전혀 건드리지 않아 기존 공개 흐름과 100% 동일하게 동작한다.)
      if (parsedProfile) {
        artistPayload.affiliations = parsedProfile.affiliations;
        artistPayload.current_activity = parsedProfile.current_activity;
        artistPayload.awards = parsedProfile.awards;
        artistPayload.competitions = parsedProfile.competitions;
        artistPayload.education = parsedProfile.education;
        artistPayload.links = parsedProfile.links;
      }

      // 2. Check if artist already exists for this submission
      const { data: existingArtist } = await (supabase.from("artists" as any) as any)
        .select("id")
        .eq("submission_id", numericId)
        .maybeSingle();

      let artistErr: any = null;
      let artistId: string | null = existingArtist?.id ?? null;

      if (existingArtist) {
        // Update existing artist — artists.id는 uuid 문자열이므로 그대로 사용하고 Number()로 변환하지 않는다.
        const { error } = await (supabase.from("artists" as any) as any)
          .update(artistPayload)
          .eq("id", existingArtist.id);
        artistErr = error;
      } else {
        // Insert new artist — id는 DB default(gen_random_uuid())로 생성되므로 직접 지정하지 않는다.
        const { data: insertedArtist, error } = await (supabase.from("artists" as any) as any)
          .insert({ submission_id: numericId, slug, ...artistPayload })
          .select("id")
          .single();
        artistErr = error;
        artistId = insertedArtist?.id ?? null;
      }

      if (artistErr) {
        console.error("Upsert artist error:", artistErr);
        return NextResponse.json({ success: false, error: "아티스트 페이지 공개에 실패했습니다.", detail: artistErr.message }, { status: 500 });
      }

      // 3. submissions.status를 approved로 갱신하고, 공개된 아티스트 slug를 public_slug에 저장한다.
      const { error: updateSubErr } = await (supabase.from("submissions" as any) as any)
        .update({ status: "approved", public_slug: slug })
        .eq("id", numericId);

      if (updateSubErr) {
        console.warn("Submissions status update failed:", updateSubErr);
      }

      return NextResponse.json({ success: true, slug, artistId });
    }
    
    else {
      return NextResponse.json({ success: false, error: "올바르지 않은 작업 액션입니다." }, { status: 400 });
    }
  } catch (err: any) {
    console.error(`[POST /api/admin/submissions/${id}]`, err);
    return NextResponse.json({ success: false, error: "작업 처리 중 오류가 발생했습니다.", detail: String(err) }, { status: 500 });
  }
}

// 2. DELETE handler - 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ success: false, error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { id } = await params;
  const numericId = Number(id);

  try {
    const supabase = getSupabaseServer();
    // 1. Delete associated artist first to avoid foreign key violation
    await (supabase.from("artists" as any) as any)
      .delete()
      .eq("submission_id", numericId);

    // 2. Delete submission
    const { error } = await (supabase.from("submissions" as any) as any)
      .delete()
      .eq("id", numericId);

    if (error) {
      console.error("Delete submission error:", error);
      return NextResponse.json({ success: false, error: "삭제에 실패했습니다.", detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[DELETE /api/admin/submissions/${id}]`, err);
    return NextResponse.json({ success: false, error: "삭제 중 오류가 발생했습니다.", detail: String(err) }, { status: 500 });
  }
}
