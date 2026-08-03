import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabaseServer";
import type { User } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type MemberStatus = "registered" | "signup_only" | "profile_missing";

interface AdminUserListItem {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  provider: string;
  hasProfile: boolean;
  hasArtist: boolean;
  hasCompany: boolean;
  status: MemberStatus;
}

// auth.admin.listUsers() is paginated server-side (default page size 50) —
// a single call silently truncates once the project has more users than
// that. Walk every page so the full member list (and the owner-search
// below) always sees the entire auth.users table, never just page 1.
async function listAllAuthUsers(supabase: ReturnType<typeof getSupabaseServer>): Promise<User[]> {
  const perPage = 1000;
  let page = 1;
  const all: User[] = [];
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    all.push(...data.users);
    if (data.users.length < perPage) break;
    page++;
  }
  return all;
}

function displayProvider(u: User): string {
  const raw = u.app_metadata?.provider || u.app_metadata?.providers?.[0] || "email";
  if (raw === "google") return "Google";
  if (raw === "email") return "Email";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export async function GET(req: NextRequest) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;
  const supabase = getSupabaseServer();

  // "search" is the param AdminCompanyOwnerPanel's owner-picker already
  // sends; "query" is accepted as an alias for the same mode so both names
  // work without the two modes colliding.
  const searchTerm = (req.nextUrl.searchParams.get("search") || req.nextUrl.searchParams.get("query") || "").trim().toLowerCase();

  // Owner-picker mode — unchanged behavior, requires 2+ chars, returns a
  // short match list of {id, email, name}, not the full member list below.
  if (searchTerm) {
    if (searchTerm.length < 2) return NextResponse.json({ success: true, data: [] });
    let users: User[];
    try {
      users = await listAllAuthUsers(supabase);
    } catch {
      return NextResponse.json({ success: false, error: "사용자 검색에 실패했습니다." }, { status: 500 });
    }
    const results = users
      .map((user) => ({ id: user.id, email: user.email || "", name: user.user_metadata?.name || user.user_metadata?.full_name || "" }))
      .filter((user) => [user.email, user.name].some((value) => value.toLowerCase().includes(searchTerm)))
      .slice(0, 20);
    return NextResponse.json({ success: true, data: results });
  }

  // Full member-list mode — the "전체 가입자" admin view. auth.users is the
  // one and only driving table; profiles/artists/companies are fetched
  // separately by id and merged in-memory (left-join semantics), so an
  // account with no profile/artist/company row still appears.
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
  const perPage = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("perPage")) || 50));

  let allUsers: User[];
  try {
    allUsers = await listAllAuthUsers(supabase);
  } catch {
    return NextResponse.json({ success: false, error: "사용자 목록을 불러오지 못했습니다." }, { status: 500 });
  }
  allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const userIds = allUsers.map((u) => u.id);
  const [{ data: profiles, error: profileErr }, { data: artists, error: artistErr }, { data: companies, error: companyErr }] = await Promise.all([
    supabase.from("profiles").select("id").in("id", userIds) as any,
    supabase.from("artists").select("owner_id").in("owner_id", userIds) as any,
    supabase.from("companies").select("owner_id").in("owner_id", userIds) as any,
  ]);
  if (profileErr) return NextResponse.json({ success: false, error: "프로필 조회에 실패했습니다." }, { status: 500 });
  if (artistErr) return NextResponse.json({ success: false, error: "아티스트 조회에 실패했습니다." }, { status: 500 });
  if (companyErr) return NextResponse.json({ success: false, error: "단체 조회에 실패했습니다." }, { status: 500 });

  const profileIds = new Set((profiles || []).map((p: any) => p.id));
  const artistOwnerIds = new Set((artists || []).map((a: any) => a.owner_id));
  const companyOwnerIds = new Set((companies || []).map((c: any) => c.owner_id));

  const total = allUsers.length;
  const start = (page - 1) * perPage;
  const pageUsers = allUsers.slice(start, start + perPage);

  const data: AdminUserListItem[] = pageUsers.map((u) => {
    const hasProfile = profileIds.has(u.id);
    const hasArtist = artistOwnerIds.has(u.id);
    const hasCompany = companyOwnerIds.has(u.id);
    const status: MemberStatus = hasArtist || hasCompany ? "registered" : hasProfile ? "signup_only" : "profile_missing";
    return {
      id: u.id,
      email: u.email || null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at || null,
      provider: displayProvider(u),
      hasProfile,
      hasArtist,
      hasCompany,
      status,
    };
  });

  return NextResponse.json({
    success: true,
    data,
    pagination: { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
  });
}
