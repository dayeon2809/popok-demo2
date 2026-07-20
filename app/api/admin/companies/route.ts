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
    const { searchParams } = req.nextUrl;
    const statusFilter = searchParams.get("status") || "all"; // all | draft | published | archived
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const { data: companies, error } = await supabase
      .from("companies" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/companies] Supabase error:", error);
      return NextResponse.json({ success: false, error: "단체 목록을 가져오는 데 실패했습니다." }, { status: 500 });
    }

    const allCompanies = (companies || []) as any[];
    const companyIds = allCompanies.map((c) => c.id);

    // Connected-artist counts, batched (avoids N+1 queries).
    const countByCompany = new Map<string, number>();
    if (companyIds.length > 0) {
      const { data: relations } = await supabase
        .from("artist_companies" as any)
        .select("company_id")
        .in("company_id", companyIds);
      for (const row of (relations || []) as any[]) {
        countByCompany.set(row.company_id, (countByCompany.get(row.company_id) || 0) + 1);
      }
    }

    // Which companies originated from an organization application.
    const fromApplicationSet = new Set<string>();
    if (companyIds.length > 0) {
      const { data: apps } = await supabase
        .from("organization_applications" as any)
        .select("company_id")
        .in("company_id", companyIds);
      for (const row of (apps || []) as any[]) {
        if (row.company_id) fromApplicationSet.add(row.company_id);
      }
    }

    const summary = {
      total: allCompanies.length,
      draft: allCompanies.filter((c) => c.status === "draft").length,
      published: allCompanies.filter((c) => c.status === "published").length,
      archived: allCompanies.filter((c) => c.status === "archived").length,
    };

    let mapped = allCompanies.map((c) => ({
      id: String(c.id),
      name: c.name,
      name_en: c.name_en,
      slug: c.slug,
      status: c.status,
      verified: !!c.verified,
      genre: c.genre,
      category: c.category,
      city_or_region: c.city_or_region,
      owner_id: c.owner_id || null,
      connectedArtistsCount: countByCompany.get(c.id) || 0,
      fromApplication: fromApplicationSet.has(c.id),
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    if (statusFilter !== "all") {
      mapped = mapped.filter((c) => c.status === statusFilter);
    }
    if (search) {
      mapped = mapped.filter((c) =>
        [c.name, c.name_en, c.slug].some((v) => (v || "").toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ success: true, data: mapped, summary });
  } catch (err: any) {
    console.error("[GET /api/admin/companies] Server error:", err);
    return NextResponse.json({ success: false, error: "단체 목록을 가져오는 데 실패했습니다." }, { status: 500 });
  }
}
