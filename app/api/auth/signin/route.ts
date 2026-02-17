import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase/server"
import { sendSignInAlertEmail } from "@/lib/email-notifications"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

// 5 sign-in attempts per IP per 15 minutes
const SIGNIN_RATE_LIMIT = { maxRequests: 5, windowSeconds: 15 * 60 }

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const ip = getClientIp(request)
    const rl = await rateLimit(`signin:${ip}`, SIGNIN_RATE_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many sign-in attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          },
        },
      )
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 401 },
      )
    }

    // Extract request metadata for the sign-in alert
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "Unknown"
    const userAgent = request.headers.get("user-agent") || "Unknown"

    // Log the sign-in event and get the revoke token.
    // Use a service-role client so the insert + select isn't blocked by RLS —
    // the anon-key client doesn't have the new session cookies readable yet
    // within the same request that called signInWithPassword.
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: loginEvent } = await adminClient
      .from("login_events")
      .insert({
        user_id: data.user.id,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select("revoke_token, created_at")
      .single()

    // Send sign-in alert email (non-blocking — don't delay the sign-in response)
    if (loginEvent) {
      const userName =
        data.user.user_metadata?.name ||
        data.user.user_metadata?.full_name ||
        email.split("@")[0]

      sendSignInAlertEmail({
        email,
        name: userName,
        ipAddress,
        userAgent,
        revokeToken: loginEvent.revoke_token,
        signInTime: loginEvent.created_at,
      }).catch((err) => {
        console.error("Failed to send sign-in alert email:", err)
      })
    }

    return NextResponse.json({
      success: true,
      message: "Successfully signed in",
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error("Sign in error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
