import { NextResponse } from "next/server"

/**
 * Authorize a cron/scheduled-job request.
 *
 * Fails CLOSED: if CRON_SECRET is not configured the endpoint is refused
 * outright rather than left open to the public internet. These endpoints
 * send email and mutate account-deletion state, so an unset secret must
 * never mean "allow everyone".
 *
 * Returns a NextResponse to return immediately, or null when authorized.
 */
export function requireCron(request: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error("CRON_SECRET is not configured — refusing scheduled-job request")
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  const authHeader = request.headers.get("authorization")

  if (!authHeader || !timingSafeEqual(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return null
}

/** Constant-time string comparison, so a wrong secret leaks no timing signal. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}
