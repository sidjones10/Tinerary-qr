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

    // Check if the user still has a profile (admin may have deleted it)
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .single()

    if (!profileData) {
      // Profile doesn't exist — this user was deleted by admin.
      // Sign them out so the session doesn't persist.
      await supabase.auth.signOut()
      return NextResponse.json(
        {
          success: false,
          message: "This account has been deleted. Please contact support if you believe this is an error.",
        },
        { status: 403 },
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
    let loginEvent: { revoke_token: string; created_at: string } | null = null
    try {
      const adminClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
      const { data: eventData, error: insertError } = await adminClient
        .from("login_events")
        .insert({
          user_id: data.user.id,
          ip_address: ipAddress,
          user_agent: userAgent,
        })
        .select("revoke_token, created_at")
        .single()

      if (insertError) {
        console.error("Failed to insert login event:", insertError)
      }
      loginEvent = eventData
    } catch (err) {
      console.error("login_events insert threw:", err)
    }

    // Send sign-in alert email — must await so Vercel doesn't kill the
    // serverless function before the Resend API call completes.
    const userName =
      data.user.user_metadata?.name ||
      data.user.user_metadata?.full_name ||
      email.split("@")[0]

    try {
      await sendSignInAlertEmail({
        email,
        name: userName,
        ipAddress,
        userAgent,
        revokeToken: loginEvent?.revoke_token ?? "unavailable",
        signInTime: loginEvent?.created_at ?? new Date().toISOString(),
      })
    } catch (err) {
      console.error("Failed to send sign-in alert email:", err)
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
