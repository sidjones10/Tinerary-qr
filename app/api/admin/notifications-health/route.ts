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

  return { adminClient }
}

export async function GET(request: NextRequest) {
  try {
    const result = await getAdminClient()
    if ("error" in result && !("adminClient" in result)) return result.error
    const { adminClient } = result as { adminClient: any }

    const oneDayAgo = new Date(Date.now() - 86400000).toISOString()
    const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    const [
      totalNotifications,
      unreadNotifications,
      recentNotifications,
      pushSubscriptions,
      notificationsLast24h,
      notificationsLastWeek,
      emailLogsResult,
    ] = await Promise.all([
      adminClient.from("notifications").select("*", { count: "exact", head: true }),
      adminClient.from("notifications").select("*", { count: "exact", head: true }).eq("is_read", false),
      adminClient.from("notifications").select(`*, profiles:user_id (name, email)`).order("created_at", { ascending: false }).limit(30),
      adminClient.from("push_subscriptions").select("*", { count: "exact", head: true }),
      adminClient.from("notifications").select("*", { count: "exact", head: true }).gte("created_at", oneDayAgo),
      adminClient.from("notifications").select("*", { count: "exact", head: true }).gte("created_at", oneWeekAgo),
      adminClient.from("email_logs").select("*").order("created_at", { ascending: false }).limit(30),
    ])

    // Aggregate notification types
    const typeBreakdown: Record<string, number> = {}
    recentNotifications.data?.forEach((n: any) => {
      typeBreakdown[n.type] = (typeBreakdown[n.type] || 0) + 1
    })

    // Email delivery stats
    const emailStats = {
      total: emailLogsResult.data?.length || 0,
      delivered: emailLogsResult.data?.filter((e: any) => e.status === "delivered").length || 0,
      failed: emailLogsResult.data?.filter((e: any) => e.status === "failed" || e.status === "bounced").length || 0,
      pending: emailLogsResult.data?.filter((e: any) => e.status === "pending" || e.status === "sent").length || 0,
    }

    return NextResponse.json({
      recentNotifications: recentNotifications.data || [],
      emailLogs: emailLogsResult.data || [],
      stats: {
        totalNotifications: totalNotifications.count || 0,
        unreadNotifications: unreadNotifications.count || 0,
        pushSubscribers: pushSubscriptions.count || 0,
        notificationsLast24h: notificationsLast24h.count || 0,
        notificationsLastWeek: notificationsLastWeek.count || 0,
        typeBreakdown,
        emailStats,
      },
    })
  } catch (error: any) {
    console.error("Admin notifications health error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
