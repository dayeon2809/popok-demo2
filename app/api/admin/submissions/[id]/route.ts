import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

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
          youtube_url: fields.youtube_url || null,
          youtube_preview_start: typeof fields.youtube_preview_start === "number" ? fields.youtube_preview_start : 0,
          youtube_preview_end: typeof fields.youtube_preview_end === "number" ? fields.youtube_preview_end : 15,
          profile_image_url: fields.profile_image_url || null,
          profile_image_urls: Array.isArray(fields.profile_image_urls) ? fields.profile_image_urls : [],
          additional_requests: fields.additional_requests || null,
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

      const name = (subData.name || "").trim();
      const slug = slugify(name, subData.name_en, numericId);

      // Map portfolio works JSON
      const mainImg = subData.profile_image_url || (Array.isArray(subData.profile_image_urls) ? subData.profile_image_urls[0] : null);
      const portfolioWorks = [
        {
          title: "공식 모션 프로필",
          year: new Date().getFullYear().toString(),
          description: "POPOK 등록 모션 프로필 비디오 및 이미지 아카이브",
          role: "아티스트",
          image_url: mainImg || null,
          video_url: subData.youtube_url || null,
          preview_start: subData.youtube_preview_start ?? 0,
          preview_end: subData.youtube_preview_end ?? 15,
        }
      ];

      // 2. Check if artist already exists for this submission
      const { data: existingArtist } = await (supabase.from("artists" as any) as any)
        .select("id")
        .eq("submission_id", numericId)
        .maybeSingle();

      let artistErr: any = null;

      if (existingArtist) {
        // Update existing artist
        const { error } = await (supabase.from("artists" as any) as any)
          .update({
            name,
            role: `<${subData.genre}>`,
            genre: "dance,contemporary",
            attachment: subData.instagram || "",
            email: subData.email || null,
            bio_short: subData.additional_requests || `${name} 작가의 공식 POPOK 디지털 명함 카드 페이지입니다.`,
            portfolio_works: portfolioWorks,
            status: "published"
          })
          .eq("id", existingArtist.id);
        artistErr = error;
      } else {
        // Insert new artist
        const { error } = await (supabase.from("artists" as any) as any)
          .insert({
            submission_id: numericId,
            name,
            role: `<${subData.genre}>`,
            genre: "dance,contemporary",
            attachment: subData.instagram || "",
            email: subData.email || null,
            slug,
            bio_short: subData.additional_requests || `${name} 작가의 공식 POPOK 디지털 명함 카드 페이지입니다.`,
            portfolio_works: portfolioWorks,
            status: "published"
          });
        artistErr = error;
      }

      if (artistErr) {
        console.error("Upsert artist error:", artistErr);
        return NextResponse.json({ success: false, error: "아티스트 페이지 공개에 실패했습니다.", detail: artistErr.message }, { status: 500 });
      }

      // 3. Update submission status to approved
      const { error: updateSubErr } = await (supabase.from("submissions" as any) as any)
        .update({ status: "approved" })
        .eq("id", numericId);

      if (updateSubErr) {
        console.warn("Submissions status update failed:", updateSubErr);
      }

      return NextResponse.json({ success: true, slug });
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
