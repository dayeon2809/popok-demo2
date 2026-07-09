import { NextRequest, NextResponse } from "next/server";
import { getPerformance } from "@/lib/performances";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const performance = getPerformance(id);
    if (!performance) {
      return NextResponse.json({ data: null, error: "공연을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ data: performance, error: null });
  } catch (err) {
    console.error("[/api/performances/[id]]", err);
    return NextResponse.json(
      { data: null, error: "공연 상세 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
