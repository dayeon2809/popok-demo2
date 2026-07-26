import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";

export async function POST() {
  const adminError = await requireAdminApi();
  if (adminError) return adminError;

  return NextResponse.json({ success: true });
}