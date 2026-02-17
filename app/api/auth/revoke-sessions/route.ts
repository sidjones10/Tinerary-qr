import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

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
      // Redirect to auth page with an error message
      const redirectUrl = new URL("/auth", process.env.NEXT_PUBLIC_APP_URL || "https://tinerary-app.com")
      redirectUrl.searchParams.set("error", "invalid_token")
      redirectUrl.searchParams.set("message", "This security link is invalid or has expired.")
      return NextResponse.redirect(redirectUrl)
    }

    if (loginEvent.revoked) {
      const redirectUrl = new URL("/auth", process.env.NEXT_PUBLIC_APP_URL || "https://tinerary-app.com")
      redirectUrl.searchParams.set("message", "This session has already been revoked. Please sign in and change your password.")
      return NextResponse.redirect(redirectUrl)
    }

    // Mark the login event as revoked
    await supabaseAdmin
      .from("login_events")
      .update({ revoked: true, revoked_at: new Date().toISOString() })
      .eq("id", loginEvent.id)

    // Sign out the user from ALL sessions using the GoTrue admin REST API.
    // The JS client's auth.admin.signOut() requires a JWT, not a user ID,
    // so we call the admin endpoint directly.
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
        console.error("Error revoking sessions:", signOutRes.status, await signOutRes.text())
      }
    } catch (err) {
      console.error("Error revoking sessions:", err)
      // Still redirect - the token is already marked revoked
    }

    // Redirect to auth page with success message
    const redirectUrl = new URL("/auth", process.env.NEXT_PUBLIC_APP_URL || "https://tinerary-app.com")
    redirectUrl.searchParams.set("message", "All devices have been signed out. Please sign in with a new password to secure your account.")
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("Revoke sessions error:", error)
    const redirectUrl = new URL("/auth", process.env.NEXT_PUBLIC_APP_URL || "https://tinerary-app.com")
    redirectUrl.searchParams.set("error", "server_error")
    redirectUrl.searchParams.set("message", "Something went wrong. Please try again or contact support.")
    return NextResponse.redirect(redirectUrl)
  }
}
