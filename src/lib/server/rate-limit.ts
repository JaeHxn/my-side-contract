interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

function cleanExpired() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();

  if (store.size > 5000) cleanExpired();

  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;

  store.set(key, { count: entry.count + 1, resetAt: entry.resetAt });
  return true;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Take the last IP that was added by a trusted proxy rather than the
    // first, which is trivially spoofable by the client.  Vercel appends
    // the real client IP at the rightmost position of the XFF chain.
    const ips = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    const candidate = ips[ips.length - 1];
    if (candidate) return candidate;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
