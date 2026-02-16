/**
 * Rate limiter with Upstash Redis backend + in-memory fallback.
 *
 * When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set the
 * limiter uses Redis (works across multiple serverless instances).
 * Otherwise it falls back to the in-memory Map implementation so the
 * app still works in development without Redis.
 */

import { Redis } from "@upstash/redis"

// ── Upstash Redis client (lazy-loaded) ─────────────────────────────
let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) {
    redis = new Redis({ url, token })
    return redis
  }
  return null
}

// ── In-memory fallback ─────────────────────────────────────────────
interface RateLimitEntry {
  count: number
  resetAt: number
}

const memStore = new Map<string, RateLimitEntry>()

const CLEANUP_INTERVAL = 5 * 60 * 1000
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function ensureCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memStore) {
      if (now > entry.resetAt) {
        memStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    (cleanupTimer as NodeJS.Timeout).unref()
  }
}

// ── Shared types ───────────────────────────────────────────────────
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

// ── In-memory implementation ───────────────────────────────────────
function rateLimitMemory(key: string, config: RateLimitConfig): RateLimitResult {
  ensureCleanup()
  const now = Date.now()
  const entry = memStore.get(key)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowSeconds * 1000
    memStore.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt }
  }

  if (entry.count < config.maxRequests) {
    entry.count++
    return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt }
  }

  return { allowed: false, remaining: 0, resetAt: entry.resetAt }
}

// ── Redis implementation ───────────────────────────────────────────
async function rateLimitRedis(
  client: Redis,
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`

  // Increment counter; set TTL on first request in the window
  const count = await client.incr(redisKey)

  if (count === 1) {
    await client.expire(redisKey, config.windowSeconds)
  }

  const ttl = await client.ttl(redisKey)
  const resetAt = Date.now() + ttl * 1000

  if (count <= config.maxRequests) {
    return { allowed: true, remaining: config.maxRequests - count, resetAt }
  }

  return { allowed: false, remaining: 0, resetAt }
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Check whether a request is allowed under the rate limit.
 *
 * Uses Upstash Redis when configured, otherwise falls back to in-memory.
 * The function is async when Redis is active; callers should always `await`.
 */
export async function rateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const client = getRedis()
  if (client) {
    try {
      return await rateLimitRedis(client, key, config)
    } catch (err) {
      // If Redis is unreachable, fall back to memory so the app keeps working
      console.warn("Upstash Redis rate-limit error, falling back to memory:", err)
      return rateLimitMemory(key, config)
    }
  }
  return rateLimitMemory(key, config)
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
