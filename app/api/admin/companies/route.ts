import { requireAdminApi } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  try {
    const supabase = getSupabaseServer();
    const { searchParams } = req.nextUrl;
    const statusFilter = searchParams.get("status") || "all"; // all | draft | published | archived
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const ownerFilter = searchParams.get("owner") || "all";
    const genreFilter = (searchParams.get("genre") || "").trim().toLowerCase();
    const sort = searchParams.get("sort") || "newest";

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

    // Which companies have a primary representative artist connected.
    const primaryCompanySet = new Set<string>();
    if (companyIds.length > 0) {
      const { data: primaryRels } = await supabase
        .from("artist_companies" as any)
        .select("company_id")
        .in("company_id", companyIds)
        .eq("is_primary", true);
      for (const row of (primaryRels || []) as any[]) {
        if (row.company_id) primaryCompanySet.add(row.company_id);
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

    const upcomingByCompany = new Map<string, number>();
    if (companyIds.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: performances } = await supabase.from("performances" as any).select("company_id").in("company_id", companyIds).gte("start_date", today);
      for (const row of (performances || []) as any[]) {
        if (row.company_id) upcomingByCompany.set(row.company_id, (upcomingByCompany.get(row.company_id) || 0) + 1);
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
      profile_image_url: c.profile_image_url || null,
      owner_id: c.owner_id || null,
      worksCount: Array.isArray(c.works) ? c.works.length : 0,
      upcomingPerformancesCount: upcomingByCompany.get(c.id) || 0,
      hasPrimaryArtist: primaryCompanySet.has(c.id),
      connectedArtistsCount: countByCompany.get(c.id) || 0,
      fromApplication: fromApplicationSet.has(c.id),
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    if (statusFilter !== "all") {
      mapped = mapped.filter((c) => c.status === statusFilter);
    }
    if (search) {
      mapped = mapped.filter((c) => [c.name, c.name_en, c.slug].some((v) => (v || "").toLowerCase().includes(search)));
    }
    if (ownerFilter === "connected") mapped = mapped.filter((c) => !!c.owner_id || c.hasPrimaryArtist);
    if (ownerFilter === "unconnected") mapped = mapped.filter((c) => !c.owner_id && !c.hasPrimaryArtist);
    if (genreFilter) mapped = mapped.filter((c) => (c.genre || "").toLowerCase() === genreFilter);
    mapped.sort((a, b) => sort === "name" ? (a.name || "").localeCompare(b.name || "", "ko") : String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    return NextResponse.json({ success: true, data: mapped, summary });
  } catch (err: any) {
    console.error("[GET /api/admin/companies] Server error:", err);
    return NextResponse.json({ success: false, error: "단체 목록을 가져오는 데 실패했습니다." }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
    if (!name) return NextResponse.json({ success: false, error: "단체명은 필수입니다." }, { status: 400 });
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json({ success: false, error: "slug는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다." }, { status: 400 });
    }
    const supabase = getSupabaseServer();
    const { data: duplicate } = await supabase.from("companies" as any).select("id").eq("slug", slug).maybeSingle();
    if (duplicate) return NextResponse.json({ success: false, error: "이미 사용 중인 slug입니다." }, { status: 409 });
    const row = {
      id: randomUUID(), name,
      name_en: typeof body.name_en === "string" ? body.name_en.trim() || null : null,
      slug, status: "draft", verified: false,
      genre: typeof body.genre === "string" ? body.genre.trim() || null : null,
      category: typeof body.category === "string" ? body.category.trim() || null : null,
      city_or_region: typeof body.city_or_region === "string" ? body.city_or_region.trim() || null : null,
      bio_short: typeof body.bio_short === "string" ? body.bio_short.trim() || null : null,
      profile_image_url: typeof body.profile_image_url === "string" ? body.profile_image_url.trim() || null : null,
      website: typeof body.website === "string" ? body.website.trim() || null : null,
      instagram: typeof body.instagram === "string" ? body.instagram.trim() || null : null,
      email: typeof body.email === "string" ? body.email.trim() || null : null,
      owner_id: typeof body.owner_id === "string" ? body.owner_id.trim() || null : null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    const { data, error } = await (supabase.from("companies" as any) as any).insert(row).select("*").single();
    if (error) {
      const message = error.code === "23505" ? "이미 사용 중인 slug입니다." : "단체 생성에 실패했습니다.";
      return NextResponse.json({ success: false, error: message }, { status: error.code === "23505" ? 409 : 500 });
    }
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/companies]", error);
    return NextResponse.json({ success: false, error: "단체 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}