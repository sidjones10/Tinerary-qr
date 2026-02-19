import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    // Authenticate the caller
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Verify admin privileges
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, role")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin && profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      )
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own account from admin panel" },
        { status: 400 }
      )
    }

    // Validate service role key exists — without it, admin operations silently fail
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set — cannot perform admin deletion")
      return NextResponse.json(
        { success: false, error: "Server configuration error: service role key is missing" },
        { status: 500 }
      )
    }

    // Use service role client for admin operations
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Delete from auth.users FIRST - this is the critical step that
    // invalidates all sessions and prevents sign-in. If this fails,
    // we abort without touching any data so we don't end up in a
    // broken state (profile deleted but auth user still exists).
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

    if (authError) {
      console.error("Error deleting auth user:", authError)
      return NextResponse.json(
        { success: false, error: "Failed to delete user: " + authError.message },
        { status: 500 }
      )
    }

    // Auth user deleted — now clean up related application data.
    // These are best-effort; the user can no longer sign in regardless.
    await adminClient.from("itineraries").delete().eq("user_id", userId)
    await adminClient.from("saved_itineraries").delete().eq("user_id", userId)
    await adminClient.from("comments").delete().eq("user_id", userId)
    await adminClient.from("user_interactions").delete().eq("user_id", userId)
    await adminClient.from("notifications").delete().eq("user_id", userId)
    await adminClient.from("profiles").delete().eq("id", userId)

    return NextResponse.json({
      success: true,
      message: "User permanently deleted",
    })
  } catch (error) {
    console.error("Admin delete user error:", error)
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
