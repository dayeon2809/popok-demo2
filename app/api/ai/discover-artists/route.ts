import { NextRequest, NextResponse } from "next/server";
import { runAiDiscovery, type DiscoveryMode } from "@/lib/aiDiscovery";
import { checkRateLimit } from "@/lib/simpleRateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_MODES: DiscoveryMode[] = ["discover", "similar", "collaborator"];

const QUERY_MIN_LEN = 2;
const QUERY_MAX_LEN = 300;
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 12;

// Best-effort abuse guard for an unauthenticated, cost-bearing endpoint (see
// lib/simpleRateLimit.ts) — not a strict quota, resets per server instance.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 8;

const AI_CALL_TIMEOUT_MS = 25_000;

function getClientKey(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `ai-discover:${ip}`;
}

export async function POST(req: NextRequest) {
  const rateLimitKey = getClientKey(req);
  const rateLimit = checkRateLimit(rateLimitKey, { windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX_REQUESTS });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) } }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "잘못된 요청 형식입니다.", code: "INVALID_BODY" }, { status: 400 });
  }

  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json({ success: false, error: "검색어를 입력해 주세요.", code: "EMPTY_QUERY" }, { status: 400 });
  }
  if (query.length < QUERY_MIN_LEN) {
    return NextResponse.json({ success: false, error: "검색어가 너무 짧습니다.", code: "QUERY_TOO_SHORT" }, { status: 400 });
  }
  if (query.length > QUERY_MAX_LEN) {
    return NextResponse.json({ success: false, error: "검색어가 너무 깁니다.", code: "QUERY_TOO_LONG" }, { status: 400 });
  }

  // Invalid/malformed contextArtistId is silently ignored rather than
  // rejected — it's an optional hint, not something a caller should have to
  // get exactly right.
  const contextArtistId =
    typeof body?.contextArtistId === "string" && UUID_RE.test(body.contextArtistId) ? body.contextArtistId : null;

  const rawLimit = Number(body?.limit);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), MAX_LIMIT) : DEFAULT_LIMIT;

  const mode: DiscoveryMode = VALID_MODES.includes(body?.mode) ? body.mode : "discover";

  try {
    const result = await Promise.race([
      runAiDiscovery({ query, contextArtistId, limit, mode }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("AI_DISCOVERY_TIMEOUT")), AI_CALL_TIMEOUT_MS)),
    ]);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    const timedOut = err?.message === "AI_DISCOVERY_TIMEOUT";
    console.error("[POST /api/ai/discover-artists] Error:", err?.message || err);
    return NextResponse.json(
      {
        success: false,
        error: timedOut
          ? "응답 시간이 초과되었어요. 잠시 후 다시 시도해 주세요."
          : "지금은 추천 결과를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.",
        code: timedOut ? "TIMEOUT" : "AI_DISCOVERY_FAILED",
      },
      { status: timedOut ? 504 : 500 }
    );
  }
}
