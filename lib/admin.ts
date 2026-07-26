import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

type AdminUser = {
  email?: string | null;
};

type AdminSupabaseClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: AdminUser | null };
      error: unknown;
    }>;
  };
};

type AdminAccessResult =
  | { status: "authorized"; user: AdminUser }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "misconfigured" };

export async function getAdminAccess(
  client?: AdminSupabaseClient,
): Promise<AdminAccessResult> {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.error("[admin-auth] ADMIN_EMAIL is not configured. Admin access is disabled.");
    return { status: "misconfigured" };
  }

  const supabase = client ?? (await createServerSupabaseClient());
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { status: "unauthenticated" };
  }

  if (user.email !== adminEmail) {
    return { status: "forbidden" };
  }

  return { status: "authorized", user };
}

export async function requireAdmin(): Promise<AdminUser> {
  const result = await getAdminAccess();

  if (result.status === "authorized") {
    return result.user;
  }

  if (result.status === "unauthenticated") {
    redirect("/auth");
  }

  redirect("/");
}

export async function requireAdminApi(): Promise<NextResponse | null> {
  const result = await getAdminAccess();

  if (result.status === "authorized") {
    return null;
  }

  if (result.status === "unauthenticated") {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  if (result.status === "misconfigured") {
    return NextResponse.json(
      { success: false, error: "Admin authentication is not configured." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: false, error: "Forbidden" },
    { status: 403 },
  );
}