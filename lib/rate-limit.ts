/**
 * In-memory rate limiter for API routes.
 *
 * Tracks request counts per key (IP or email) within a sliding window.
 * Resets automatically after the window expires. Works well for single-instance
 * deployments; for multi-instance, swap to Upstash Redis.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function ensureCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
  // Allow the process to exit even if the timer is still running
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref()
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  maxRequests: number
  /** Time window in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check whether a request is allowed under the rate limit.
 *
 * @param key   Unique identifier (e.g. IP address, email, or composite)
 * @param config  Rate limit parameters
 * @returns Whether the request is allowed and how many remain
 */
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  ensureCleanup()

  const now = Date.now()
  const entry = store.get(key)

  // Window expired or first request — start fresh
  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowSeconds * 1000
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt }
  }

  // Within window
  if (entry.count < config.maxRequests) {
    entry.count++
    return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt }
  }

  // Over limit
  return { allowed: false, remaining: 0, resetAt: entry.resetAt }
}

/**
 * Helper to extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}
