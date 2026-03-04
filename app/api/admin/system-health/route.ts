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

    const startTime = Date.now()
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString()
    const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    // Test database connectivity and response time
    const dbStart = Date.now()
    await adminClient.from("profiles").select("id", { count: "exact", head: true })
    const dbLatency = Date.now() - dbStart

    const [
      totalUsers,
      totalItineraries,
      totalImages,
      errorsLast24h,
      errorsLastWeek,
      loginEventsLast24h,
      storageResult,
    ] = await Promise.all([
      adminClient.from("profiles").select("*", { count: "exact", head: true }),
      adminClient.from("itineraries").select("*", { count: "exact", head: true }),
      adminClient.from("itineraries").select("image_url").not("image_url", "is", null),
      adminClient.from("error_logs").select("*", { count: "exact", head: true }).gte("created_at", oneDayAgo),
      adminClient.from("error_logs").select("*", { count: "exact", head: true }).gte("created_at", oneWeekAgo),
      adminClient.from("login_events").select("*", { count: "exact", head: true }).gte("created_at", oneDayAgo),
      adminClient.storage.listBuckets(),
    ])

    // Table row counts for DB size estimation
    const tableStats = [
      { name: "profiles", count: totalUsers.count || 0 },
      { name: "itineraries", count: totalItineraries.count || 0 },
      { name: "images", count: totalImages.data?.length || 0 },
    ]

    const apiLatency = Date.now() - startTime

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        latency: dbLatency,
        status: dbLatency < 1000 ? "healthy" : dbLatency < 3000 ? "degraded" : "unhealthy",
      },
      api: {
        latency: apiLatency,
        status: apiLatency < 2000 ? "healthy" : apiLatency < 5000 ? "degraded" : "unhealthy",
      },
      stats: {
        totalUsers: totalUsers.count || 0,
        totalItineraries: totalItineraries.count || 0,
        errorsLast24h: errorsLast24h.count || 0,
        errorsLastWeek: errorsLastWeek.count || 0,
        loginsLast24h: loginEventsLast24h.count || 0,
        storageBuckets: storageResult.data?.length || 0,
      },
      tables: tableStats,
      storage: {
        buckets: storageResult.data?.map((b: any) => ({ name: b.name, public: b.public })) || [],
      },
    })
  } catch (error: any) {
    console.error("Admin system health error:", error)
    return NextResponse.json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
