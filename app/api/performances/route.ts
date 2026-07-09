import { NextRequest, NextResponse } from "next/server";
import { getPerformances } from "@/lib/performances";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const performances = getPerformances();
    return NextResponse.json({ data: performances, error: null });
  } catch (err) {
    console.error("[/api/performances]", err);
    return NextResponse.json(
      { data: null, error: "공연 데이터를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
