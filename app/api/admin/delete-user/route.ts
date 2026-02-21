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

    // Validate service role key exists
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set — cannot perform admin deletion")
      return NextResponse.json(
        { success: false, error: "Server configuration error: service role key is missing" },
        { status: 500 }
      )
    }

    // Admin client for auth and public-schema operations
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

    // Separate client for querying the storage schema directly.
    // storage.objects has a FK to auth.users, so we must delete all
    // objects owned by this user before we can delete the auth user.
    const storageDbClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: { schema: "storage" },
      }
    )

    // 1. Delete ALL storage objects owned by this user (any bucket, any depth).
    //    This hits the storage.objects table directly instead of trying to
    //    list/remove from each bucket, which misses nested folders.
    const { error: storageError } = await storageDbClient
      .from("objects")
      .delete()
      .eq("owner_id", userId)

    if (storageError) {
      console.error("Error deleting storage objects:", storageError)
      // Also try the legacy `owner` column in case this is an older Supabase version
      await storageDbClient.from("objects").delete().eq("owner", userId)
    }

    // 2. Clean up application data BEFORE deleting auth user.
    //    This avoids FK issues from app tables that reference auth.users.
    await adminClient.from("itineraries").delete().eq("user_id", userId)
    await adminClient.from("saved_itineraries").delete().eq("user_id", userId)
    await adminClient.from("comments").delete().eq("user_id", userId)
    await adminClient.from("user_interactions").delete().eq("user_id", userId)
    await adminClient.from("notifications").delete().eq("user_id", userId)
    await adminClient.from("profiles").delete().eq("id", userId)

    // 3. Delete the auth user
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

    if (authError) {
      console.error("Error deleting auth user:", authError)
      return NextResponse.json(
        { success: false, error: "Failed to delete auth user: " + authError.message },
        { status: 500 }
      )
    }

    // 4. Verify the user was actually removed from auth.users
    const { data: checkUser } = await adminClient.auth.admin.getUserById(userId)

    if (checkUser?.user) {
      console.error("deleteUser returned success but user still exists in auth.users")
      return NextResponse.json(
        { success: false, error: "User deletion was not confirmed — the auth user still exists. Check Supabase logs for FK constraint errors." },
        { status: 500 }
      )
    }

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
