import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

async function getAdminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) }

  const { data: profile } = await supabase.from("profiles").select("is_admin, role").eq("id", user.id).single()
  if (!profile?.is_admin && profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) }
  }

  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  return { adminClient, user }
}

export async function GET(request: NextRequest) {
  try {
    const result = await getAdminClient()
    if ("error" in result && !("adminClient" in result)) return result.error
    const { adminClient } = result as { adminClient: any }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "pending"

    const [reportsResult, flaggedContentResult, recentItinerariesResult] = await Promise.all([
      adminClient
        .from("reports")
        .select(`*, reporter:reporter_id (name, email), reported_user:reported_user_id (name, email)`)
        .eq("status", filter === "all" ? undefined : filter)
        .order("created_at", { ascending: false })
        .limit(50),
      adminClient
        .from("itineraries")
        .select(`id, title, user_id, is_public, created_at, profiles:user_id (name, email)`)
        .order("created_at", { ascending: false })
        .limit(20),
      adminClient
        .from("comments")
        .select(`id, content, user_id, created_at, profiles:user_id (name, email)`)
        .order("created_at", { ascending: false })
        .limit(20),
    ])

    // Get report counts by status
    const [pendingCount, reviewedCount, resolvedCount] = await Promise.all([
      adminClient.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
      adminClient.from("reports").select("*", { count: "exact", head: true }).eq("status", "reviewed"),
      adminClient.from("reports").select("*", { count: "exact", head: true }).eq("status", "resolved"),
    ])

    return NextResponse.json({
      reports: reportsResult.data || [],
      recentContent: flaggedContentResult.data || [],
      recentComments: recentItinerariesResult.data || [],
      counts: {
        pending: pendingCount.count || 0,
        reviewed: reviewedCount.count || 0,
        resolved: resolvedCount.count || 0,
      },
    })
  } catch (error: any) {
    console.error("Admin moderation error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await getAdminClient()
    if ("error" in result && !("adminClient" in result)) return result.error
    const { adminClient, user } = result as { adminClient: any; user: any }

    const body = await request.json()
    const { action, contentId, contentType, reason } = body

    if (action === "hide") {
      if (contentType === "itinerary") {
        await adminClient.from("itineraries").update({ is_public: false }).eq("id", contentId)
      } else if (contentType === "comment") {
        await adminClient.from("comments").delete().eq("id", contentId)
      }
      return NextResponse.json({ success: true })
    }

    if (action === "resolve_report") {
      await adminClient.from("reports").update({
        status: "resolved",
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        resolution_note: reason,
      }).eq("id", contentId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Admin moderation POST error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
