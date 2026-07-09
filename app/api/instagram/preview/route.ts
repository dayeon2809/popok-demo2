import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const instagramUrl = (body?.url ?? "").trim();
    if (!instagramUrl) {
      return NextResponse.json({ success: false, error: "Instagram URL is required" }, { status: 400 });
    }

    // Extract username from URL
    // e.g. https://instagram.com/username/ -> username
    // e.g. https://www.instagram.com/username?igsh=xxx -> username
    const match = instagramUrl.match(/(?:instagram\.com\/)([a-zA-Z0-9_.]+)/i);
    if (!match) {
      return NextResponse.json({ success: false, error: "Invalid Instagram URL format" }, { status: 400 });
    }

    const username = match[1];

    console.log(`[instagram-preview] Attempting to scrape profile for: ${username}`);

    try {
      // Fetch Instagram page using a crawler User-Agent to retrieve OG tags
      const response = await fetch(`https://www.instagram.com/${username}/`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
        },
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        throw new Error(`Instagram returned status: ${response.status}`);
      }

      const html = await response.text();

      // Parse Open Graph meta tags
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
      
      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

      const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);

      if (!ogTitleMatch) {
        console.warn(`[instagram-preview] Could not parse OG title. User might be blocked or redirected.`);
        return NextResponse.json({
          success: false,
          username,
          reason: "scraping_blocked",
          message: "인스타그램 보안 정책으로 인해 자동 수집이 제한되었습니다. 수동으로 기입해주십시오."
        });
      }

      const ogTitle = ogTitleMatch[1];
      const ogImage = ogImageMatch ? ogImageMatch[1] : "";
      const ogDesc = ogDescMatch ? ogDescMatch[1] : "";

      // Clean name from title (e.g. "윤경근 (@gongwon____) • Instagram photos and videos" -> "윤경근")
      let name = ogTitle;
      const titleMatch = ogTitle.match(/^([^\(]+)\s*\(@[^\)]+\)/);
      if (titleMatch) {
        name = titleMatch[1].trim();
      }

      // Clean description to extract bio
      // e.g. "820 Followers, 532 Following, 150 Posts - See Instagram photos and videos from 윤경근 (@gongwon____)"
      // If the bio is actually visible in the description, or we clean up stats
      let bio = ogDesc;
      if (ogDesc.includes("Followers") || ogDesc.includes("팔로워")) {
        // Often Instagram desc is "Followers, Following... - See Instagram photos and videos from Name"
        // Let's see if we can find bio inside description. Sometimes bio is prepended.
        const seeMatch = ogDesc.match(/(?:See Instagram|Instagram 사진)/i);
        if (seeMatch) {
          const parts = ogDesc.split("-");
          // If there is a bio, it's often the first part before the stats, or there is no bio in OG desc
          // We can clean it up
          bio = "";
        }
      }

      return NextResponse.json({
        success: true,
        username,
        name,
        bio,
        profileImage: ogImage,
      });

    } catch (fetchErr: any) {
      console.error(`[instagram-preview] Scraper error:`, fetchErr);
      return NextResponse.json({
        success: false,
        username,
        reason: "fetch_error",
        message: `네트워크 오류 또는 접속 차단 (${fetchErr.message || fetchErr})`
      });
    }

  } catch (err: any) {
    console.error("[POST /api/instagram/preview]", err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
