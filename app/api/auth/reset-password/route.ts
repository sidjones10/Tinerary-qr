import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getSiteUrl } from "@/lib/env-validation"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

// 3 password reset requests per IP per 15 minutes
const RESET_RATE_LIMIT = { maxRequests: 3, windowSeconds: 15 * 60 }

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const ip = getClientIp(request)
    const rl = await rateLimit(`reset:${ip}`, RESET_RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many password reset requests. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          },
        },
      )
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/auth/reset-password`,
    })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Password reset email sent",
    })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
