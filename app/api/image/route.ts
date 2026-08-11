import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

const ALLOWED_WIDTHS = [32, 48, 64, 96, 128, 256, 384, 600] as const;

function allowedHostname(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").hostname;
  } catch {
    return "";
  }
}

function normalizeWidth(value: string | null): number {
  const requested = Math.max(1, Math.min(600, Number(value) || 600));
  return ALLOWED_WIDTHS.find((width) => width >= requested) || 600;
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("url") || "";
  const width = normalizeWidth(request.nextUrl.searchParams.get("w"));
  const quality = Math.max(40, Math.min(80, Number(request.nextUrl.searchParams.get("q")) || 80));

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(source);
  } catch {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  const hostname = allowedHostname();
  if (
    !hostname ||
    sourceUrl.protocol !== "https:" ||
    sourceUrl.hostname !== hostname ||
    !sourceUrl.pathname.startsWith("/storage/v1/object/public/")
  ) {
    return NextResponse.json({ error: "Image host is not allowed" }, { status: 403 });
  }

  try {
    const response = await fetch(sourceUrl, { cache: "force-cache" });
    if (!response.ok) {
      return NextResponse.json({ error: "Source image unavailable" }, { status: response.status });
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Source is not an image" }, { status: 415 });
    }

    const input = Buffer.from(await response.arrayBuffer());
    const output = await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    return new NextResponse(new Uint8Array(output), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(output.byteLength),
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
        "CDN-Cache-Control": "public, max-age=31536000, immutable",
        "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[image proxy]", error);
    return NextResponse.json({ error: "Image optimization failed" }, { status: 502 });
  }
}