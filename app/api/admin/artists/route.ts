import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

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
    const supabase = getSupabaseServer();
    // artists.id는 uuid(gen_random_uuid())라 id 기준 정렬은 더 이상 최신순을 의미하지 않는다 — created_at으로 정렬한다.
    const { data: artists, error } = await (supabase.from("artists") as any)
      .select("id, name, name_en, company, genre, role, bio_short, slug, claim_code, verified, profile_image_url, owner_id, submission_id, status, works, email, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/artists] Supabase error:", error);
      return NextResponse.json({ success: false, error: `데이터 조회 실패: ${error.message}` }, { status: 500 });
    }

    // ── 연결 계정 (profiles) 일괄 조회 ──
    // owner_id가 있는 행에 한해서만, 개별 조회가 아니라 in() 한 번으로 배치 조회한다.
    const ownerIds = Array.from(new Set((artists || []).map((a: any) => a.owner_id).filter(Boolean)));
    const profileById = new Map<string, { display_name: string | null; email: string | null }>();

    if (ownerIds.length > 0) {
      const { data: profiles, error: profileErr } = await (supabase.from("profiles") as any)
        .select("id, display_name, email")
        .in("id", ownerIds);

      if (profileErr) {
        console.error("[GET /api/admin/artists] profiles batch fetch error:", profileErr);
      } else {
        for (const p of profiles || []) {
          profileById.set(p.id, { display_name: p.display_name || null, email: p.email || null });
        }
      }
    }

    // ── 최근 로그인 (Supabase Auth) 일괄 조회 ──
    // owner_id별로 auth.admin.getUserById를 개별 호출하지 않고, listUsers()를 한 번만 호출해
    // 메모리에서 owner_id로 조회한다. 아티스트 수가 auth 사용자 페이지 크기(1000)를 넘어서면
    // 뒤쪽 페이지 사용자의 최근 로그인은 조회되지 않고 "기록 없음"으로 표시된다 — 이 프로젝트
    // 규모에서는 충분하지만, 유저가 대폭 늘어나면 페이지네이션이 필요하다.
    const lastSignInById = new Map<string, string | null>();
    if (ownerIds.length > 0) {
      try {
        const { data: userList, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (listErr) {
          console.error("[GET /api/admin/artists] auth.admin.listUsers error:", listErr);
        } else {
          for (const u of userList.users) {
            lastSignInById.set(u.id, u.last_sign_in_at || null);
          }
        }
      } catch (authListErr) {
        console.error("[GET /api/admin/artists] auth.admin.listUsers unexpected error:", authListErr);
      }
    }

    // Map DB columns to what the admin list UI needs — no invented fields.
    const mapped = (artists || []).map((a: any) => {
      const ownerProfile = a.owner_id ? profileById.get(a.owner_id) || null : null;
      return {
        id: String(a.id),
        name: a.name,
        name_en: a.name_en,
        company: a.company,
        profileImage: a.profile_image_url || "",
        genre: a.genre || "",
        role: a.role || "",
        bio_short: a.bio_short || "",
        claim_code: a.claim_code || "",
        verified: !!a.verified,
        slug: a.slug,
        ownerId: a.owner_id || null,
        submissionId: a.submission_id ?? null,
        status: a.status || "draft", // published | draft — the only two values ever written
        worksCount: Array.isArray(a.works) ? a.works.length : 0,
        email: a.email || null,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        ownerProfile,
        lastSignInAt: a.owner_id ? (lastSignInById.get(a.owner_id) ?? null) : null,
      };
    });

    return NextResponse.json({ success: true, data: mapped });
  } catch (err: any) {
    console.error("[GET /api/admin/artists] Server error:", err);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
