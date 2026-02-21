import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { writeAuditLog } from "@/lib/audit-log"
import { getClientIp } from "@/lib/rate-limit"

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

    // Use service role client with proper server-side auth config.
    // Without these options the client tries to manage sessions/tokens
    // which interferes with admin operations.
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 1. Sign out the user globally to invalidate all active sessions
    try {
      await adminClient.auth.admin.signOut(userId, "global")
    } catch {
      // User may not have active sessions — continue
    }

    // 2. Delete storage objects owned by this user.
    //    storage.objects has a foreign key to auth.users, so deleteUser()
    //    will fail with a constraint error if any files remain.
    const storageBuckets = ["user-avatars", "itinerary-images", "event-photos"]
    for (const bucket of storageBuckets) {
      try {
        const { data: files } = await adminClient.storage
          .from(bucket)
          .list(userId)
        if (files && files.length > 0) {
          const paths = files.map((f) => `${userId}/${f.name}`)
          await adminClient.storage.from(bucket).remove(paths)
        }
      } catch {
        // Bucket may not exist or be empty — continue
      }
    }

    // 3. Delete from auth.users — this is the critical step that
    //    invalidates all sessions and prevents sign-in. If this fails,
    //    we abort without touching application data so we don't end up
    //    in a broken state (profile deleted but auth user still exists).
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

    if (authError) {
      console.error("Error deleting auth user:", authError)
      return NextResponse.json(
        { success: false, error: "Failed to delete user: " + authError.message },
        { status: 500 }
      )
    }

    // 4. Auth user deleted — clean up related application data.
    //    These are best-effort; the user can no longer sign in regardless.
    await adminClient.from("itineraries").delete().eq("user_id", userId)
    await adminClient.from("saved_itineraries").delete().eq("user_id", userId)
    await adminClient.from("comments").delete().eq("user_id", userId)
    await adminClient.from("user_interactions").delete().eq("user_id", userId)
    await adminClient.from("notifications").delete().eq("user_id", userId)
    await adminClient.from("profiles").delete().eq("id", userId)

    // Audit log the deletion
    await writeAuditLog({
      actor_id: user.id,
      action: "delete_user",
      target_id: userId,
      ip_address: getClientIp(request),
    })

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
