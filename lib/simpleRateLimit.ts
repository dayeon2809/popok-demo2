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
