type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

type CounterState = {
  count: number;
  windowStart: number;
};

const counters = new Map<string, CounterState>();
const WINDOW_MS = 60_000;
const LIMIT = 100;

export function consumeRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const current = counters.get(identifier);

  if (!current || now - current.windowStart >= WINDOW_MS) {
    counters.set(identifier, { count: 1, windowStart: now });
    return {
      allowed: true,
      limit: LIMIT,
      remaining: LIMIT - 1,
      retryAfterSeconds: Math.ceil(WINDOW_MS / 1000)
    };
  }

  if (current.count >= LIMIT) {
    const elapsed = now - current.windowStart;
    const retryAfterSeconds = Math.max(1, Math.ceil((WINDOW_MS - elapsed) / 1000));
    return {
      allowed: false,
      limit: LIMIT,
      remaining: 0,
      retryAfterSeconds
    };
  }

  current.count += 1;
  counters.set(identifier, current);

  return {
    allowed: true,
    limit: LIMIT,
    remaining: Math.max(0, LIMIT - current.count),
    retryAfterSeconds: Math.ceil(WINDOW_MS / 1000)
  };
}
