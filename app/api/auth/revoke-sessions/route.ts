import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import crypto from "crypto"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Missing revoke token" },
        { status: 400 },
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tinerary-app.com"

    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured")
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 },
      )
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Look up the login event by revoke token
    const { data: loginEvent, error: lookupError } = await supabaseAdmin
      .from("login_events")
      .select("id, user_id, revoked")
      .eq("revoke_token", token)
      .single()

    if (lookupError || !loginEvent) {
      const redirectUrl = new URL("/auth", appUrl)
      redirectUrl.searchParams.set("error", "invalid_token")
      redirectUrl.searchParams.set("message", "This security link is invalid or has expired.")
      return NextResponse.redirect(redirectUrl)
    }

    if (loginEvent.revoked) {
      const redirectUrl = new URL("/auth/forgot-password", appUrl)
      redirectUrl.searchParams.set("revoked", "already")
      return NextResponse.redirect(redirectUrl)
    }

    // Mark the login event as revoked
    await supabaseAdmin
      .from("login_events")
      .update({ revoked: true, revoked_at: new Date().toISOString() })
      .eq("id", loginEvent.id)

    // Get the user's email so we can send a password reset
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
      loginEvent.user_id,
    )
    const userEmail = userData?.user?.email

    // 1) Try to invalidate ALL sessions via the GoTrue admin endpoint
    try {
      const signOutRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users/${loginEvent.user_id}/sessions`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
        },
      )
      if (!signOutRes.ok) {
        console.error(
          "DELETE sessions returned:",
          signOutRes.status,
          await signOutRes.text(),
        )
      }
    } catch (err) {
      console.error("DELETE sessions error:", err)
    }

    // 2) Change the password to a random string so the attacker can't log in
    //    again once their current JWT expires
    const randomPassword = crypto.randomBytes(32).toString("base64url")
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
      loginEvent.user_id,
      { password: randomPassword },
    )
    if (updateErr) {
      console.error("Failed to reset user password:", updateErr)
    }

    // 3) Send a password reset email so the real user can regain access
    if (userEmail) {
      const { error: resetErr } =
        await supabaseAdmin.auth.resetPasswordForEmail(userEmail, {
          redirectTo: `${appUrl}/auth/callback?next=/auth/reset-password`,
        })
      if (resetErr) {
        console.error("Failed to send password reset email:", resetErr)
      }
    }

    // Redirect to forgot-password page with security context
    const redirectUrl = new URL("/auth/forgot-password", appUrl)
    redirectUrl.searchParams.set("revoked", "true")
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("Revoke sessions error:", error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tinerary-app.com"
    const redirectUrl = new URL("/auth/forgot-password", appUrl)
    redirectUrl.searchParams.set("error", "server_error")
    return NextResponse.redirect(redirectUrl)
  }
}
