// Generic in-memory sliding-window rate limiter — same idea already used
// ad hoc in app/api/profile/parse/route.ts (a Map keyed by identity), just
// factored out so a second caller (the AI discovery endpoint) doesn't
// duplicate the pattern. No Redis/external infra — this resets on every
// server restart/redeploy and is per-instance only in serverless, which is
// fine as a best-effort abuse guard, not a strict quota.

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

/**
 * Allows up to `max` calls per `windowMs` for a given `key`. Prunes old
 * buckets opportunistically so the map doesn't grow unbounded across many
 * distinct keys (IPs) over the life of the server instance.
 */
export function checkRateLimit(key: string, { windowMs, max }: { windowMs: number; max: number }): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= max) {
    const oldest = bucket.timestamps[0];
    return { allowed: false, retryAfterMs: Math.max(0, windowMs - (now - oldest)) };
  }

  bucket.timestamps.push(now);

  // Opportunistic cleanup of stale keys so long-lived instances don't leak
  // memory across thousands of distinct IPs.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.timestamps.every((t) => now - t > windowMs)) buckets.delete(k);
    }
  }

  return { allowed: true, retryAfterMs: 0 };
}

/**
 * 요청자를 가리키는 rate limit 키를 만든다.
 *
 * Vercel 뒤에서는 실제 IP 가 x-forwarded-for 맨 앞에 온다. 헤더는 위조될 수
 * 있으므로 이것은 엄밀한 신원이 아니라 남용을 늦추기 위한 최선의 근사다.
 * 같은 규칙을 라우트마다 다시 쓰지 않도록 여기에 둔다.
 */
export function clientRateLimitKey(
  req: { headers: { get(name: string): string | null } },
  prefix: string
): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `${prefix}:${ip}`;
}

/** 429 응답 한 벌. 라우트마다 문구와 헤더를 다시 쓰지 않도록. */
export function rateLimitedResponse(retryAfterMs: number): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
      code: "RATE_LIMITED",
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
      },
    }
  );
}
