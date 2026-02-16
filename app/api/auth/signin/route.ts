import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { sendSignInAlertEmail } from "@/lib/email-notifications"

export async function POST(request: Request) {
  try {
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

    // Log the sign-in event and get the revoke token
    const { data: loginEvent } = await supabase
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
