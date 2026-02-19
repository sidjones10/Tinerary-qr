/**
 * Shared security helpers for API routes.
 */

import { NextResponse } from "next/server"

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  "https://tinerary-app.com",
  "https://www.tinerary-app.com",
].filter(Boolean) as string[]

/**
 * Build CORS headers for an API response.
 *
 * Only allows requests from the app's own domain(s). If the origin is not
 * in the allow-list the Access-Control-Allow-Origin header is omitted, which
 * causes browsers to block the response.
 */
export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") || ""
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  }

  // In development, allow localhost origins
  const isDev = process.env.NODE_ENV === "development"
  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    (isDev && (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")))

  if (isAllowed) {
    headers["Access-Control-Allow-Origin"] = origin
  }

  return headers
}

/**
 * Handle CORS preflight (OPTIONS) requests.
 */
export function handlePreflight(request: Request): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  })
}
