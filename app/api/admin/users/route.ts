import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;
  const query = (req.nextUrl.searchParams.get("search") || "").trim().toLowerCase();
  if (query.length < 2) return NextResponse.json({ success: true, data: [] });
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) return NextResponse.json({ success: false, error: "사용자 검색에 실패했습니다." }, { status: 500 });
  const users = data.users.map((user) => ({ id: user.id, email: user.email || "", name: user.user_metadata?.name || user.user_metadata?.full_name || "" }))
    .filter((user) => [user.email, user.name].some((value) => value.toLowerCase().includes(query))).slice(0, 20);
  return NextResponse.json({ success: true, data: users });
}
